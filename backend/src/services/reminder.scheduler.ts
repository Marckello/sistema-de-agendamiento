import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { whatsappService } from './whatsapp.service';

const prisma = new PrismaClient();

class ReminderScheduler {
  private isRunning: boolean = false;
  
  /**
   * Iniciar el scheduler de recordatorios
   */
  start() {
    if (this.isRunning) {
      console.log('[Scheduler] Ya está corriendo');
      return;
    }
    
    console.log('[Scheduler] Iniciando scheduler de recordatorios...');
    
    // Ejecutar cada 15 minutos para verificar recordatorios
    cron.schedule('*/15 * * * *', async () => {
      await this.processReminders();
    });
    
    // Resetear contadores diarios a medianoche
    cron.schedule('0 0 * * *', async () => {
      await whatsappService.resetDailyCounters();
    });
    
    // Auto-conectar sesiones que deben estar activas (cada 5 minutos)
    cron.schedule('*/5 * * * *', async () => {
      await this.checkAutoConnect();
    });
    
    this.isRunning = true;
    console.log('[Scheduler] Scheduler iniciado correctamente');
  }
  
  /**
   * Procesar recordatorios pendientes
   */
  async processReminders() {
    console.log('[Scheduler] Procesando recordatorios...');
    
    try {
      const now = new Date();
      
      // Buscar citas que necesitan recordatorio de 24 horas
      const tomorrow = new Date(now);
      tomorrow.setHours(now.getHours() + 24);
      
      const tomorrowStart = new Date(tomorrow);
      tomorrowStart.setMinutes(tomorrow.getMinutes() - 10);
      
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setMinutes(tomorrow.getMinutes() + 10);
      
      // Recordatorios de 24 horas
      const appointments24h = await prisma.appointment.findMany({
        where: {
          status: 'CONFIRMED',
          startTime: {
            gte: tomorrowStart.toISOString(),
            lte: tomorrowEnd.toISOString()
          },
          // No enviar si ya se envió recordatorio
          NOT: {
            notes: {
              contains: '[REMINDER_24H_SENT]'
            }
          }
        },
        include: {
          client: true,
          service: true,
          tenant: true
        }
      });
      
      for (const appointment of appointments24h) {
        await this.sendReminder(appointment, '24h');
      }
      
      // Recordatorios de 1 hora
      const oneHourLater = new Date(now);
      oneHourLater.setHours(now.getHours() + 1);
      
      const oneHourStart = new Date(oneHourLater);
      oneHourStart.setMinutes(oneHourLater.getMinutes() - 10);
      
      const oneHourEnd = new Date(oneHourLater);
      oneHourEnd.setMinutes(oneHourLater.getMinutes() + 10);
      
      const appointments1h = await prisma.appointment.findMany({
        where: {
          status: 'CONFIRMED',
          startTime: {
            gte: oneHourStart.toISOString(),
            lte: oneHourEnd.toISOString()
          },
          NOT: {
            notes: {
              contains: '[REMINDER_1H_SENT]'
            }
          }
        },
        include: {
          client: true,
          service: true,
          tenant: true
        }
      });
      
      for (const appointment of appointments1h) {
        await this.sendReminder(appointment, '1h');
      }
      
      console.log(`[Scheduler] Procesados: ${appointments24h.length} recordatorios 24h, ${appointments1h.length} recordatorios 1h`);
      
    } catch (error) {
      console.error('[Scheduler] Error procesando recordatorios:', error);
    }
  }
  
  /**
   * Enviar recordatorio individual
   */
  private async sendReminder(
    appointment: any,
    type: '24h' | '1h'
  ) {
    try {
      const tenantId = appointment.tenantId;
      
      // Verificar que el tenant tenga WhatsApp configurado
      const session = await whatsappService.getSession(tenantId);
      if (!session) {
        console.log(`[Scheduler] Tenant ${tenantId} no tiene WhatsApp configurado`);
        return;
      }
      
      // Verificar que los recordatorios estén habilitados
      if (!session.reminderEnabled) {
        console.log(`[Scheduler] Tenant ${tenantId} tiene recordatorios deshabilitados`);
        return;
      }
      
      if (type === '24h' && !session.reminder24hEnabled) {
        return;
      }
      
      if (type === '1h' && !session.reminder1hEnabled) {
        return;
      }
      
      // Verificar que el cliente tenga teléfono
      if (!appointment.client.phone) {
        console.log(`[Scheduler] Cliente ${appointment.client.id} no tiene teléfono`);
        return;
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
      
      const templateMessage = type === '24h' 
        ? session.reminderMessage24h 
        : session.reminderMessage1h;
      
      const message = templateMessage
        .replace(/{clientName}/g, appointment.client.firstName)
        .replace(/{serviceName}/g, appointment.service.name)
        .replace(/{time}/g, time)
        .replace(/{date}/g, date);
      
      // Enviar mensaje
      try {
        await whatsappService.sendMessage(tenantId, appointment.client.phone, message, {
          appointmentId: appointment.id,
          isReminder: true
        });
        
        // Marcar recordatorio como enviado
        const marker = type === '24h' ? '[REMINDER_24H_SENT]' : '[REMINDER_1H_SENT]';
        const currentNotes = appointment.notes || '';
        
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            notes: currentNotes + '\n' + marker + ` ${new Date().toISOString()}`
          }
        });
        
        console.log(`[Scheduler] Recordatorio ${type} enviado para cita ${appointment.id}`);
        
      } catch (sendError: any) {
        console.error(`[Scheduler] Error enviando recordatorio:`, sendError.message);
      }
      
    } catch (error) {
      console.error('[Scheduler] Error en sendReminder:', error);
    }
  }
  
  /**
   * Verificar y ejecutar auto-conexión de sesiones
   */
  private async checkAutoConnect() {
    try {
      const sessions = await prisma.whatsAppSession.findMany({
        where: {
          autoConnectEnabled: true,
          status: {
            in: ['DISCONNECTED', 'SLEEPING']
          }
        }
      });
      
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinutes;
      
      for (const session of sessions) {
        if (!session.connectAt || !session.disconnectAt) continue;
        
        const [connectHour, connectMinutes] = session.connectAt.split(':').map(Number);
        const [disconnectHour, disconnectMinutes] = session.disconnectAt.split(':').map(Number);
        
        const connectTime = connectHour * 60 + connectMinutes;
        const disconnectTime = disconnectHour * 60 + disconnectMinutes;
        
        // Verificar si estamos en horario de operación
        const isInOperatingHours = currentTime >= connectTime && currentTime < disconnectTime;
        
        if (isInOperatingHours && session.status !== 'CONNECTED') {
          console.log(`[Scheduler] Auto-conectando sesión de tenant ${session.tenantId}`);
          
          try {
            await whatsappService.initializeClient(session.tenantId);
          } catch (error) {
            console.error(`[Scheduler] Error auto-conectando:`, error);
          }
        }
      }
      
    } catch (error) {
      console.error('[Scheduler] Error en checkAutoConnect:', error);
    }
  }
}

export const reminderScheduler = new ReminderScheduler();
