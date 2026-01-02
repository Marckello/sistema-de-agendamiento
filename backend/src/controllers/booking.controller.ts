import { Request, Response } from 'express';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';
import prisma from '../config/database.js';
import { getAvailableSlots, createAppointment } from '../services/appointment.service.js';
import { createClientSchema, createAppointmentSchema } from '../utils/validators.js';

// Obtener información del negocio para booking público
export const getTenantInfo = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      plan: {
        select: { hasPublicBooking: true },
      },
    },
  });
  
  if (!tenant || !tenant.isActive) {
    throw new NotFoundError('Negocio');
  }
  
  if (!tenant.plan.hasPublicBooking) {
    return res.status(403).json({
      success: false,
      message: 'Este negocio no tiene habilitado el booking público',
    });
  }
  
  res.json({
    success: true,
    data: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      description: tenant.description,
      logo: tenant.logo,
      phone: tenant.phone,
      email: tenant.email,
      address: tenant.address,
      city: tenant.city,
      state: tenant.state,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      timezone: tenant.timezone,
    },
  });
});

// Obtener servicios públicos
export const getPublicServices = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { plan: true },
  });
  
  if (!tenant || !tenant.isActive || !tenant.plan.hasPublicBooking) {
    throw new NotFoundError('Negocio');
  }
  
  const services = await prisma.service.findMany({
    where: {
      tenantId: tenant.id,
      isActive: true,
      isPublic: true,
    },
    include: {
      category: {
        select: { id: true, name: true, color: true },
      },
      employees: {
        where: {
          user: { isActive: true },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
              specialty: true,
              avatar: true,
              bio: true,
            },
          },
        },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  
  // Agrupar por categoría
  const categories = await prisma.serviceCategory.findMany({
    where: {
      tenantId: tenant.id,
      isActive: true,
      services: {
        some: { isActive: true, isPublic: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });
  
  res.json({
    success: true,
    data: {
      categories,
      services: services.map(s => ({
        ...s,
        employees: s.employees.map(e => e.user),
      })),
    },
  });
});

// Obtener empleados que ofrecen un servicio
export const getEmployeesForService = asyncHandler(async (req: Request, res: Response) => {
  const { slug, serviceId } = req.params;
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { plan: true },
  });
  
  if (!tenant || !tenant.isActive || !tenant.plan.hasPublicBooking) {
    throw new NotFoundError('Negocio');
  }
  
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      tenantId: tenant.id,
      isActive: true,
      isPublic: true,
    },
    include: {
      employees: {
        where: {
          user: { isActive: true },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
              specialty: true,
              avatar: true,
              bio: true,
            },
          },
        },
      },
    },
  });
  
  if (!service) {
    throw new NotFoundError('Servicio');
  }
  
  res.json({
    success: true,
    data: service.employees.map(e => e.user),
  });
});

// Obtener disponibilidad
export const getAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { serviceId, employeeId, date } = req.query;
  
  if (!serviceId || !employeeId || !date) {
    return res.status(400).json({
      success: false,
      message: 'serviceId, employeeId y date son requeridos',
    });
  }
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { plan: true },
  });
  
  if (!tenant || !tenant.isActive || !tenant.plan.hasPublicBooking) {
    throw new NotFoundError('Negocio');
  }
  
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId as string,
      tenantId: tenant.id,
      isActive: true,
      isPublic: true,
    },
  });
  
  if (!service) {
    throw new NotFoundError('Servicio');
  }
  
  const slots = await getAvailableSlots(
    tenant.id,
    employeeId as string,
    new Date(date as string),
    service.duration + service.bufferBefore + service.bufferAfter,
    30
  );
  
  res.json({
    success: true,
    data: {
      date,
      service: {
        id: service.id,
        name: service.name,
        duration: service.duration,
        price: service.price,
      },
      slots: slots.filter(s => s.available),
      allSlots: slots,
    },
  });
});

// Obtener múltiples días de disponibilidad
export const getAvailabilityRange = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { serviceId, employeeId, startDate, endDate } = req.query;
  
  if (!serviceId || !employeeId || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'serviceId, employeeId, startDate y endDate son requeridos',
    });
  }
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { plan: true },
  });
  
  if (!tenant || !tenant.isActive || !tenant.plan.hasPublicBooking) {
    throw new NotFoundError('Negocio');
  }
  
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId as string,
      tenantId: tenant.id,
      isActive: true,
      isPublic: true,
    },
  });
  
  if (!service) {
    throw new NotFoundError('Servicio');
  }
  
  // Generar fechas del rango
  const start = new Date(startDate as string);
  const end = new Date(endDate as string);
  const days: { date: string; available: boolean; slots: number }[] = [];
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const slots = await getAvailableSlots(
      tenant.id,
      employeeId as string,
      new Date(dateStr),
      service.duration + service.bufferBefore + service.bufferAfter,
      30
    );
    
    const availableSlots = slots.filter(s => s.available);
    days.push({
      date: dateStr,
      available: availableSlots.length > 0,
      slots: availableSlots.length,
    });
  }
  
  res.json({
    success: true,
    data: days,
  });
});

