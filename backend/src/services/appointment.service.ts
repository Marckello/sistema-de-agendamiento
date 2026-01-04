import prisma from '../config/database.js';
import { AppointmentStatus, PaymentStatus, Prisma } from '@prisma/client';
import { sendAppointmentNotification } from './email.service.js';
import { sendAppointmentWebhook } from './webhook.service.js';

interface CreateAppointmentData {
  tenantId: string;
  clientId: string;
  employeeId: string;
  serviceId: string;
  date: Date;
  startTime: string;
  notes?: string;
  clientNotes?: string;
  source?: string;
  createdById?: string;
  extras?: { id: string; quantity: number }[];
}

interface UpdateAppointmentData {
  clientId?: string;
  employeeId?: string;
  serviceId?: string;
  date?: Date;
  startTime?: string;
  status?: AppointmentStatus;
  notes?: string;
  clientNotes?: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  discount?: number;
  discountType?: string;
  cancelReason?: string;
  extras?: { id: string; quantity: number }[];
}

interface TimeSlot {
  time: string;
  available: boolean;
  warning?: 'NO_EMPLOYEE_SCHEDULE' | 'OUTSIDE_BUSINESS_HOURS' | null;
  warningMessage?: string;
}

// Calcular hora de fin basada en duración
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

// Convertir hora a minutos para comparación
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Verificar disponibilidad de horario
export async function checkAvailability(
  tenantId: string,
  employeeId: string,
  date: Date,
  startTime: string,
  duration: number,
  excludeAppointmentId?: string
): Promise<{ available: boolean; reason?: string }> {
  const dayOfWeek = date.getDay();
  
  // Verificar horario de trabajo del empleado
  const schedule = await prisma.workSchedule.findFirst({
    where: {
      tenantId,
      userId: employeeId,
      dayOfWeek,
    },
  });
  
  if (!schedule || !schedule.isWorking) {
    return { available: false, reason: 'El empleado no trabaja este día' };
  }
  
  const endTime = calculateEndTime(startTime, duration);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const scheduleStart = timeToMinutes(schedule.startTime);
  const scheduleEnd = timeToMinutes(schedule.endTime);
  
  // Verificar que está dentro del horario de trabajo
  if (startMinutes < scheduleStart || endMinutes > scheduleEnd) {
    return { available: false, reason: 'Fuera del horario de trabajo' };
  }
  
  // Verificar que no está en horario de descanso
  if (schedule.breakStart && schedule.breakEnd) {
    const breakStart = timeToMinutes(schedule.breakStart);
    const breakEnd = timeToMinutes(schedule.breakEnd);
    
    if (
      (startMinutes >= breakStart && startMinutes < breakEnd) ||
      (endMinutes > breakStart && endMinutes <= breakEnd) ||
      (startMinutes <= breakStart && endMinutes >= breakEnd)
    ) {
      return { available: false, reason: 'El horario coincide con el descanso' };
    }
  }
  
  // Verificar días festivos
  const holiday = await prisma.holiday.findFirst({
    where: {
      tenantId,
      date: {
        equals: date,
      },
    },
  });
  
  if (holiday) {
    if (holiday.isFullDay) {
      return { available: false, reason: `Día festivo: ${holiday.name}` };
    }
    
    if (holiday.startTime && holiday.endTime) {
      const holidayStart = timeToMinutes(holiday.startTime);
      const holidayEnd = timeToMinutes(holiday.endTime);
      
      if (
        (startMinutes >= holidayStart && startMinutes < holidayEnd) ||
        (endMinutes > holidayStart && endMinutes <= holidayEnd)
      ) {
        return { available: false, reason: `Horario bloqueado: ${holiday.name}` };
      }
    }
  }
  
  // Verificar conflictos con otras citas
  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      tenantId,
      employeeId,
      date,
      status: { notIn: ['CANCELED', 'NO_SHOW'] },
      id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
      OR: [
        // La nueva cita empieza durante una existente
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } },
          ],
        },
        // La nueva cita termina durante una existente
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } },
          ],
        },
        // La nueva cita contiene a una existente
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
    },
    include: {
      client: {
        select: { firstName: true, lastName: true },
      },
    },
  });
  
  if (conflictingAppointment) {
    return {
      available: false,
      reason: `Conflicto con cita de ${conflictingAppointment.client.firstName} ${conflictingAppointment.client.lastName} a las ${conflictingAppointment.startTime}`,
    };
  }
  
  return { available: true };
}

