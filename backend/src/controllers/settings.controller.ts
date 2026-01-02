import { Request, Response } from 'express';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';
import { 
  updateTenantSettingsSchema, 
  createScheduleSchema,
  createHolidaySchema,
  updateNotificationTemplateSchema 
} from '../utils/validators.js';
import prisma from '../config/database.js';

// ==================== CONFIGURACIÓN GENERAL ====================

// Obtener configuración del tenant
export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.tenant!.id },
    include: {
      plan: true,
    },
  });
  
  if (!tenant) {
    throw new NotFoundError('Tenant');
  }
  
  res.json({
    success: true,
    data: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      description: tenant.description,
      logo: tenant.logo,
      address: tenant.address,
      city: tenant.city,
      state: tenant.state,
      country: tenant.country,
      zipCode: tenant.zipCode,
      timezone: tenant.timezone,
      currency: tenant.currency,
      dateFormat: tenant.dateFormat,
      timeFormat: tenant.timeFormat,
      weekStartsOn: tenant.weekStartsOn,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      webhookUrl: tenant.webhookUrl,
      webhookActive: tenant.webhookActive,
      plan: tenant.plan,
      subscriptionStatus: tenant.subscriptionStatus,
      trialEndsAt: tenant.trialEndsAt,
      currentPeriodEnd: tenant.currentPeriodEnd,
    },
  });
});

// Actualizar configuración del tenant
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const data = updateTenantSettingsSchema.parse(req.body);
  
  const tenant = await prisma.tenant.update({
    where: { id: req.tenant!.id },
    data,
  });
  
  res.json({
    success: true,
    message: 'Configuración actualizada exitosamente',
    data: tenant,
  });
});

// ==================== HORARIOS DE TRABAJO ====================

// Obtener horarios
export const getSchedules = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.query;
  
  const where: any = {
    tenantId: req.tenant!.id,
  };
  
  if (userId) {
    where.userId = userId;
  }
  
  const schedules = await prisma.workSchedule.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [{ userId: 'asc' }, { dayOfWeek: 'asc' }],
  });
  
  res.json({
    success: true,
    data: schedules,
  });
});

// Actualizar horario
export const updateSchedule = asyncHandler(async (req: Request, res: Response) => {
  const data = createScheduleSchema.parse(req.body);
  
  const schedule = await prisma.workSchedule.upsert({
    where: {
      tenantId_userId_dayOfWeek: {
        tenantId: req.tenant!.id,
        userId: data.userId || '',
        dayOfWeek: data.dayOfWeek,
      },
    },
    update: {
      isWorking: data.isWorking,
      startTime: data.startTime,
      endTime: data.endTime,
      breakStart: data.breakStart,
      breakEnd: data.breakEnd,
    },
    create: {
      tenantId: req.tenant!.id,
      userId: data.userId,
      dayOfWeek: data.dayOfWeek,
      isWorking: data.isWorking,
      startTime: data.startTime,
      endTime: data.endTime,
      breakStart: data.breakStart,
      breakEnd: data.breakEnd,
    },
  });
  
  res.json({
    success: true,
    message: 'Horario actualizado',
    data: schedule,
  });
});

// Actualizar múltiples horarios
export const updateSchedulesBatch = asyncHandler(async (req: Request, res: Response) => {
  const { userId, schedules } = req.body;
  
  if (!Array.isArray(schedules)) {
    return res.status(400).json({
      success: false,
      message: 'schedules debe ser un array',
    });
  }
  
  const results = [];
  
  for (const schedule of schedules) {
    const data = createScheduleSchema.parse({ ...schedule, userId });
    
    const result = await prisma.workSchedule.upsert({
      where: {
        tenantId_userId_dayOfWeek: {
          tenantId: req.tenant!.id,
          userId: userId || '',
          dayOfWeek: data.dayOfWeek,
        },
      },
      update: {
        isWorking: data.isWorking,
        startTime: data.startTime,
        endTime: data.endTime,
        breakStart: data.breakStart,
        breakEnd: data.breakEnd,
      },
      create: {
        tenantId: req.tenant!.id,
        userId,
        dayOfWeek: data.dayOfWeek,
        isWorking: data.isWorking,
        startTime: data.startTime,
        endTime: data.endTime,
        breakStart: data.breakStart,
        breakEnd: data.breakEnd,
      },
    });
    
    results.push(result);
  }
  
  res.json({
    success: true,
    message: 'Horarios actualizados',
    data: results,
  });
});

// ==================== DÍAS FESTIVOS ====================

