import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AIService } from '../services/ai.service.js';
import { z } from 'zod';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';

const chatMessageSchema = z.object({
  message: z.string().min(1, 'El mensaje no puede estar vacío'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
});

const executeActionSchema = z.object({
  action: z.object({
    action: z.enum(['create', 'cancel', 'reschedule', 'create_client']),
    params: z.record(z.any()).optional(),
    details: z.record(z.any()).optional(),
  }),
});

// Helper para obtener OpenAI client
function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no está configurada');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Enviar mensaje al chat
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  // Verificar que el usuario tiene permiso de IA
  if (!req.user?.canUseAI) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para usar el asistente de IA',
    });
  }

  const { message, conversationHistory } = chatMessageSchema.parse(req.body);

  const aiService = new AIService({
    userId: req.user.id,
    tenantId: req.tenant!.id,
    userRole: req.user.role,
    userName: `${req.user.firstName} ${req.user.lastName}`,
  });

  const result = await aiService.chat(message, conversationHistory);

  res.json({
    success: true,
    data: {
      response: result.response,
      action: result.action,
    },
  });
});

// Enviar audio para transcripción y procesamiento
export const sendAudio = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.canUseAI) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para usar el asistente de IA',
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No se recibió archivo de audio',
    });
  }

  try {
    const openai = getOpenAI();

    // Guardar temporalmente el archivo para Whisper
    const tempPath = path.join(os.tmpdir(), `audio_${Date.now()}.webm`);
    fs.writeFileSync(tempPath, req.file.buffer);

    // Transcribir con Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: 'whisper-1',
      language: 'es',
    });

    // Eliminar archivo temporal
    fs.unlinkSync(tempPath);

    const transcribedText = transcription.text;

    // Parsear conversation history
    let conversationHistory: Array<{role: string, content: string}> = [];
    try {
      if (req.body.conversationHistory) {
        conversationHistory = JSON.parse(req.body.conversationHistory);
      }
    } catch {
      conversationHistory = [];
    }

    // Procesar el mensaje transcrito con el AI Service
    const aiService = new AIService({
      userId: req.user.id,
      tenantId: req.tenant!.id,
      userRole: req.user.role,
      userName: `${req.user.firstName} ${req.user.lastName}`,
    });

    const result = await aiService.chat(transcribedText, conversationHistory);

    res.json({
      success: true,
      data: {
        transcription: transcribedText,
        response: result.response,
        action: result.action,
      },
    });
  } catch (error: any) {
    console.error('Error procesando audio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el audio: ' + error.message,
    });
  }
});

// Enviar imagen para análisis con GPT-4 Vision
export const sendImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.canUseAI) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para usar el asistente de IA',
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No se recibió archivo de imagen',
    });
  }

  try {
    const openai = getOpenAI();

    // Convertir imagen a base64
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Parsear prompt y conversation history
    const prompt = req.body.prompt || 'Describe esta imagen';
    let conversationHistory: Array<{role: string, content: string}> = [];
    try {
      if (req.body.conversationHistory) {
        conversationHistory = JSON.parse(req.body.conversationHistory);
      }
    } catch {
      conversationHistory = [];
    }

    // Analizar imagen con GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente de gestión de citas para CitasPro. Analiza las imágenes que te envíen.
          
Si la imagen es una captura de pantalla de un mensaje o agenda, extrae la información relevante.
Si es una foto de un documento, extrae los datos importantes.
Si es cualquier otra cosa, describe lo que ves y pregunta cómo puedes ayudar.

Responde siempre en español y de forma conversacional.`,
        },
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const aiResponse = response.choices[0]?.message?.content || 'No pude analizar la imagen.';

    res.json({
      success: true,
      data: {
        response: aiResponse,
      },
    });
  } catch (error: any) {
    console.error('Error procesando imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la imagen: ' + error.message,
    });
  }
});

// Ejecutar una acción confirmada
export const executeAction = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.canUseAI) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para usar el asistente de IA',
    });
  }

  const { action } = executeActionSchema.parse(req.body);

  // Normalizar estructura: usar params o details
  const normalizedAction = {
    action: action.action,
    params: action.params || action.details || {},
  };

  const aiService = new AIService({
    userId: req.user.id,
    tenantId: req.tenant!.id,
    userRole: req.user.role,
    userName: `${req.user.firstName} ${req.user.lastName}`,
  });

  const result = await aiService.executeAction(normalizedAction);

  res.json({
    success: true,
    data: {
      result,
    },
  });
});

// Verificar si el usuario puede usar IA
export const checkAccess = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      canUseAI: req.user?.canUseAI || false,
    },
  });
});