// Obtener slots disponibles para un día (con warnings para horarios fuera de rango)
export async function getAvailableSlots(
  tenantId: string,
  employeeId: string,
  date: Date,
  serviceDuration: number,
  interval: number = 30 // Intervalo en minutos entre slots
): Promise<TimeSlot[]> {
  const dayOfWeek = date.getDay();
  const slots: TimeSlot[] = [];
  
  console.log(`  📅 [getAvailableSlots] Fecha: ${date.toISOString()}, Día semana: ${dayOfWeek}`);
  console.log(`  👤 Empleado ID: ${employeeId}`);
  console.log(`  ⏱️ Duración servicio: ${serviceDuration} min`);
  
  // 1. Obtener horario del LOCAL (userId = null)
  const businessSchedule = await prisma.workSchedule.findFirst({
    where: {
      tenantId,
      userId: null, // Horario del negocio
      dayOfWeek,
    },
  });
  
  console.log(`  🏢 Horario negocio (día ${dayOfWeek}):`, businessSchedule ? 
    `${businessSchedule.startTime} - ${businessSchedule.endTime}, trabajando: ${businessSchedule.isWorking}` : 
    'NO CONFIGURADO');
  
  // 2. Obtener horario del EMPLEADO
  const employeeSchedule = await prisma.workSchedule.findFirst({
    where: {
      tenantId,
      userId: employeeId,
      dayOfWeek,
    },
  });
  
  console.log(`  👷 Horario empleado (día ${dayOfWeek}):`, employeeSchedule ? 
    `${employeeSchedule.startTime} - ${employeeSchedule.endTime}, trabajando: ${employeeSchedule.isWorking}` : 
    'NO CONFIGURADO');
  
  // Definir rango de horas a mostrar (usar horario del local, o default 08:00-20:00)
  let displayStart = 8 * 60;  // 08:00
  let displayEnd = 20 * 60;   // 20:00
  let businessStart = displayStart;
  let businessEnd = displayEnd;
  let businessBreakStart: number | null = null;
  let businessBreakEnd: number | null = null;
  let isBusinessOpen = true;
  
  if (businessSchedule) {
    businessStart = timeToMinutes(businessSchedule.startTime);
    businessEnd = timeToMinutes(businessSchedule.endTime);
    displayStart = businessStart;
    displayEnd = businessEnd;
    isBusinessOpen = businessSchedule.isWorking;
    businessBreakStart = businessSchedule.breakStart ? timeToMinutes(businessSchedule.breakStart) : null;
    businessBreakEnd = businessSchedule.breakEnd ? timeToMinutes(businessSchedule.breakEnd) : null;
  }
  
  // Si el negocio está cerrado ese día, mostrar slots con warning
  if (!isBusinessOpen) {
    // Mostrar algunos slots con warning de fuera de horario
    for (let minutes = 9 * 60; minutes <= 18 * 60; minutes += interval) {
      const time = `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
      slots.push({
        time,
        available: true,
        warning: 'OUTSIDE_BUSINESS_HOURS',
        warningMessage: 'El negocio está cerrado este día'
      });
    }
    return slots;
  }
  
  // Horario del empleado
  let employeeStart: number | null = null;
  let employeeEnd: number | null = null;
  let employeeBreakStart: number | null = null;
  let employeeBreakEnd: number | null = null;
  let hasEmployeeSchedule = false;
  
  if (employeeSchedule && employeeSchedule.isWorking) {
    hasEmployeeSchedule = true;
    employeeStart = timeToMinutes(employeeSchedule.startTime);
    employeeEnd = timeToMinutes(employeeSchedule.endTime);
    employeeBreakStart = employeeSchedule.breakStart ? timeToMinutes(employeeSchedule.breakStart) : null;
    employeeBreakEnd = employeeSchedule.breakEnd ? timeToMinutes(employeeSchedule.breakEnd) : null;
  }
  
  // Obtener citas existentes del día
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      employeeId,
      date,
      status: { notIn: ['CANCELED', 'NO_SHOW'] },
    },
    select: {
      startTime: true,
      endTime: true,
    },
    orderBy: { startTime: 'asc' },
  });
  
  // Generar todos los slots en el rango del negocio
  for (let minutes = displayStart; minutes + serviceDuration <= displayEnd; minutes += interval) {
    const time = `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
    const slotEnd = minutes + serviceDuration;
    
    // Verificar si está en descanso del negocio
    let inBusinessBreak = false;
    if (businessBreakStart && businessBreakEnd) {
      if (
        (minutes >= businessBreakStart && minutes < businessBreakEnd) ||
        (slotEnd > businessBreakStart && slotEnd <= businessBreakEnd) ||
        (minutes <= businessBreakStart && slotEnd >= businessBreakEnd)
      ) {
        inBusinessBreak = true;
      }
    }
    
    if (inBusinessBreak) {
      slots.push({ time, available: false });
      continue;
    }
    
    // Verificar si hay conflicto con citas existentes
    let hasConflict = false;
    for (const apt of existingAppointments) {
      const aptStart = timeToMinutes(apt.startTime);
      const aptEnd = timeToMinutes(apt.endTime);
      
      if (
        (minutes >= aptStart && minutes < aptEnd) ||
        (slotEnd > aptStart && slotEnd <= aptEnd) ||
        (minutes <= aptStart && slotEnd >= aptEnd)
      ) {
        hasConflict = true;
        break;
      }
    }
    
    if (hasConflict) {
      slots.push({ time, available: false });
      continue;
    }
    
    // Verificar si el empleado tiene horario asignado para este slot
    if (!hasEmployeeSchedule) {
      // Empleado sin horario configurado para este día
      slots.push({
        time,
        available: true,
        warning: 'NO_EMPLOYEE_SCHEDULE',
        warningMessage: 'El empleado no tiene horario asignado para este día'
      });
      continue;
    }
    
    // Verificar si el slot está dentro del horario del empleado
    const isInEmployeeHours = employeeStart !== null && employeeEnd !== null &&
      minutes >= employeeStart && slotEnd <= employeeEnd;
    
    // Verificar descanso del empleado
    let inEmployeeBreak = false;
    if (employeeBreakStart && employeeBreakEnd) {
      if (
        (minutes >= employeeBreakStart && minutes < employeeBreakEnd) ||
        (slotEnd > employeeBreakStart && slotEnd <= employeeBreakEnd) ||
        (minutes <= employeeBreakStart && slotEnd >= employeeBreakEnd)
      ) {
        inEmployeeBreak = true;
      }
    }
    
    if (!isInEmployeeHours || inEmployeeBreak) {
      // Fuera del horario del empleado pero dentro del horario del negocio
      slots.push({
        time,
        available: true,
        warning: 'NO_EMPLOYEE_SCHEDULE',
        warningMessage: 'El empleado no está disponible en este horario'
      });
      continue;
    }
    
    // Slot disponible sin advertencias
    slots.push({ time, available: true });
  }
  
  // Agregar slots fuera del horario del negocio (antes y después)
  // Slots antes del horario comercial
  for (let minutes = 7 * 60; minutes < businessStart && minutes + serviceDuration <= 23 * 60; minutes += interval) {
    const time = `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
    slots.unshift({
      time,
      available: true,
      warning: 'OUTSIDE_BUSINESS_HOURS',
      warningMessage: 'Fuera del horario comercial'
    });
  }
  
  // Slots después del horario comercial
  for (let minutes = businessEnd; minutes + serviceDuration <= 22 * 60; minutes += interval) {
    const time = `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
    slots.push({
      time,
      available: true,
      warning: 'OUTSIDE_BUSINESS_HOURS',
      warningMessage: 'Fuera del horario comercial'
    });
  }
  
  // Ordenar slots por hora
  slots.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  
  return slots;
}

// Crear cita
export async function createAppointment(data: CreateAppointmentData) {
  // Obtener servicio para duración y precio
  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
  });
  
  if (!service) {
    throw new Error('Servicio no encontrado');
  }
  
  const duration = service.duration + service.bufferBefore + service.bufferAfter;
  const endTime = calculateEndTime(data.startTime, duration);
  
  // Verificar disponibilidad
  const availability = await checkAvailability(
    data.tenantId,
    data.employeeId,
    data.date,
    data.startTime,
    duration
  );
  
  if (!availability.available) {
    throw new Error(availability.reason || 'Horario no disponible');
  }
  
  // Crear cita
  const appointment = await prisma.appointment.create({
    data: {
      tenantId: data.tenantId,
      clientId: data.clientId,
      employeeId: data.employeeId,
      serviceId: data.serviceId,
      date: data.date,
      startTime: data.startTime,
      endTime,
      duration,
      price: service.price,
      notes: data.notes,
      clientNotes: data.clientNotes,
      source: data.source || 'internal',
      status: service.requiresConfirm ? 'PENDING' : 'CONFIRMED',
      createdById: data.createdById,
    },
    include: {
      client: true,
      employee: true,
      service: true,
      tenant: true,
    },
  });

  // Agregar extras si se proporcionaron
  if (data.extras && data.extras.length > 0) {
    // Obtener precios de los extras
    const extrasInfo = await prisma.extra.findMany({
      where: {
        id: { in: data.extras.map(e => e.id) },
        tenantId: data.tenantId,
        isActive: true,
      },
    });

    // Crear registros de AppointmentExtra
    const appointmentExtras = data.extras.map(extra => {
      const extraInfo = extrasInfo.find(e => e.id === extra.id);
      if (!extraInfo) return null;
      
      const unitPrice = Number(extraInfo.price);
      return {
        appointmentId: appointment.id,
        extraId: extra.id,
        quantity: extra.quantity,
        unitPrice,
        total: unitPrice * extra.quantity,
      };
    }).filter(Boolean) as any[];

    if (appointmentExtras.length > 0) {
      await prisma.appointmentExtra.createMany({
        data: appointmentExtras,
      });
    }
  }
  
  // Enviar notificación por email
  await sendAppointmentNotification(appointment.id, 'APPOINTMENT_CREATED', 'EMAIL');
  
  // Enviar webhook
  await sendAppointmentWebhook(appointment.id);
  
  // Actualizar estadísticas del cliente
  await prisma.client.update({
    where: { id: data.clientId },
    data: {
      totalVisits: { increment: 1 },
      lastVisit: new Date(),
    },
  });
  
  return appointment;
}

