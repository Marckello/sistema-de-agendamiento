import { config } from '../config/index.js';
import prisma from '../config/database.js';
import { Appointment, Client, User, Service, Tenant, AppointmentStatus } from '@prisma/client';
import crypto from 'crypto';

// Tipos de eventos de webhook
export type WebhookEvent = 
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.confirmed'
  | 'appointment.canceled'
  | 'appointment.completed'
  | 'appointment.no_show'
  | 'appointment.rescheduled'
  | 'client.created'
  | 'client.updated';

// Payload del webhook
interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  tenant: {
    id: string;
    slug: string;
    name: string;
  };
  data: any;
}

// Generar firma para el webhook
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Mapear status a evento
function statusToEvent(status: AppointmentStatus, previousStatus?: AppointmentStatus): WebhookEvent {
  if (!previousStatus) {
    return 'appointment.created';
  }
  
  switch (status) {
    case 'CONFIRMED':
      return 'appointment.confirmed';
    case 'CANCELED':
      return 'appointment.canceled';
    case 'COMPLETED':
      return 'appointment.completed';
    case 'NO_SHOW':
      return 'appointment.no_show';
    case 'RESCHEDULED':
      return 'appointment.rescheduled';
    default:
      return 'appointment.updated';
  }
}

// Enviar webhook
export async function sendWebhook(
  tenantId: string,
  event: WebhookEvent,
  data: any
): Promise<boolean> {
  try {
    // Obtener tenant con configuración de webhook
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        plan: true,
      },
    });
    
    if (!tenant) {
      return false;
    }
    
    // Verificar si el plan permite webhooks
    if (!tenant.plan.hasWebhooks) {
      console.log('Plan does not support webhooks');
      return false;
    }
    
    // Verificar si tiene webhook configurado y activo
    const webhookUrl = tenant.webhookUrl || config.webhook.url;
    const webhookSecret = tenant.webhookSecret || config.webhook.secret;
    
    if (!webhookUrl || !tenant.webhookActive) {
      return false;
    }
    
    // Construir payload
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      },
      data,
    };
    
    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, webhookSecret);
    
    // Enviar webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'X-Tenant-Id': tenant.id,
      },
      body: payloadString,
    });
    
    const responseText = await response.text();
    
    // Registrar en log
    await prisma.webhookLog.create({
      data: {
        tenantId,
        event,
        payload: payload as any,
        url: webhookUrl,
        status: response.status,
        response: responseText.slice(0, 1000), // Limitar tamaño
        error: response.ok ? null : responseText.slice(0, 500),
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Webhook error:', error);
    
    // Registrar error
    await prisma.webhookLog.create({
      data: {
        tenantId,
        event,
        payload: data,
        url: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    
    return false;
  }
}

// Enviar webhook de cita
export async function sendAppointmentWebhook(
  appointmentId: string,
  previousStatus?: AppointmentStatus
): Promise<boolean> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            title: true,
            specialty: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
        tenant: {
          select: {
            id: true,
            slug: true,
            name: true,
            webhookUrl: true,
            webhookSecret: true,
            webhookActive: true,
          },
        },
      },
    });
    
    if (!appointment) {
      return false;
    }
    
    const event = statusToEvent(appointment.status, previousStatus);
    
    const data = {
      appointment: {
        id: appointment.id,
        date: appointment.date.toISOString().split('T')[0],
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        duration: appointment.duration,
        status: appointment.status,
        price: appointment.price.toString(),
        notes: appointment.notes,
        clientNotes: appointment.clientNotes,
        source: appointment.source,
        paymentStatus: appointment.paymentStatus,
        createdAt: appointment.createdAt.toISOString(),
        updatedAt: appointment.updatedAt.toISOString(),
      },
      client: {
        id: appointment.client.id,
        name: `${appointment.client.firstName} ${appointment.client.lastName}`,
        firstName: appointment.client.firstName,
        lastName: appointment.client.lastName,
        email: appointment.client.email,
        phone: appointment.client.phone,
      },
      employee: {
        id: appointment.employee.id,
        name: `${appointment.employee.title || ''} ${appointment.employee.firstName} ${appointment.employee.lastName}`.trim(),
        firstName: appointment.employee.firstName,
        lastName: appointment.employee.lastName,
        email: appointment.employee.email,
        specialty: appointment.employee.specialty,
      },
      service: {
        id: appointment.service.id,
        name: appointment.service.name,
        duration: appointment.service.duration,
        price: appointment.service.price.toString(),
      },
      previousStatus,
    };
    
    return sendWebhook(appointment.tenantId, event, data);
  } catch (error) {
    console.error('Send appointment webhook error:', error);
    return false;
  }
}

// Enviar webhook de cliente
export async function sendClientWebhook(
  clientId: string,
  isNew: boolean = true
): Promise<boolean> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    });
    
    if (!client) {
      return false;
    }
    
    const event: WebhookEvent = isNew ? 'client.created' : 'client.updated';
    
    const data = {
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        dateOfBirth: client.dateOfBirth?.toISOString().split('T')[0],
        gender: client.gender,
        status: client.status,
        source: client.source,
        tags: client.tags,
        totalVisits: client.totalVisits,
        lastVisit: client.lastVisit?.toISOString(),
        createdAt: client.createdAt.toISOString(),
      },
    };
    
    return sendWebhook(client.tenantId, event, data);
  } catch (error) {
    console.error('Send client webhook error:', error);
    return false;
  }
}
