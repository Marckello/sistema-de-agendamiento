import { Request, Response } from 'express';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';
import { 
  createServiceSchema, 
  updateServiceSchema, 
  createServiceCategorySchema,
  paginationSchema 
} from '../utils/validators.js';
import prisma from '../config/database.js';

// ==================== CATEGORÍAS ====================

// Obtener categorías
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.serviceCategory.findMany({
    where: {
      tenantId: req.tenant!.id,
      isActive: true,
    },
    include: {
      services: {
        where: { isActive: true },
        select: { id: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });
  
  const result = categories.map(cat => ({
    ...cat,
    serviceCount: cat.services.length,
    services: undefined,
  }));
  
  res.json({
    success: true,
    data: result,
  });
});

// Crear categoría
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const data = createServiceCategorySchema.parse(req.body);
  
  const category = await prisma.serviceCategory.create({
    data: {
      tenantId: req.tenant!.id,
      ...data,
    },
  });
  
  res.status(201).json({
    success: true,
    message: 'Categoría creada exitosamente',
    data: category,
  });
});

// Actualizar categoría
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = createServiceCategorySchema.partial().parse(req.body);
  
  const existing = await prisma.serviceCategory.findFirst({
    where: { id, tenantId: req.tenant!.id },
  });
  
  if (!existing) {
    throw new NotFoundError('Categoría');
  }
  
  const category = await prisma.serviceCategory.update({
    where: { id },
    data,
  });
  
  res.json({
    success: true,
    message: 'Categoría actualizada exitosamente',
    data: category,
  });
});

// Eliminar categoría
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const existing = await prisma.serviceCategory.findFirst({
    where: { id, tenantId: req.tenant!.id },
    include: { services: { where: { isActive: true } } },
  });
  
  if (!existing) {
    throw new NotFoundError('Categoría');
  }
  
  if (existing.services.length > 0) {
    return res.status(400).json({
      success: false,
      message: `La categoría tiene ${existing.services.length} servicio(s). Muévelos o elimínalos primero.`,
    });
  }
  
  await prisma.serviceCategory.update({
    where: { id },
    data: { isActive: false },
  });
  
  res.json({
    success: true,
    message: 'Categoría eliminada exitosamente',
  });
});

// ==================== SERVICIOS ====================

// Obtener servicios
export const getServices = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, isPublic } = req.query;
  
  const where: any = {
    tenantId: req.tenant!.id,
    isActive: true,
  };
  
  if (categoryId) {
    where.categoryId = categoryId;
  }
  
  if (isPublic !== undefined) {
    where.isPublic = isPublic === 'true';
  }
  
  const services = await prisma.service.findMany({
    where,
    include: {
      category: {
        select: { id: true, name: true, color: true },
      },
      employees: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
              avatar: true,
            },
          },
        },
      },
      schedules: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  
  const result = services.map(service => ({
    ...service,
    bufferTime: service.bufferAfter,
    requiresConfirmation: service.requiresConfirm,
    employees: service.employees.map(e => e.user),
  }));
  
  res.json({
    success: true,
    data: result,
  });
});

// Obtener servicio por ID
export const getService = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const service = await prisma.service.findFirst({
    where: { id, tenantId: req.tenant!.id },
    include: {
      category: true,
      employees: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
              avatar: true,
              specialty: true,
            },
          },
        },
      },
      schedules: true,
    },
  });
  
  if (!service) {
    throw new NotFoundError('Servicio');
  }
  
  res.json({
    success: true,
    data: {
      ...service,
      bufferTime: service.bufferAfter,
      requiresConfirmation: service.requiresConfirm,
      employees: service.employees.map(e => e.user),
    },
  });
});