// Actualizar cita
export async function updateAppointment(appointmentId: string, data: UpdateAppointmentData, userId?: string) {
  const currentAppointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { service: true, extras: true },
  });
  
  if (!currentAppointment) {
    throw new Error('Cita no encontrada');
  }
  
  const previousStatus = currentAppointment.status;
  
  // Separar extras del resto de los datos
  const { extras, ...restData } = data;
  let updateData: any = { ...restData };
  
  // Si cambia fecha, hora o empleado, verificar disponibilidad
  if (data.date || data.startTime || data.employeeId || data.serviceId) {
    const serviceId = data.serviceId || currentAppointment.serviceId;
    const service = data.serviceId 
      ? await prisma.service.findUnique({ where: { id: serviceId } })
      : currentAppointment.service;
    
    if (!service) {
      throw new Error('Servicio no encontrado');
    }
    
    const duration = service.duration + service.bufferBefore + service.bufferAfter;
    const startTime = data.startTime || currentAppointment.startTime;
    const endTime = calculateEndTime(startTime, duration);
    
    const availability = await checkAvailability(
      currentAppointment.tenantId,
      data.employeeId || currentAppointment.employeeId,
      data.date || currentAppointment.date,
      startTime,
      duration,
      appointmentId
    );
    
    if (!availability.available) {
      throw new Error(availability.reason || 'Horario no disponible');
    }
    
    updateData.endTime = endTime;
    updateData.duration = duration;
    
    if (data.serviceId) {
      updateData.price = service.price;
    }
  }
  
  // Manejar cambios de estado
  if (data.status) {
    switch (data.status) {
      case 'CONFIRMED':
        updateData.confirmedAt = new Date();
        break;
      case 'COMPLETED':
        updateData.completedAt = new Date();
        updateData.paymentStatus = data.paymentStatus || 'PAID';
        break;
      case 'CANCELED':
        updateData.canceledAt = new Date();
        updateData.canceledBy = userId || 'system';
        break;
    }
  }
  
  // Manejar extras si se proporcionan
  if (extras !== undefined) {
    // Eliminar extras existentes
    await prisma.appointmentExtra.deleteMany({
      where: { appointmentId },
    });
    
    // Agregar nuevos extras
    if (extras && extras.length > 0) {
      const extrasData = await prisma.extra.findMany({
        where: { id: { in: extras.map(e => e.id) } },
      });
      
      for (const extraInput of extras) {
        const extraData = extrasData.find(e => e.id === extraInput.id);
        if (extraData) {
          await prisma.appointmentExtra.create({
            data: {
              appointmentId,
              extraId: extraInput.id,
              quantity: extraInput.quantity || 1,
              unitPrice: extraData.price,
              total: Number(extraData.price) * (extraInput.quantity || 1),
            },
          });
        }
      }
    }
  }
  
  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: updateData,
    include: {
      client: true,
      employee: true,
      service: true,
      tenant: true,
      extras: {
        include: {
          extra: true,
        },
      },
    },
  });
  
  // Enviar notificaciones según el cambio de estado
  if (data.status && data.status !== previousStatus) {
    let notificationType: 'APPOINTMENT_CONFIRMED' | 'APPOINTMENT_CANCELED' | 'APPOINTMENT_RESCHEDULED' | 'APPOINTMENT_COMPLETED' | null = null;
    
    switch (data.status) {
      case 'CONFIRMED':
        notificationType = 'APPOINTMENT_CONFIRMED';
        break;
      case 'CANCELED':
        notificationType = 'APPOINTMENT_CANCELED';
        break;
      case 'RESCHEDULED':
        notificationType = 'APPOINTMENT_RESCHEDULED';
        break;
      case 'COMPLETED':
        notificationType = 'APPOINTMENT_COMPLETED';
        break;
    }
    
    if (notificationType) {
      await sendAppointmentNotification(appointment.id, notificationType, 'EMAIL');
    }
  }
  
  // Enviar webhook
  await sendAppointmentWebhook(appointment.id, previousStatus);
  
  return appointment;
}

