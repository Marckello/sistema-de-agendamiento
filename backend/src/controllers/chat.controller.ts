import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AIService } from '../services/ai.service.js';
import { z } from 'zod';

const chatMessageSchema = z.object({
  message: z.string().min(1, 'El mensaje no puede estar vacío'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
});

const executeActionSchema = z.object({
  action: z.object({
    action: z.enum(['create', 'cancel', 'reschedule']),
    details: z.record(z.any()),
  }),
});

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

// Ejecutar una acción confirmada
export const executeAction = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.canUseAI) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para usar el asistente de IA',
    });
  }

  const { action } = executeActionSchema.parse(req.body);

  const aiService = new AIService({
    userId: req.user.id,
    tenantId: req.tenant!.id,
    userRole: req.user.role,
    userName: `${req.user.firstName} ${req.user.lastName}`,
  });

  const result = await aiService.executeAction(action);

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
