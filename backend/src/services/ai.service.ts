import OpenAI from 'openai';
import prisma from '../config/database.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatContext {
  userId: string;
  tenantId: string;
  userRole: string;
  userName: string;
}

interface AppointmentAction {
  action: 'create' | 'cancel' | 'reschedule' | 'query';
  details: Record<string, any>;
  confirmation?: string;
}

const SYSTEM_PROMPT = `Eres un asistente de gestión de citas para CitasPro. Tu trabajo es ayudar a consultar, crear, cancelar y reagendar citas.

REGLAS IMPORTANTES:
1. Siempre responde en español
2. Sé conciso y profesional
3. Para CUALQUIER acción que modifique citas (crear, cancelar, reagendar), SIEMPRE pide confirmación antes de ejecutar
4. Cuando consultes citas, muestra la información de forma clara y organizada
5. Usa formato de hora 12h (ej: 4:00 PM) para mejor legibilidad

CAPACIDADES:
- Consultar citas de hoy, mañana, una fecha específica
- Consultar citas por empleado
- Ver resumen de citas (cuántas hay, estados)
- Crear nuevas citas (requiere confirmación)
- Cancelar citas (requiere confirmación)
- Reagendar citas (requiere confirmación)

Cuando el usuario pida una acción, responde con un JSON en el siguiente formato si necesitas ejecutar una función:
{"action": "query|create|cancel|reschedule", "params": {...}}

Para consultas simples, responde directamente con texto.`;

export class AIService {
  private context: ChatContext;

  constructor(context: ChatContext) {
    this.context = context;
  }

  async chat(message: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<{
    response: string;
    action?: AppointmentAction;
  }> {
    try {
      // Obtener contexto de citas para el usuario
      const appointmentsContext = await this.getAppointmentsContext();

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: `CONTEXTO ACTUAL:\n${appointmentsContext}` },
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user', content: message },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content || 'Lo siento, no pude procesar tu solicitud.';

      // Detectar si hay una acción pendiente
      const action = this.parseAction(response);

      return { response, action };
    } catch (error: any) {
      console.error('Error en AI Service:', error);
      throw new Error('Error al procesar la solicitud de IA: ' + error.message);
    }
  }

  private async getAppointmentsContext(): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Filtro base según el rol
    const baseWhere: any = {
      tenantId: this.context.tenantId,
      status: { notIn: ['CANCELED'] },
    };

    // Si no es SUPER_ADMIN, solo ve sus propias citas
    if (this.context.userRole !== 'SUPER_ADMIN') {
      baseWhere.employeeId = this.context.userId;
    }