// Crear reserva pública
export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { client, appointment } = req.body;
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { plan: true },
  });
  
  if (!tenant || !tenant.isActive || !tenant.plan.hasPublicBooking) {
    throw new NotFoundError('Negocio');
  }
  
  // Validar datos del cliente
  const clientData = createClientSchema.parse(client);
  
  // Buscar o crear cliente
  let existingClient = await prisma.client.findFirst({
    where: {
      tenantId: tenant.id,
      phone: clientData.phone,
    },
  });
  
  if (!existingClient) {
    existingClient = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        email: clientData.email || null,
        phone: clientData.phone,
        source: 'public_booking',
      },
    });
  } else {
    // Actualizar datos si es necesario
    await prisma.client.update({
      where: { id: existingClient.id },
      data: {
        email: clientData.email || existingClient.email,
        firstName: clientData.firstName,
        lastName: clientData.lastName,
      },
    });
  }
  
  // Validar y crear cita
  const appointmentData = createAppointmentSchema.parse({
    ...appointment,
    clientId: existingClient.id,
  });
  
  const newAppointment = await createAppointment({
    tenantId: tenant.id,
    clientId: existingClient.id,
    employeeId: appointmentData.employeeId,
    serviceId: appointmentData.serviceId,
    date: new Date(appointmentData.date),
    startTime: appointmentData.startTime,
    clientNotes: appointmentData.clientNotes,
    source: 'public_booking',
  });
  
  res.status(201).json({
    success: true,
    message: 'Cita agendada exitosamente',
    data: {
      id: newAppointment.id,
      date: newAppointment.date,
      startTime: newAppointment.startTime,
      endTime: newAppointment.endTime,
      service: newAppointment.service.name,
      employee: `${newAppointment.employee.title || ''} ${newAppointment.employee.firstName} ${newAppointment.employee.lastName}`.trim(),
      status: newAppointment.status,
    },
  });
});

// Verificar estado de una cita (para confirmación pública)
export const getBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { slug, appointmentId } = req.params;
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });
  
  if (!tenant || !tenant.isActive) {
    throw new NotFoundError('Negocio');
  }
  
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      tenantId: tenant.id,
    },
    include: {
      service: {
        select: { name: true, duration: true },
      },
      employee: {
        select: { firstName: true, lastName: true, title: true },
      },
    },
  });
  
  if (!appointment) {
    throw new NotFoundError('Cita');
  }
  
  res.json({
    success: true,
    data: {
      id: appointment.id,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      service: appointment.service.name,
      duration: appointment.service.duration,
      employee: `${appointment.employee.title || ''} ${appointment.employee.firstName} ${appointment.employee.lastName}`.trim(),
    },
  });
});

// Cancelar cita desde booking público (el cliente cancela)
export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const { slug, appointmentId } = req.params;
  const { phone, reason } = req.body;
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });
  
  if (!tenant || !tenant.isActive) {
    throw new NotFoundError('Negocio');
  }
  
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      tenantId: tenant.id,
    },
    include: {
      client: true,
    },
  });
  
  if (!appointment) {
    throw new NotFoundError('Cita');
  }
  
  // Verificar que el teléfono coincide
  if (appointment.client.phone !== phone) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para cancelar esta cita',
    });
  }
  
  // No permitir cancelar citas pasadas
  const appointmentDate = new Date(appointment.date);
  appointmentDate.setHours(
    parseInt(appointment.startTime.split(':')[0]),
    parseInt(appointment.startTime.split(':')[1])
  );
  
  if (appointmentDate < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'No se pueden cancelar citas pasadas',
    });
  }
  
  // No permitir cancelar citas ya canceladas
  if (appointment.status === 'CANCELED') {
    return res.status(400).json({
      success: false,
      message: 'La cita ya fue cancelada',
    });
  }
  
  const { cancelAppointment } = await import('../services/appointment.service.js');
  
  await cancelAppointment(appointmentId, reason || 'Cancelado por el cliente', 'client');
  
  res.json({
    success: true,
    message: 'Cita cancelada exitosamente',
  });
});