// Obtener días festivos
export const getHolidays = asyncHandler(async (req: Request, res: Response) => {
  const { year } = req.query;
  
  const where: any = {
    tenantId: req.tenant!.id,
  };
  
  if (year) {
    const startOfYear = new Date(parseInt(year as string), 0, 1);
    const endOfYear = new Date(parseInt(year as string), 11, 31);
    where.date = {
      gte: startOfYear,
      lte: endOfYear,
    };
  }
  
  const holidays = await prisma.holiday.findMany({
    where,
    orderBy: { date: 'asc' },
  });
  
  res.json({
    success: true,
    data: holidays,
  });
});

// Crear día festivo
export const createHoliday = asyncHandler(async (req: Request, res: Response) => {
  const data = createHolidaySchema.parse(req.body);
  
  const holiday = await prisma.holiday.create({
    data: {
      tenantId: req.tenant!.id,
      ...data,
      date: new Date(data.date),
    },
  });
  
  res.status(201).json({
    success: true,
    message: 'Día festivo creado',
    data: holiday,
  });
});

// Actualizar día festivo
export const updateHoliday = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = createHolidaySchema.partial().parse(req.body);
  
  const existing = await prisma.holiday.findFirst({
    where: { id, tenantId: req.tenant!.id },
  });
  
  if (!existing) {
    throw new NotFoundError('Día festivo');
  }
  
  const holiday = await prisma.holiday.update({
    where: { id },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    },
  });
  
  res.json({
    success: true,
    message: 'Día festivo actualizado',
    data: holiday,
  });
});

// Eliminar día festivo
export const deleteHoliday = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const existing = await prisma.holiday.findFirst({
    where: { id, tenantId: req.tenant!.id },
  });
  
  if (!existing) {
    throw new NotFoundError('Día festivo');
  }
  
  await prisma.holiday.delete({ where: { id } });
  
  res.json({
    success: true,
    message: 'Día festivo eliminado',
  });
});

// ==================== PLANTILLAS DE NOTIFICACIÓN ====================

// Obtener plantillas
export const getNotificationTemplates = asyncHandler(async (req: Request, res: Response) => {
  const templates = await prisma.notificationTemplate.findMany({
    where: { tenantId: req.tenant!.id },
    orderBy: { type: 'asc' },
  });
  
  res.json({
    success: true,
    data: templates,
  });
});

// Actualizar plantilla
export const updateNotificationTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateNotificationTemplateSchema.parse(req.body);
  
  const existing = await prisma.notificationTemplate.findFirst({
    where: { id, tenantId: req.tenant!.id },
  });
  
  if (!existing) {
    throw new NotFoundError('Plantilla');
  }
  
  const template = await prisma.notificationTemplate.update({
    where: { id },
    data,
  });
  
  res.json({
    success: true,
    message: 'Plantilla actualizada',
    data: template,
  });
});

// ==================== WEBHOOKS ====================

// Obtener configuración de webhook
export const getWebhookConfig = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.tenant!.id },
    select: {
      webhookUrl: true,
      webhookSecret: true,
      webhookActive: true,
      plan: {
        select: { hasWebhooks: true },
      },
    },
  });
  
  res.json({
    success: true,
    data: {
      url: tenant?.webhookUrl,
      secret: tenant?.webhookSecret ? '••••••••' : null,
      active: tenant?.webhookActive,
      available: tenant?.plan.hasWebhooks,
    },
  });
});

// Actualizar configuración de webhook
export const updateWebhookConfig = asyncHandler(async (req: Request, res: Response) => {
  const { url, secret, active } = req.body;
  
  // Verificar si el plan permite webhooks
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.tenant!.id },
    include: { plan: true },
  });
  
  if (!tenant?.plan.hasWebhooks) {
    return res.status(403).json({
      success: false,
      message: 'Tu plan no incluye webhooks. Actualiza a un plan superior.',
    });
  }
  
  const updateData: any = {};
  
  if (url !== undefined) updateData.webhookUrl = url;
  if (secret !== undefined) updateData.webhookSecret = secret;
  if (active !== undefined) updateData.webhookActive = active;
  
  await prisma.tenant.update({
    where: { id: req.tenant!.id },
    data: updateData,
  });
  
  res.json({
    success: true,
    message: 'Configuración de webhook actualizada',
  });
});

// Obtener logs de webhook
export const getWebhookLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  
  const [logs, total] = await Promise.all([
    prisma.webhookLog.findMany({
      where: { tenantId: req.tenant!.id },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.webhookLog.count({
      where: { tenantId: req.tenant!.id },
    }),
  ]);
  
  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

// Probar webhook
export const testWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { sendWebhook } = await import('../services/webhook.service.js');
  
  const success = await sendWebhook(req.tenant!.id, 'appointment.created', {
    test: true,
    message: 'Este es un webhook de prueba',
    timestamp: new Date().toISOString(),
  });
  
  res.json({
    success: true,
    message: success ? 'Webhook enviado exitosamente' : 'Error al enviar webhook',
    data: { sent: success },
  });
});