// Crear servicio
export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = createServiceSchema.parse(req.body);
  const { employeeIds, schedules, bufferTime, requiresConfirmation, ...serviceData } = data;
  
  const service = await prisma.service.create({
    data: {
      tenantId: req.tenant!.id,
      ...serviceData,
      bufferAfter: bufferTime || serviceData.bufferAfter || 0,
      requiresConfirm: requiresConfirmation ?? serviceData.requiresConfirm ?? false,
    },
  });
  
  // Asignar empleados
  if (employeeIds && employeeIds.length > 0) {
    await prisma.userService.createMany({
      data: employeeIds.map(userId => ({
        userId,
        serviceId: service.id,
      })),
    });
  }

  // Crear horarios del servicio
  if (schedules && schedules.length > 0) {
    await prisma.serviceSchedule.createMany({
      data: schedules.map(s => ({
        serviceId: service.id,
        dayOfWeek: s.dayOfWeek,
        isAvailable: s.isAvailable,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    });
  }
  
  res.status(201).json({
    success: true,
    message: 'Servicio creado exitosamente',
    data: service,
  });
});

// Actualizar servicio
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateServiceSchema.parse(req.body);
  const { employeeIds, schedules, bufferTime, requiresConfirmation, ...serviceData } = data;
  
  const existing = await prisma.service.findFirst({
    where: { id, tenantId: req.tenant!.id },
  });
  
  if (!existing) {
    throw new NotFoundError('Servicio');
  }
  
  const service = await prisma.service.update({
    where: { id },
    data: {
      ...serviceData,
      ...(bufferTime !== undefined && { bufferAfter: bufferTime }),
      ...(requiresConfirmation !== undefined && { requiresConfirm: requiresConfirmation }),
    },
  });
  
  // Actualizar empleados si se especificaron
  if (employeeIds !== undefined) {
    // Eliminar asignaciones actuales
    await prisma.userService.deleteMany({
      where: { serviceId: id },
    });
    
    // Crear nuevas asignaciones
    if (employeeIds.length > 0) {
      await prisma.userService.createMany({
        data: employeeIds.map(userId => ({
          userId,
          serviceId: id,
        })),
      });
    }
  }

  // Actualizar horarios si se especificaron
  if (schedules !== undefined) {
    // Eliminar horarios actuales
    await prisma.serviceSchedule.deleteMany({
      where: { serviceId: id },
    });
    
    // Crear nuevos horarios
    if (schedules.length > 0) {
      await prisma.serviceSchedule.createMany({
        data: schedules.map(s => ({
          serviceId: id,
          dayOfWeek: s.dayOfWeek,
          isAvailable: s.isAvailable,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
    }
  }
  
  res.json({
    success: true,
    message: 'Servicio actualizado exitosamente',
    data: service,
  });
});

// Toggle active status
export const toggleActive = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const existing = await prisma.service.findFirst({
    where: { id, tenantId: req.tenant!.id },
  });
  
  if (!existing) {
    throw new NotFoundError('Servicio');
  }
  
  const service = await prisma.service.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
  
  res.json({
    success: true,
    message: service.isActive ? 'Servicio activado' : 'Servicio desactivado',
    data: service,
  });
});

// Eliminar servicio
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const existing = await prisma.service.findFirst({
    where: { id, tenantId: req.tenant!.id },
  });
  
  if (!existing) {
    throw new NotFoundError('Servicio');
  }
  
  // Verificar si tiene citas futuras
  const futureAppointments = await prisma.appointment.count({
    where: {
      serviceId: id,
      date: { gte: new Date() },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
  });
  
  if (futureAppointments > 0) {
    return res.status(400).json({
      success: false,
      message: `El servicio tiene ${futureAppointments} cita(s) futuras. Cancélalas primero.`,
    });
  }
  
  await prisma.service.update({
    where: { id },
    data: { isActive: false },
  });
  
  res.json({
    success: true,
    message: 'Servicio eliminado exitosamente',
  });
});

// Obtener servicios públicos (para booking)
export const getPublicServices = asyncHandler(async (req: Request, res: Response) => {
  const { tenantSlug } = req.params;
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true, plan: true },
  });
  
  if (!tenant) {
    throw new NotFoundError('Negocio');
  }
  
  // Verificar si el plan permite booking público
  if (!tenant.plan.hasPublicBooking) {
    return res.status(403).json({
      success: false,
      message: 'Este negocio no tiene habilitado el booking público',
    });
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
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
              specialty: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  
  res.json({
    success: true,
    data: {
      tenant: { name: tenant.name },
      services: services.map(s => ({
        ...s,
        employees: s.employees.map(e => e.user),
      })),
    },
  });
});
