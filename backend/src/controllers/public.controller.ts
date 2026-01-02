import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  startOfDay,
  endOfDay,
  parseISO,
  addMinutes,
  format,
  isBefore,
  isAfter,
} from 'date-fns';

// Get tenant info by slug (subdomain)
export const getTenantBySubdomain = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subdomain } = req.params;

    const tenant = await prisma.tenant.findFirst({
      where: {
        slug: subdomain,
        isActive: true,
      },
    });

    if (!tenant) {
      throw new AppError('Business not found or not accepting online bookings', 404);
    }

    res.json({
      success: true,
      data: {
        name: tenant.name,
        subdomain: tenant.slug,
        logo: tenant.logo,
        primaryColor: tenant.primaryColor || '#3B82F6',
        address: tenant.address || '',
        phone: tenant.phone || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get public services for a tenant
export const getPublicServices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const slug = req.headers['x-tenant-subdomain'] as string || req.headers['x-tenant-slug'] as string;

    if (!slug) {
      throw new AppError('Subdomain required', 400);
    }

    const tenant = await prisma.tenant.findFirst({
      where: { slug, isActive: true },
    });

    if (!tenant) {
      throw new AppError('Business not found', 404);
    }

    const services = await prisma.service.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
        isPublic: true,
      },
      include: {
        category: {
          select: {
            name: true,
            color: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

// Get employees for a service
export const getPublicEmployees = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const slug = req.headers['x-tenant-subdomain'] as string || req.headers['x-tenant-slug'] as string;

    if (!slug) {
      throw new AppError('Subdomain required', 400);
    }

    const tenant = await prisma.tenant.findFirst({
      where: { slug, isActive: true },
    });

    if (!tenant) {
      throw new AppError('Business not found', 404);
    }

    const employees = await prisma.user.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
        role: 'EMPLOYEE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
      orderBy: { firstName: 'asc' },
    });

    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

// Get available time slots
export const getAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const slug = req.headers['x-tenant-subdomain'] as string || req.headers['x-tenant-slug'] as string;
    const { employeeId, date, duration } = req.query;

    if (!slug || !employeeId || !date) {
      throw new AppError('Missing required parameters', 400);
    }

    const tenant = await prisma.tenant.findFirst({
      where: { slug, isActive: true },
    });

    if (!tenant) {
      throw new AppError('Business not found', 404);
    }

    const selectedDate = parseISO(date as string);
    const serviceDuration = parseInt(duration as string) || 30;
    const dayOfWeek = selectedDate.getDay();

    // Get work schedule for this day
    const schedule = await prisma.workSchedule.findFirst({
      where: {
        tenantId: tenant.id,
        userId: employeeId as string,
        dayOfWeek,
      },
    });

    if (!schedule) {
      return res.json({ success: true, data: [] });
    }

    // Get existing appointments for this employee on this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        tenantId: tenant.id,
        employeeId: employeeId as string,
        date: {
          gte: startOfDay(selectedDate),
          lte: endOfDay(selectedDate),
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Generate time slots
    const slots: { time: string; available: boolean }[] = [];
    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = schedule.endTime.split(':').map(Number);

    let currentSlot = new Date(selectedDate);
    currentSlot.setHours(startHour, startMin, 0, 0);

    const endTime = new Date(selectedDate);
    endTime.setHours(endHour, endMin, 0, 0);

    const now = new Date();

    while (isBefore(currentSlot, endTime)) {
      const slotEnd = addMinutes(currentSlot, serviceDuration);

      // Check if slot is in the past
      const isPast = isBefore(currentSlot, now);

      // Check if slot overlaps with existing appointments
      // Note: apt.startTime and apt.endTime are strings "HH:mm"
      const isOccupied = existingAppointments.some((apt) => {
        const [aptStartHour, aptStartMin] = apt.startTime.split(':').map(Number);
        const [aptEndHour, aptEndMin] = apt.endTime.split(':').map(Number);
        
        const aptStart = new Date(selectedDate);
        aptStart.setHours(aptStartHour, aptStartMin, 0, 0);
        
        const aptEnd = new Date(selectedDate);
        aptEnd.setHours(aptEndHour, aptEndMin, 0, 0);
        
        return (
          (isAfter(currentSlot, aptStart) && isBefore(currentSlot, aptEnd)) ||
          (isAfter(slotEnd, aptStart) && isBefore(slotEnd, aptEnd)) ||
          (isBefore(currentSlot, aptStart) && isAfter(slotEnd, aptEnd)) ||
          currentSlot.getTime() === aptStart.getTime()
        );
      });

      slots.push({
        time: format(currentSlot, 'HH:mm'),
        available: !isPast && !isOccupied && isBefore(slotEnd, endTime),
      });

      currentSlot = addMinutes(currentSlot, 30); // 30 min intervals
    }

    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

// Create public appointment
export const createPublicAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const slug = req.headers['x-tenant-subdomain'] as string || req.headers['x-tenant-slug'] as string;
    const { serviceId, employeeId, date, time, client } = req.body;

    if (!slug) {
      throw new AppError('Subdomain required', 400);
    }

    const tenant = await prisma.tenant.findFirst({
      where: { slug, isActive: true },
    });

    if (!tenant) {
      throw new AppError('Business not found', 404);
    }

    // Validate service
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        tenantId: tenant.id,
        isActive: true,
        isPublic: true,
      },
    });

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    // Validate employee
    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        tenantId: tenant.id,
        isActive: true,
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Create or find client
    let existingClient = await prisma.client.findFirst({
      where: {
        tenantId: tenant.id,
        email: client.email,
      },
    });

    if (!existingClient) {
      existingClient = await prisma.client.create({
        data: {
          tenantId: tenant.id,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone || null,
        },
      });
    }

    // Calculate start and end times
    const [hours, minutes] = time.split(':').map(Number);
    const appointmentDate = parseISO(date);
    appointmentDate.setHours(0, 0, 0, 0);
    
    const startTimeDate = new Date(appointmentDate);
    startTimeDate.setHours(hours, minutes, 0, 0);
    const endTimeDate = addMinutes(startTimeDate, service.duration);
    
    // Format times as strings "HH:mm"
    const startTimeStr = format(startTimeDate, 'HH:mm');
    const endTimeStr = format(endTimeDate, 'HH:mm');

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        clientId: existingClient.id,
        employeeId: employee.id,
        serviceId: service.id,
        date: appointmentDate,
        startTime: startTimeStr,
        endTime: endTimeStr,
        price: service.price,
        status: 'PENDING',
        notes: client.notes || null,
        source: 'ONLINE',
      },
      include: {
        service: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};
