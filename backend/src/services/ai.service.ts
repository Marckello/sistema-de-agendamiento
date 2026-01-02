import OpenAI from 'openai';
import prisma from '../config/database.js';

// Lazy initialization - solo se crea cuando se usa
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

interface ChatContext {
  userId: string;
  tenantId: string;
  userRole: string;
  userName: string;
}

interface AppointmentAction {
  action: 'create' | 'cancel' | 'reschedule' | 'query' | 'create_client';
  params: Record<string, any>;
  confirmation?: string;
}

const SYSTEM_PROMPT = `Eres un asistente de gestión de citas altamente inteligente y conversacional para CitasPro. Tu personalidad es amable, profesional y eficiente.

## TU ESTILO DE COMUNICACIÓN:
- Eres CONVERSACIONAL, no un formulario. Haz UNA pregunta a la vez.
- Usa un tono cálido y profesional.
- Cuando el usuario quiera agendar, guíalo paso a paso de forma natural.
- NUNCA pidas todos los datos de golpe. Fluye naturalmente en la conversación.
- Usa emojis ocasionalmente para ser más amigable 📅 ✨ 👋

## FLUJO PARA AGENDAR UNA CITA:

### Paso 1 - Identificar al cliente:
Cuando te pidan agendar una cita, PRIMERO pregunta:
"¡Claro! 😊 ¿Es un cliente nuevo o ya está registrado con nosotros?"

### Paso 2A - Si es CLIENTE NUEVO:
Pide los datos uno por uno de forma conversacional:
1. "Perfecto, ¿cuál es el nombre completo del cliente?"
2. "¿Y su número de teléfono para contactarlo?"
(El correo es opcional, solo pídelo si el usuario lo menciona)

Cuando tengas nombre y teléfono, registra al cliente con:
{"action": "create_client", "params": {"firstName": "Nombre", "lastName": "Apellido", "phone": "teléfono", "email": "opcional"}}

### Paso 2B - Si es CLIENTE REGISTRADO:
Pregunta: "¿Me puedes dar su nombre, teléfono o correo para buscarlo?"

Busca en la lista de clientes del contexto. Si encuentras coincidencias, confirma cuál es.
Si no encuentras ninguno, sugiere registrarlo como nuevo.

### Paso 3 - Seleccionar servicio:
Una vez identificado el cliente, pregunta:
"Perfecto, ¿qué servicio necesita [Nombre]?"
Puedes mencionar los servicios disponibles del contexto.

### Paso 4 - Fecha y hora:
"¿Para qué día y hora te gustaría la cita?"
Sé flexible con formatos: "mañana", "el viernes", "3 de enero", "a las 4", "16:00", etc.

### Paso 5 - Confirmar:
Resume la cita completa y pide confirmación:
"Perfecto, voy a agendar:
📅 Cliente: [Nombre]
💼 Servicio: [Servicio]
📆 Fecha: [Fecha legible]
🕐 Hora: [Hora en 12h]

¿Confirmo la cita?"

Solo cuando el usuario confirme (sí, ok, confirma, adelante, etc.), emite el JSON:
{"action": "create", "params": {"clientId": "ID", "serviceId": "ID", "date": "YYYY-MM-DD", "startTime": "HH:MM"}}

## BÚSQUEDA INTELIGENTE DE CLIENTES:
- Si dicen "María", busca todos los clientes cuyo nombre contenga "María" en el contexto
- Si dan un teléfono parcial, busca coincidencias
- Si hay varios resultados, muéstralos y pregunta cuál es
- Si no hay resultados, sugiere registrar como nuevo

## OTRAS CAPACIDADES:
- Consultar citas de hoy, mañana, fecha específica
- Cancelar citas (pregunta cuál y confirma antes)
- Reagendar citas (pregunta la nueva fecha/hora)
- Informar sobre servicios disponibles y precios

## FORMATO DE ACCIONES JSON:

Crear cliente nuevo:
{"action": "create_client", "params": {"firstName": "Nombre", "lastName": "Apellido", "phone": "tel", "email": "correo"}}

Crear cita (solo con TODOS los datos y confirmación):
{"action": "create", "params": {"clientId": "UUID", "serviceId": "UUID", "date": "YYYY-MM-DD", "startTime": "HH:MM"}}

Cancelar cita:
{"action": "cancel", "params": {"appointmentId": "UUID", "reason": "motivo"}}

Reagendar:
{"action": "reschedule", "params": {"appointmentId": "UUID", "newDate": "YYYY-MM-DD", "newStartTime": "HH:MM"}}

## REGLAS CRÍTICAS:
1. SIEMPRE responde en español
2. NUNCA pidas todos los datos juntos - sé conversacional, UNA pregunta a la vez
3. NUNCA inventes IDs - usa SOLO los del contexto
4. SIEMPRE confirma antes de ejecutar acciones
5. Si no entiendes algo, pide clarificación amablemente
6. Interpreta fechas relativas: "mañana", "pasado mañana", "el lunes", etc.
7. Interpreta horas flexibles: "a las 4", "4pm", "16:00", "cuatro de la tarde"
8. NO emitas JSON hasta tener TODOS los datos Y confirmación del usuario`;

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

      const completion = await getOpenAI().chat.completions.create({
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

    // Obtener servicios disponibles
    const services = await prisma.service.findMany({
      where: { tenantId: this.context.tenantId, isActive: true },
      select: { id: true, name: true, duration: true, price: true },
    });

    // Obtener clientes del tenant
    const clients = await prisma.client.findMany({
      where: { tenantId: this.context.tenantId, isActive: true },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true },
      take: 100,
      orderBy: { lastName: 'asc' },
    });

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

    // Listar servicios disponibles
    context += `=== 💼 SERVICIOS DISPONIBLES (${services.length}) ===\n`;
    if (services.length === 0) {
      context += 'No hay servicios configurados.\n';
    } else {
      services.forEach((svc) => {
        context += `• ${svc.name} | ID: ${svc.id} | ${svc.duration} min | $${svc.price}\n`;
      });
    }

    // Listar clientes
    context += `\n=== 👥 CLIENTES REGISTRADOS (${clients.length}) ===\n`;
    if (clients.length === 0) {
      context += 'No hay clientes registrados aún.\n';
    } else {
      clients.forEach((cli) => {
        const email = cli.email ? ` | ${cli.email}` : '';
        context += `• ${cli.firstName} ${cli.lastName} | ID: ${cli.id} | Tel: ${cli.phone || 'N/A'}${email}\n`;
      });
    }

    context += `\n=== CITAS DE HOY (${todayAppointments.length}) ===\n`;
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
    const jsonMatch = response.match(/\{[\s\S]*?"action"[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.action && ['create', 'cancel', 'reschedule', 'query', 'create_client'].includes(parsed.action)) {
          return {
            action: parsed.action,
            params: parsed.params || parsed.details || {},
          };
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
        return this.createAppointment(action.params);
      case 'create_client':
        return this.createClient(action.params);
      case 'cancel':
        return this.cancelAppointment(action.params);
      case 'reschedule':
        return this.rescheduleAppointment(action.params);
      default:
        return 'Acción no reconocida';
    }
  }

  private async createClient(params: any): Promise<string> {
    try {
      if (!params.firstName) {
        return '❌ Falta el nombre del cliente.';
      }

      const client = await prisma.client.create({
        data: {
          tenantId: this.context.tenantId,
          firstName: params.firstName,
          lastName: params.lastName || '',
          phone: params.phone || null,
          email: params.email || null,
          isActive: true,
        },
      });

      return `✅ ¡Cliente registrado exitosamente!\n\n👤 **${client.firstName} ${client.lastName}**\nID: ${client.id}\n📞 ${client.phone || 'Sin teléfono'}\n📧 ${client.email || 'Sin correo'}\n\nAhora podemos continuar con la cita. ¿Qué servicio necesita?`;
    } catch (error: any) {
      console.error('Error creando cliente:', error);
      return `❌ Error al registrar el cliente: ${error.message}`;
    }
  }

  private async createAppointment(params: any): Promise<string> {
    try {
      // Validaciones
      if (!params.serviceId) {
        return '❌ Falta seleccionar el servicio.';
      }
      if (!params.clientId) {
        return '❌ Falta identificar al cliente.';
      }
      if (!params.date) {
        return '❌ Falta la fecha de la cita.';
      }
      if (!params.startTime) {
        return '❌ Falta la hora de la cita.';
      }

      const service = await prisma.service.findFirst({
        where: { id: params.serviceId, tenantId: this.context.tenantId },
      });
      
      if (!service) {
        return '❌ Servicio no encontrado.';
      }

      const client = await prisma.client.findFirst({
        where: { id: params.clientId, tenantId: this.context.tenantId },
      });

      if (!client) {
        return '❌ Cliente no encontrado.';
      }

      // Calcular hora de fin
      const [hours, minutes] = params.startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = new Date(startDate.getTime() + service.duration * 60000);
      const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

      const appointment = await prisma.appointment.create({
        data: {
          tenantId: this.context.tenantId,
          clientId: params.clientId,
          serviceId: params.serviceId,
          employeeId: params.employeeId || this.context.userId,
          date: new Date(params.date),
          startTime: params.startTime,
          endTime: endTime,
          duration: service.duration,
          price: service.price,
          status: 'CONFIRMED',
        },
        include: {
          client: true,
          service: true,
        },
      });

      const dateFormatted = new Date(appointment.date).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // Formatear hora a 12h
      const hour12 = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const timeFormatted = `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;

      return `✅ ¡Cita agendada exitosamente!\n\n📅 **Resumen de la cita:**\n👤 Cliente: ${appointment.client.firstName} ${appointment.client.lastName}\n💼 Servicio: ${appointment.service.name}\n📆 Fecha: ${dateFormatted}\n🕐 Hora: ${timeFormatted}\n⏱️ Duración: ${service.duration} minutos\n💰 Precio: $${service.price}\n\n¿Hay algo más en lo que pueda ayudarte? 😊`;
    } catch (error: any) {
      console.error('Error creando cita:', error);
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
