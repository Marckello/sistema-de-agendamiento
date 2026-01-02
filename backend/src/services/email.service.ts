import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import prisma from '../config/database.js';
import { Appointment, Client, User, Service, Tenant, NotificationType, NotificationChannel } from '@prisma/client';

// Crear transportador de email
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

// Variables disponibles para plantillas
interface TemplateVariables {
  client_name: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string;
  client_phone: string;
  service_name: string;
  service_price: string;
  employee_name: string;
  employee_title: string;
  date: string;
  time: string;
  duration: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  booking_link: string;
  cancel_link: string;
}

// Reemplazar variables en plantilla
function replaceVariables(template: string, variables: Partial<TemplateVariables>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  
  return result;
}

// Formatear fecha
function formatDate(date: Date, format: string = 'DD/MM/YYYY'): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year.toString());
}

// Formatear hora
function formatTime(time: string, format: string = '24h'): string {
  if (format === '24h') {
    return time;
  }
  
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  
  return `${hour12}:${minutes} ${ampm}`;
}

// Obtener variables de una cita
async function getAppointmentVariables(
  appointment: Appointment & {
    client: Client;
    employee: User;
    service: Service;
    tenant: Tenant;
  }
): Promise<TemplateVariables> {
  const frontendUrl = config.frontendUrl;
  
  return {
    client_name: `${appointment.client.firstName} ${appointment.client.lastName}`,
    client_first_name: appointment.client.firstName,
    client_last_name: appointment.client.lastName,
    client_email: appointment.client.email || '',
    client_phone: appointment.client.phone,
    service_name: appointment.service.name,
    service_price: `$${appointment.price.toString()}`,
    employee_name: `${appointment.employee.title || ''} ${appointment.employee.firstName} ${appointment.employee.lastName}`.trim(),
    employee_title: appointment.employee.title || '',
    date: formatDate(appointment.date, appointment.tenant.dateFormat),
    time: formatTime(appointment.startTime, appointment.tenant.timeFormat),
    duration: `${appointment.duration} minutos`,
    business_name: appointment.tenant.name,
    business_email: appointment.tenant.email,
    business_phone: appointment.tenant.phone || '',
    business_address: [
      appointment.tenant.address,
      appointment.tenant.city,
      appointment.tenant.state,
    ].filter(Boolean).join(', '),
    booking_link: `${frontendUrl}/book/${appointment.tenant.slug}`,
    cancel_link: `${frontendUrl}/appointments/${appointment.id}/cancel`,
  };
}

// Enviar email
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  html?: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to,
      subject,
      text: body,
      html: html || body.replace(/\n/g, '<br>'),
    });
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Enviar notificación de cita
export async function sendAppointmentNotification(
  appointmentId: string,
  type: NotificationType,
  channel: NotificationChannel = 'EMAIL'
): Promise<boolean> {
  try {
    // Obtener cita con relaciones
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        employee: true,
        service: true,
        tenant: true,
      },
    });
    
    if (!appointment) {
      return false;
    }
    
    // Obtener plantilla
    const template = await prisma.notificationTemplate.findUnique({
      where: {
        tenantId_type_channel: {
          tenantId: appointment.tenantId,
          type,
          channel,
        },
      },
    });
    
    if (!template || !template.isActive) {
      // Usar plantilla por defecto
      return await sendDefaultNotification(appointment, type);
    }
    
    // Obtener variables
    const variables = await getAppointmentVariables(appointment);
    
    // Reemplazar variables
    const subject = replaceVariables(template.subject, variables);
    const body = replaceVariables(template.body, variables);
    
    // Determinar destinatario
    let recipient = '';
    if (channel === 'EMAIL') {
      recipient = appointment.client.email || '';
    }
    
    if (!recipient) {
      return false;
    }
    
    // Enviar según canal
    let success = false;
    if (channel === 'EMAIL') {
      success = await sendEmail(recipient, subject, body);
    }
    
    // Registrar en log
    await prisma.notificationLog.create({
      data: {
        appointmentId,
        type,
        channel,
        recipient,
        subject,
        body,
        status: success ? 'sent' : 'failed',
        sentAt: success ? new Date() : null,
      },
    });
    
    return success;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

