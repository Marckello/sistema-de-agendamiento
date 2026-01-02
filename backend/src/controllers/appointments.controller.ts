import { Request, Response } from 'express';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';
import { 
  createAppointment, 
  updateAppointment, 
  cancelAppointment,
  getAppointmentsByDateRange,
  checkAvailability,
  getAvailableSlots,
  getAppointmentStats
} from '../services/appointment.service.js';
import { 
  createAppointmentSchema, 
  updateAppointmentSchema, 
  checkAvailabilitySchema,
  dateRangeSchema,
  paginationSchema 
} from '../utils/validators.js';
import prisma from '../config/database.js';
import { UserRole } from '@prisma/client';

// Obtener citas (con filtros)
export const getAppointments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse(req.query);
  const { startDate, endDate } = dateRangeSchema.parse({
    startDate: req.query.startDate || new Date().toISOString().split('T')[0],
    endDate: req.query.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  
  const { employeeId, status, clientId } = req.query;
  
  // Si es empleado, solo puede ver sus propias citas
  let filterEmployeeId = employeeId as string | undefined;
  if (req.user!.role === UserRole.EMPLOYEE) {
    filterEmployeeId = req.user!.id;
  }
  
  const statusFilter = status ? (status as string).split(',') : undefined;
  
  const where: any = {
    tenantId: req.tenant!.id,
    date: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
    isActive: true,
  };
  
  if (filterEmployeeId) {
    where.employeeId = filterEmployeeId;
  }
  
  if (clientId) {
    where.clientId = clientId;
  }
  
  if (statusFilter) {
    where.status = { in: statusFilter };
  }
  
  if (search) {
    where.OR = [
      { client: { firstName: { contains: search, mode: 'insensitive' } } },
      { client: { lastName: { contains: search, mode: 'insensitive' } } },
      { client: { phone: { contains: search } } },
      { service: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  
  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
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
            title: true,
            color: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            color: true,
            duration: true,
            price: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: sortBy ? { [sortBy]: sortOrder || 'asc' } : [{ date: 'asc' }, { startTime: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.appointment.count({ where }),
  ]);
  
  res.json({
    success: true,
    data: {
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// Obtener cita por ID
export const getAppointment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const appointment = await prisma.appointment.findFirst({
    where: {
      id,
      tenantId: req.tenant!.id,
    },
    include: {
      client: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          title: true,
          email: true,
          phone: true,
          specialty: true,
          color: true,
        },
      },
      service: true,
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      notifications: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
  
  if (!appointment) {
    throw new NotFoundError('Cita');
  }
  
  // Verificar permisos (empleado solo puede ver sus citas)
  if (req.user!.role === UserRole.EMPLOYEE && appointment.employeeId !== req.user!.id) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para ver esta cita',
    });
  }
  
  res.json({
    success: true,
    data: appointment,
  });
});

// Crear cita
export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = createAppointmentSchema.parse(req.body);
  
  const appointment = await createAppointment({
    tenantId: req.tenant!.id,
    clientId: data.clientId,
    employeeId: data.employeeId,
    serviceId: data.serviceId,
    date: new Date(data.date),
    startTime: data.startTime,
    notes: data.notes,
    clientNotes: data.clientNotes,
    source: data.source || 'internal',
    createdById: req.user!.id,
  });
  
  res.status(201).json({
    success: true,
    message: 'Cita creada exitosamente',
    data: appointment,
  });
});

// Actualizar cita
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateAppointmentSchema.parse(req.body);
  
  // Verificar que la cita existe y pertenece al tenant
  const existing = await prisma.appointment.findFirst({
    where: { id, tenantId: req.tenant!.id },
  });
  
  if (!existing) {
    throw new NotFoundError('Cita');
  }
  
  // Empleados solo pueden actualizar notas y reenviar recordatorios
  if (req.user!.role === UserRole.EMPLOYEE) {
    if (existing.employeeId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar esta cita',
      });
    }
    
    // Solo permitir actualizar notas
    const allowedFields = ['notes'];
    const updateFields = Object.keys(data);
    const invalidFields = updateFields.filter(f => !allowedFields.includes(f));
    
    if (invalidFields.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes actualizar notas',
      });
    }
  }
  
  const appointment = await updateAppointment(id, {
    ...data,
    date: data.date ? new Date(data.date) : undefined,
  }, req.user!.id);
  
  res.json({
    success: true,
    message: 'Cita actualizada exitosamente',
    data: appointment,
  });
});

// Cancelar cita
export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  // Verificar que la cita existe
  const existing = await prisma.appointment.findFirst({
    where: { id, tenantId: req.tenant!.id },
  });
  
  if (!existing) {
    throw new NotFoundError('Cita');
  }
  
  const appointment = await cancelAppointment(id, reason || 'Sin motivo especificado', req.user!.id);
  
  res.json({
    success: true,
    message: 'Cita cancelada exitosamente',
    data: appointment,
  });
});