// Cancelar cita
export async function cancelAppointment(appointmentId: string, reason: string, canceledBy: string) {
  return updateAppointment(appointmentId, {
    status: 'CANCELED',
    cancelReason: reason,
  }, canceledBy);
}

// Obtener citas por rango de fechas
export async function getAppointmentsByDateRange(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  employeeId?: string,
  status?: AppointmentStatus[]
) {
  const where: Prisma.AppointmentWhereInput = {
    tenantId,
    date: {
      gte: startDate,
      lte: endDate,
    },
    isActive: true,
  };
  
  if (employeeId) {
    where.employeeId = employeeId;
  }
  
  if (status && status.length > 0) {
    where.status = { in: status };
  }
  
  return prisma.appointment.findMany({
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
        },
      },
    },
    orderBy: [
      { date: 'asc' },
      { startTime: 'asc' },
    ],
  }) as any;
}

// Obtener estadísticas de citas
export async function getAppointmentStats(tenantId: string, startDate: Date, endDate: Date) {
  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      status: true,
      price: true,
      date: true,
      employeeId: true,
    },
  });
  
  const total = appointments.length;
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;
  const canceled = appointments.filter(a => a.status === 'CANCELED').length;
  const noShow = appointments.filter(a => a.status === 'NO_SHOW').length;
  const pending = appointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED').length;
  
  const revenue = appointments
    .filter(a => a.status === 'COMPLETED')
    .reduce((sum, a) => sum + Number(a.price), 0);
  
  // Agrupar por día
  const byDay: Record<string, number> = {};
  appointments.forEach(a => {
    const day = a.date.toISOString().split('T')[0];
    byDay[day] = (byDay[day] || 0) + 1;
  });
  
  // Agrupar por empleado
  const byEmployee: Record<string, number> = {};
  appointments.forEach(a => {
    byEmployee[a.employeeId] = (byEmployee[a.employeeId] || 0) + 1;
  });
  
  return {
    total,
    completed,
    canceled,
    noShow,
    pending,
    revenue,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
    cancellationRate: total > 0 ? (canceled / total) * 100 : 0,
    noShowRate: total > 0 ? (noShow / total) * 100 : 0,
    byDay,
    byEmployee,
  };
}