// Enviar notificación por defecto (sin plantilla personalizada)
async function sendDefaultNotification(
  appointment: Appointment & {
    client: Client;
    employee: User;
    service: Service;
    tenant: Tenant;
  },
  type: NotificationType
): Promise<boolean> {
  if (!appointment.client.email) {
    return false;
  }
  
  const variables = await getAppointmentVariables(appointment);
  
  let subject = '';
  let body = '';
  
  switch (type) {
    case 'APPOINTMENT_CREATED':
      subject = `Tu cita ha sido agendada - ${variables.business_name}`;
      body = `Hola ${variables.client_name},\n\nTu cita ha sido agendada exitosamente.\n\n📅 Fecha: ${variables.date}\n🕐 Hora: ${variables.time}\n💼 Servicio: ${variables.service_name}\n👨‍⚕️ Atendido por: ${variables.employee_name}\n\n¡Te esperamos!\n\n${variables.business_name}`;
      break;
    
    case 'APPOINTMENT_CONFIRMED':
      subject = `Tu cita ha sido confirmada - ${variables.business_name}`;
      body = `Hola ${variables.client_name},\n\nTu cita ha sido confirmada.\n\n📅 Fecha: ${variables.date}\n🕐 Hora: ${variables.time}\n\n¡Te esperamos!\n\n${variables.business_name}`;
      break;
    
    case 'APPOINTMENT_REMINDER_24H':
      subject = `Recordatorio: Tu cita es mañana - ${variables.business_name}`;
      body = `Hola ${variables.client_name},\n\nTe recordamos que tienes una cita programada para mañana.\n\n📅 Fecha: ${variables.date}\n🕐 Hora: ${variables.time}\n💼 Servicio: ${variables.service_name}\n\n¡Te esperamos!\n\n${variables.business_name}`;
      break;
    
    case 'APPOINTMENT_CANCELED':
      subject = `Tu cita ha sido cancelada - ${variables.business_name}`;
      body = `Hola ${variables.client_name},\n\nTu cita del ${variables.date} a las ${variables.time} ha sido cancelada.\n\nSi deseas reagendar, visita: ${variables.booking_link}\n\n${variables.business_name}`;
      break;
    
    default:
      return false;
  }
  
  const success = await sendEmail(appointment.client.email, subject, body);
  
  await prisma.notificationLog.create({
    data: {
      appointmentId: appointment.id,
      type,
      channel: 'EMAIL',
      recipient: appointment.client.email,
      subject,
      body,
      status: success ? 'sent' : 'failed',
      sentAt: success ? new Date() : null,
    },
  });
  
  return success;
}

// Programar recordatorio (esto se ejecutaría con un cron job)
export async function sendPendingReminders(): Promise<void> {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Citas de mañana que no han recibido recordatorio 24h
  const appointments24h = await prisma.appointment.findMany({
    where: {
      date: {
        gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
        lt: new Date(tomorrow.setHours(23, 59, 59, 999)),
      },
      status: { in: ['PENDING', 'CONFIRMED'] },
      reminder24hSent: false,
    },
    include: {
      client: true,
      employee: true,
      service: true,
      tenant: true,
    },
  });
  
  for (const appointment of appointments24h) {
    const success = await sendAppointmentNotification(
      appointment.id,
      'APPOINTMENT_REMINDER_24H',
      'EMAIL'
    );
    
    if (success) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminder24hSent: true },
      });
    }
  }
  
  // Citas en 1 hora que no han recibido recordatorio 1h
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const appointments1h = await prisma.appointment.findMany({
    where: {
      date: {
        gte: new Date(now.setHours(0, 0, 0, 0)),
        lte: new Date(now.setHours(23, 59, 59, 999)),
      },
      startTime: {
        gte: now.toTimeString().slice(0, 5),
        lte: oneHourFromNow.toTimeString().slice(0, 5),
      },
      status: { in: ['PENDING', 'CONFIRMED'] },
      reminder1hSent: false,
    },
    include: {
      client: true,
      employee: true,
      service: true,
      tenant: true,
    },
  });
  
  for (const appointment of appointments1h) {
    const success = await sendAppointmentNotification(
      appointment.id,
      'APPOINTMENT_REMINDER_1H',
      'EMAIL'
    );
    
    if (success) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminder1hSent: true },
      });
    }
  }
}