// Verificar disponibilidad
export const checkAvailabilityHandler = asyncHandler(async (req: Request, res: Response) => {
  console.log('');
  console.log('='.repeat(80));
  console.log('🕐 [AVAILABILITY CHECK] Consultando disponibilidad');
  console.log('='.repeat(80));
  console.log('📥 Query params:', req.query);
  
  const data = checkAvailabilitySchema.parse(req.query);
  console.log('✅ Datos parseados:', data);
  
  // Obtener servicio para duración
  const service = await prisma.service.findFirst({
    where: { id: data.serviceId, tenantId: req.tenant!.id },
  });
  
  console.log('🔧 Servicio encontrado:', service ? { id: service.id, name: service.name, duration: service.duration } : 'NO ENCONTRADO');
  
  if (!service) {
    throw new NotFoundError('Servicio');
  }
  
  const totalDuration = service.duration + service.bufferBefore + service.bufferAfter;
  console.log(`⏱️ Duración total: ${totalDuration} min (servicio: ${service.duration}, bufferBefore: ${service.bufferBefore}, bufferAfter: ${service.bufferAfter})`);
  
  const slots = await getAvailableSlots(
    req.tenant!.id,
    data.employeeId,
    new Date(data.date),
    totalDuration,
    30 // Intervalo de 30 minutos
  );
  
  console.log(`📊 Slots generados: ${slots.length}`);
  console.log('🟢 Slots disponibles:', slots.filter(s => s.available).length);
  console.log('🔴 Slots NO disponibles:', slots.filter(s => !s.available).length);
  if (slots.length === 0) {
    console.log('⚠️ ADVERTENCIA: No se generaron slots. Verificar horarios del negocio y empleado.');
  }
  console.log('='.repeat(80));
  console.log('');
  
  res.json({
    success: true,
    data: {
      date: data.date,
      employeeId: data.employeeId,
      serviceId: data.serviceId,
      serviceDuration: service.duration,
      slots,
    },
  });
});

// Obtener estadísticas
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = dateRangeSchema.parse({
    startDate: req.query.startDate || new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: req.query.endDate || new Date().toISOString().split('T')[0],
  });
  
  const stats = await getAppointmentStats(
    req.tenant!.id,
    new Date(startDate),
    new Date(endDate)
  );
  
  res.json({
    success: true,
    data: stats,
  });
});

// Reenviar recordatorio
export const resendReminder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const appointment = await prisma.appointment.findFirst({
    where: { id, tenantId: req.tenant!.id },
    include: {
      client: true,
      employee: true,
      service: true,
      tenant: true,
    },
  });
  
  if (!appointment) {
    throw new NotFoundError('Cita');
  }
  
  // Verificar permisos
  if (req.user!.role === UserRole.EMPLOYEE && appointment.employeeId !== req.user!.id) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para esta acción',
    });
  }
  
  // Importar servicio de email
  const { sendAppointmentNotification } = await import('../services/email.service.js');
  
  const success = await sendAppointmentNotification(
    appointment.id,
    'APPOINTMENT_REMINDER_24H',
    'EMAIL'
  );
  
  if (success) {
    await prisma.appointment.update({
      where: { id },
      data: { reminderSent: true, reminderSentAt: new Date() },
    });
  }
  
  res.json({
    success: true,
    message: success ? 'Recordatorio enviado exitosamente' : 'Error al enviar recordatorio',
  });
});

// Obtener citas para calendario (formato optimizado)
export const getCalendarAppointments = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, employeeId } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'startDate y endDate son requeridos',
    });
  }
  
  // Si es empleado, solo sus citas
  let filterEmployeeId = employeeId as string | undefined;
  if (req.user!.role === UserRole.EMPLOYEE) {
    filterEmployeeId = req.user!.id;
  }
  
  const appointments = await getAppointmentsByDateRange(
    req.tenant!.id,
    new Date(startDate as string),
    new Date(endDate as string),
    filterEmployeeId
  );
  
  // Formatear para calendario
  const events = appointments.map((apt: any) => ({
    id: apt.id,
    title: `${apt.client?.firstName || ''} ${apt.client?.lastName || ''} - ${apt.service?.name || ''}`,
    start: `${apt.date.toISOString().split('T')[0]}T${apt.startTime}:00`,
    end: `${apt.date.toISOString().split('T')[0]}T${apt.endTime}:00`,
    backgroundColor: apt.employee?.color || apt.service?.color,
    borderColor: apt.employee?.color || apt.service?.color,
    extendedProps: {
      status: apt.status,
      clientId: apt.client?.id,
      clientName: `${apt.client?.firstName || ''} ${apt.client?.lastName || ''}`,
      clientPhone: apt.client?.phone,
      employeeId: apt.employee?.id,
      employeeName: `${apt.employee?.title || ''} ${apt.employee?.firstName || ''} ${apt.employee?.lastName || ''}`.trim(),
      serviceId: apt.service?.id,
      serviceName: apt.service?.name,
      duration: apt.service?.duration,
    },
  }));
  
  res.json({
    success: true,
    data: events,
  });
});