    // Citas de hoy
    const todayAppointments = await prisma.appointment.findMany({
      where: {
        ...baseWhere,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        client: { select: { firstName: true, lastName: true, phone: true } },
        service: { select: { name: true, duration: true } },
        employee: { select: { firstName: true, lastName: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    // Citas de la semana
    const weekAppointments = await prisma.appointment.findMany({
      where: {
        ...baseWhere,
        date: {
          gte: today,
          lt: weekEnd,
        },
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
        service: { select: { name: true } },
        employee: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    // Formatear contexto
    let context = `Usuario: ${this.context.userName} (${this.context.userRole})\n`;
    context += `Fecha actual: ${today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;

    context += `=== CITAS DE HOY (${todayAppointments.length}) ===\n`;
    if (todayAppointments.length === 0) {
      context += 'No hay citas programadas para hoy.\n';
    } else {
      todayAppointments.forEach((apt, i) => {
        const time = apt.startTime;
        context += `${i + 1}. ${time} - ${apt.client.firstName} ${apt.client.lastName} | ${apt.service.name} | Estado: ${apt.status}\n`;
        if (this.context.userRole === 'SUPER_ADMIN') {
          context += `   Empleado: ${apt.employee.firstName} ${apt.employee.lastName}\n`;
        }
      });
    }

    context += `\n=== RESUMEN SEMANAL ===\n`;
    context += `Total citas próximos 7 días: ${weekAppointments.length}\n`;

    // Agrupar por día
    const byDay: Record<string, number> = {};
    weekAppointments.forEach(apt => {
      const dayKey = new Date(apt.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
      byDay[dayKey] = (byDay[dayKey] || 0) + 1;
    });
    Object.entries(byDay).forEach(([day, count]) => {
      context += `- ${day}: ${count} cita(s)\n`;
    });

    return context;
  }

  private parseAction(response: string): AppointmentAction | undefined {
    // Intentar extraer JSON de la respuesta
    const jsonMatch = response.match(/\{[\s\S]*"action"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.action && ['create', 'cancel', 'reschedule', 'query'].includes(parsed.action)) {
          return parsed as AppointmentAction;
        }
      } catch {
        // No es un JSON válido, ignorar
      }
    }
    return undefined;
  }

  async executeAction(action: AppointmentAction): Promise<string> {
    switch (action.action) {
      case 'create':
        return this.createAppointment(action.details);
      case 'cancel':
        return this.cancelAppointment(action.details);
      case 'reschedule':
        return this.rescheduleAppointment(action.details);
      default:
        return 'Acción no reconocida';
    }
  }

  private async createAppointment(details: any): Promise<string> {
    // Implementación simplificada - en producción validar todos los campos
    try {
      const service = await prisma.service.findFirst({
        where: { id: details.serviceId },
      });
      
      if (!service) {
        return '❌ Servicio no encontrado';
      }

      const appointment = await prisma.appointment.create({
        data: {
          tenantId: this.context.tenantId,
          clientId: details.clientId,
          serviceId: details.serviceId,
          employeeId: details.employeeId || this.context.userId,
          date: new Date(details.date),
          startTime: details.startTime,
          endTime: details.endTime,
          duration: service.duration,
          price: service.price,
          status: 'CONFIRMED',
        },
        include: {
          client: true,
          service: true,
        },
      });

      return `✅ Cita creada exitosamente:\n- Cliente: ${appointment.client.firstName} ${appointment.client.lastName}\n- Servicio: ${appointment.service.name}\n- Fecha: ${new Date(appointment.date).toLocaleDateString('es-ES')}\n- Hora: ${appointment.startTime}`;
    } catch (error: any) {
      return `❌ Error al crear la cita: ${error.message}`;
    }
  }

  private async cancelAppointment(details: any): Promise<string> {
    try {
      const appointment = await prisma.appointment.update({
        where: { id: details.appointmentId },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
          cancelReason: details.reason || 'Cancelado por asistente IA',
        },
        include: {
          client: true,
          service: true,
        },
      });

      return `✅ Cita cancelada:\n- Cliente: ${appointment.client.firstName} ${appointment.client.lastName}\n- Servicio: ${appointment.service.name}\n- Fecha original: ${new Date(appointment.date).toLocaleDateString('es-ES')} ${appointment.startTime}`;
    } catch (error: any) {
      return `❌ Error al cancelar la cita: ${error.message}`;
    }
  }

  private async rescheduleAppointment(details: any): Promise<string> {
    try {
      const appointment = await prisma.appointment.update({
        where: { id: details.appointmentId },
        data: {
          date: new Date(details.newDate),
          startTime: details.newStartTime,
          endTime: details.newEndTime,
          status: 'RESCHEDULED',
        },
        include: {
          client: true,
          service: true,
        },
      });

      return `✅ Cita reagendada:\n- Cliente: ${appointment.client.firstName} ${appointment.client.lastName}\n- Nueva fecha: ${new Date(appointment.date).toLocaleDateString('es-ES')}\n- Nueva hora: ${appointment.startTime}`;
    } catch (error: any) {
      return `❌ Error al reagendar la cita: ${error.message}`;
    }
  }
}

export default AIService;
