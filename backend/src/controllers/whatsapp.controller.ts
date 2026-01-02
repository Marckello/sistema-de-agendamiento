import { Request, Response } from 'express';
import { whatsappService } from '../services/whatsapp.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WhatsAppController {
  /**
   * Iniciar conexión y obtener QR
   */
  async connect(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'No autorizado' });
      }
      
      const result = await whatsappService.initializeClient(tenantId);
      
      res.json({
        success: true,
        status: result.status,
        qrCode: result.qrCode
      });
    } catch (error: any) {
      console.error('Error conectando WhatsApp:', error);
      res.status(500).json({ error: error.message || 'Error conectando WhatsApp' });
    }
  }
  
  /**
   * Obtener estado actual
   */
  async getStatus(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'No autorizado' });
      }
      
      const status = await whatsappService.getStatus(tenantId);
      
      res.json({
        success: true,
        ...status
      });
    } catch (error: any) {
      console.error('Error obteniendo estado:', error);
      res.status(500).json({ error: error.message || 'Error obteniendo estado' });
    }
  }
  
  /**
   * Obtener QR Code
   */
  async getQR(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'No autorizado' });
      }
      
      const qrCode = whatsappService.getQRCode(tenantId);
      
      if (!qrCode) {
        return res.status(404).json({ error: 'QR no disponible' });
      }
      
      res.json({
        success: true,
        qrCode
      });
    } catch (error: any) {
      console.error('Error obteniendo QR:', error);
      res.status(500).json({ error: error.message || 'Error obteniendo QR' });
    }
  }
  
  /**
   * Desconectar
   */
  async disconnect(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'No autorizado' });
      }
      
      await whatsappService.disconnectClient(tenantId);
      
      res.json({
        success: true,
        message: 'WhatsApp desconectado'
      });
    } catch (error: any) {
      console.error('Error desconectando:', error);
      res.status(500).json({ error: error.message || 'Error desconectando' });
    }
  }
  
  /**
   * Enviar mensaje de prueba
   */
  async sendTestMessage(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'No autorizado' });
      }
      
      const { phone, message } = req.body;
      
      if (!phone || !message) {
        return res.status(400).json({ error: 'Se requiere phone y message' });
      }
      
      const result = await whatsappService.sendMessage(tenantId, phone, message);
      
      res.json({
        success: result,
        message: 'Mensaje enviado'
      });
    } catch (error: any) {
      console.error('Error enviando mensaje:', error);
      res.status(500).json({ error: error.message || 'Error enviando mensaje' });
    }
  }
  
  /**
   * Obtener configuración
   */
  async getConfig(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'No autorizado' });
      }
      
      const session = await whatsappService.getSession(tenantId);
      
      if (!session) {
        // Crear sesión vacía
        const newSession = await prisma.whatsAppSession.create({
          data: { tenantId }
        });
        return res.json({ success: true, config: newSession });
      }
      
      res.json({
        success: true,
        config: {
          autoConnectEnabled: session.autoConnectEnabled,
          connectAt: session.connectAt,
          disconnectAt: session.disconnectAt,
          reminderEnabled: session.reminderEnabled,
          reminder24hEnabled: session.reminder24hEnabled,
          reminder1hEnabled: session.reminder1hEnabled,
          reminderMessage24h: session.reminderMessage24h,
          reminderMessage1h: session.reminderMessage1h,
          autoReplyEnabled: session.autoReplyEnabled,
          autoReplyMessage: session.autoReplyMessage,
          totalMessagesSent: session.totalMessagesSent,
          totalMessagesReceived: session.totalMessagesReceived
        }
      });
    } catch (error: any) {
      console.error('Error obteniendo configuración:', error);
      res.status(500).json({ error: error.message || 'Error obteniendo configuración' });
    }
  }
  
  /**
   * Actualizar configuración
   */
  async updateConfig(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'No autorizado' });
      }
      
      const config = req.body;
      
      await whatsappService.updateConfig(tenantId, config);
      
      res.json({
        success: true,
        message: 'Configuración actualizada'
      });
    } catch (error: any) {
      console.error('Error actualizando configuración:', error);
      res.status(500).json({ error: error.message || 'Error actualizando configuración' });
    }
  }
  
  /**
   * Obtener logs de mensajes
   */
  async getMessageLogs(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'No autorizado' });
      }
      
      const { limit, offset, direction } = req.query;
      
      const logs = await whatsappService.getMessageLogs(tenantId, {
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
        direction: direction as 'IN' | 'OUT' | undefined
      });
      
      res.json({
        success: true,
        logs
      });
    } catch (error: any) {
      console.error('Error obteniendo logs:', error);
      res.status(500).json({ error: error.message || 'Error obteniendo logs' });
    }
  }
  
  /**
   * Enviar recordatorio manual a una cita
   */
  async sendReminder(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'No autorizado' });
      }
      
      const { appointmentId } = req.params;
      
      // Obtener la cita
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          tenantId
        },
        include: {
          client: true,
          service: true
        }
      });
      
      if (!appointment) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }
      
      // Obtener configuración
      const session = await whatsappService.getSession(tenantId);
      if (!session) {
        return res.status(400).json({ error: 'WhatsApp no configurado' });
      }
      
      // Formatear mensaje
      const time = new Date(appointment.startTime).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const date = new Date(appointment.startTime).toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      
      let message = session.reminderMessage24h
        .replace('{clientName}', appointment.client.firstName)
        .replace('{serviceName}', appointment.service.name)
        .replace('{time}', time)
        .replace('{date}', date);
      
      // Enviar
      await whatsappService.sendMessage(tenantId, appointment.client.phone, message, {
        appointmentId: appointment.id,
        isReminder: true
      });
      
      res.json({
        success: true,
        message: 'Recordatorio enviado'
      });
    } catch (error: any) {
      console.error('Error enviando recordatorio:', error);
      res.status(500).json({ error: error.message || 'Error enviando recordatorio' });
    }
  }
}

export const whatsappController = new WhatsAppController();
