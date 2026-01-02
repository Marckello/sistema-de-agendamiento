import { Request, Response } from 'express';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';
import { createUserSchema, updateUserSchema, paginationSchema } from '../utils/validators.js';
import { hashPassword } from '../services/auth.service.js';
import prisma from '../config/database.js';
import { UserRole } from '@prisma/client';

// Obtener usuarios (empleados) del tenant
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search } = paginationSchema.parse(req.query);
  const { role, active } = req.query;
  
  const where: any = {
    tenantId: req.tenant!.id,
  };
  
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  if (role) {
    where.role = role;
  }
  
  if (active !== undefined) {
    where.isActive = active === 'true';
  }
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        title: true,
        specialty: true,
        color: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        services: {
          include: {
            service: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { firstName: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);
  
  const result = users.map(u => ({
    ...u,
    services: u.services.map(s => s.service),
  }));
  
  res.json({
    success: true,
    data: {
      users: result,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// Obtener usuario por ID
export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const user = await prisma.user.findFirst({
    where: {
      id,
      tenantId: req.tenant!.id,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      title: true,
      specialty: true,
      bio: true,
      color: true,
      emailNotifications: true,
      pushNotifications: true,
      theme: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      services: {
        include: {
          service: {
            select: { id: true, name: true, duration: true },
          },
        },
      },
      schedules: true,
    },
  });
  
  if (!user) {
    throw new NotFoundError('Usuario');
  }
  
  res.json({
    success: true,
    data: {
      ...user,
      services: user.services.map(s => s.service),
    },
  });
});

// Crear usuario
export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = createUserSchema.parse(req.body);
  
  // Verificar límite del plan
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.tenant!.id },
    include: { plan: true },
  });
  
  const currentCount = await prisma.user.count({
    where: { tenantId: req.tenant!.id, isActive: true },
  });
  
  if (currentCount >= tenant!.plan.maxEmployees) {
    return res.status(403).json({
      success: false,
      message: `Has alcanzado el límite de ${tenant!.plan.maxEmployees} empleados de tu plan`,
    });
  }
  
  // Verificar que el email no existe en este tenant
  const existing = await prisma.user.findFirst({
    where: {
      tenantId: req.tenant!.id,
      email: data.email,
    },
  });
  
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un usuario con ese email',
    });
  }
  
  // Solo SUPER_ADMIN puede crear otros SUPER_ADMIN
  if (data.role === 'SUPER_ADMIN' && req.user!.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para crear un Super Admin',
    });
  }
  
  const hashedPassword = await hashPassword(data.password);
  
  const user = await prisma.user.create({
    data: {
      tenantId: req.tenant!.id,
      ...data,
      password: hashedPassword,
      role: data.role as UserRole || UserRole.EMPLOYEE,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });
  
  // Crear horarios por defecto (Lunes a Viernes)
  const schedules = [];
  for (let day = 1; day <= 5; day++) {
    schedules.push({
      tenantId: req.tenant!.id,
      userId: user.id,
      dayOfWeek: day,
      isWorking: true,
      startTime: '09:00',
      endTime: '18:00',
    });
  }
  
  await prisma.workSchedule.createMany({ data: schedules });
  
  res.status(201).json({
    success: true,
    message: 'Usuario creado exitosamente',
    data: user,
  });
});

// Actualizar usuario
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateUserSchema.parse(req.body);
  
  const existing = await prisma.user.findFirst({
    where: { id, tenantId: req.tenant!.id },
  });
  
  if (!existing) {
    throw new NotFoundError('Usuario');
  }
  
  // Solo SUPER_ADMIN puede cambiar roles
  if (data.role && req.user!.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para cambiar roles',
    });
  }
  
  // No puede degradar a otro SUPER_ADMIN si no hay otros
  if (existing.role === UserRole.SUPER_ADMIN && data.role && data.role !== 'SUPER_ADMIN') {
    const superAdminCount = await prisma.user.count({
      where: {
        tenantId: req.tenant!.id,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
    });
    
    if (superAdminCount <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Debe haber al menos un Super Admin',
      });
    }
  }
  
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...data,
      role: data.role as UserRole | undefined,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });
  
  res.json({
    success: true,
    message: 'Usuario actualizado exitosamente',
    data: user,
  });
});

// Desactivar/Activar usuario
export const toggleActive = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const existing = await prisma.user.findFirst({
    where: { id, tenantId: req.tenant!.id },
  });
  
  if (!existing) {
    throw new NotFoundError('Usuario');
  }
  
  // No puede desactivarse a sí mismo
  if (id === req.user!.id) {
    return res.status(400).json({
      success: false,
      message: 'No puedes desactivarte a ti mismo',
    });
  }
  
  // No puede desactivar al último SUPER_ADMIN
  if (existing.role === UserRole.SUPER_ADMIN && existing.isActive) {
    const superAdminCount = await prisma.user.count({
      where: {
        tenantId: req.tenant!.id,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
    });
    
    if (superAdminCount <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Debe haber al menos un Super Admin activo',
      });
    }
  }
  
  const user = await prisma.user.update({
    where: { id },
    data: { isActive: !existing.isActive },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  });
  
  res.json({
    success: true,
    message: user.isActive ? 'Usuario activado' : 'Usuario desactivado',
    data: user,
  });
});

// Obtener empleados (para select en citas)
export const getEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { serviceId } = req.query;
  
  let where: any = {
    tenantId: req.tenant!.id,
    isActive: true,
  };
  
  if (serviceId) {
    where.services = {
      some: { serviceId: serviceId as string },
    };
  }
  
  const employees = await prisma.user.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      title: true,
      avatar: true,
      specialty: true,
      color: true,
    },
    orderBy: { firstName: 'asc' },
  });
  
  res.json({
    success: true,
    data: employees,
  });
});

// Actualizar perfil propio
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = updateUserSchema.parse(req.body);
  
  // No puede cambiar su propio rol
  delete data.role;
  
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      title: true,
      specialty: true,
      bio: true,
      color: true,
      emailNotifications: true,
      pushNotifications: true,
      theme: true,
    },
  });
  
  res.json({
    success: true,
    message: 'Perfil actualizado exitosamente',
    data: user,
  });
});
