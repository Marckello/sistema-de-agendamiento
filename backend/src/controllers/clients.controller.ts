import { Request, Response } from 'express';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';
import { createClientSchema, updateClientSchema, paginationSchema } from '../utils/validators.js';
import prisma from '../config/database.js';
import { sendClientWebhook } from '../services/webhook.service.js';
import { Prisma, ClientStatus } from '@prisma/client';

// Obtener clientes con paginación y búsqueda
export const getClients = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse(req.query);
  const { status, tags } = req.query;
  
  const where: Prisma.ClientWhereInput = {
    tenantId: req.tenant!.id,
    isActive: true,
  };
  
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }
  
  if (status) {
    where.status = status as ClientStatus;
  }
  
  if (tags) {
    const tagList = (tags as string).split(',');
    where.tags = { hasSome: tagList };
  }
  
  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        _count: {
          select: {
            appointments: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: sortBy 
        ? { [sortBy]: sortOrder || 'asc' } 
        : [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.client.count({ where }),
  ]);
  
  res.json({
    success: true,
    data: {
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// Obtener cliente por ID
export const getClient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const client = await prisma.client.findFirst({
    where: {
      id,
      tenantId: req.tenant!.id,
    },
    include: {
      appointments: {
        orderBy: { date: 'desc' },
        take: 10,
        include: {
          service: { select: { name: true, price: true } },
          employee: { select: { firstName: true, lastName: true, title: true } },
          extras: {
            include: {
              extra: { select: { name: true, price: true } },
            },
          },
        },
      },
    },
  });
  
  if (!client) {
    throw new NotFoundError('Cliente');
  }
  
  // Calcular totalSpent si está en 0 (migración de datos antiguos)
  if (Number(client.totalSpent) === 0) {
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        clientId: id,
        status: 'COMPLETED',
        isActive: true,
      },
      include: {
        extras: true,
      },
    });
    
    if (completedAppointments.length > 0) {
      const calculatedTotal = completedAppointments.reduce((sum, apt) => {
        const extrasTotal = apt.extras.reduce((eSum, e) => eSum + Number(e.total), 0);
        return sum + Number(apt.price) + extrasTotal;
      }, 0);
      
      // Actualizar el totalSpent
      await prisma.client.update({
        where: { id },
        data: { totalSpent: calculatedTotal },
      });
      
      // Actualizar el objeto cliente para la respuesta
      (client as any).totalSpent = calculatedTotal;
    }
  }
  
  res.json({
    success: true,
    data: client,
  });
});

// Crear cliente
export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = createClientSchema.parse(req.body);
  
  // Verificar si ya existe un cliente con ese teléfono
  const existing = await prisma.client.findFirst({
    where: {
      tenantId: req.tenant!.id,
      phone: data.phone,
    },
  });
  
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un cliente con ese número de teléfono',
    });
  }
  
  const client = await prisma.client.create({
    data: {
      tenantId: req.tenant!.id,
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      email: data.email || null,
    },
  });
  
  // Enviar webhook
  await sendClientWebhook(client.id, true);
  
  res.status(201).json({
    success: true,
    message: 'Cliente creado exitosamente',
    data: client,
  });
});

// Actualizar cliente
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateClientSchema.parse(req.body);
  
  // Verificar que existe
  const existing = await prisma.client.findFirst({
    where: { id, tenantId: req.tenant!.id },
  });
  
  if (!existing) {
    throw new NotFoundError('Cliente');
  }
  
  // Si cambia el teléfono, verificar que no exista otro cliente con ese teléfono
  if (data.phone && data.phone !== existing.phone) {
    const duplicate = await prisma.client.findFirst({
      where: {
        tenantId: req.tenant!.id,
        phone: data.phone,
        id: { not: id },
      },
    });
    
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un cliente con ese número de teléfono',
      });
    }
  }
  
  const client = await prisma.client.update({
    where: { id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    },
  });
  
  // Enviar webhook
  await sendClientWebhook(client.id, false);
  
  res.json({
    success: true,
    message: 'Cliente actualizado exitosamente',
    data: client,
  });
});

// Eliminar cliente (soft delete)
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const existing = await prisma.client.findFirst({
    where: { id, tenantId: req.tenant!.id },
  });
  
  if (!existing) {
    throw new NotFoundError('Cliente');
  }
  
  // Verificar si tiene citas futuras
  const futureAppointments = await prisma.appointment.count({
    where: {
      clientId: id,
      date: { gte: new Date() },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
  });
  
  if (futureAppointments > 0) {
    return res.status(400).json({
      success: false,
      message: `El cliente tiene ${futureAppointments} cita(s) futuras. Cancélalas primero.`,
    });
  }
  
  await prisma.client.update({
    where: { id },
    data: { isActive: false },
  });
  
  res.json({
    success: true,
    message: 'Cliente eliminado exitosamente',
  });
});

// Buscar clientes (para autocomplete)
export const search = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  
  if (!q || (q as string).length < 2) {
    return res.json({
      success: true,
      data: [],
    });
  }
  
  const clients = await prisma.client.findMany({
    where: {
      tenantId: req.tenant!.id,
      isActive: true,
      OR: [
        { firstName: { contains: q as string, mode: 'insensitive' } },
        { lastName: { contains: q as string, mode: 'insensitive' } },
        { phone: { contains: q as string } },
        { email: { contains: q as string, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
    },
    take: 10,
    orderBy: { lastName: 'asc' },
  });
  
  res.json({
    success: true,
    data: clients,
  });
});

// Obtener historial de citas de un cliente
export const getAppointmentHistory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page, limit } = paginationSchema.parse(req.query);
  
  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        clientId: id,
        tenantId: req.tenant!.id,
      },
      include: {
        service: { select: { name: true, price: true } },
        employee: { select: { firstName: true, lastName: true, title: true } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.appointment.count({
      where: { clientId: id, tenantId: req.tenant!.id },
    }),
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

// Obtener tags únicos
export const getTags = asyncHandler(async (req: Request, res: Response) => {
  const clients = await prisma.client.findMany({
    where: { tenantId: req.tenant!.id },
    select: { tags: true },
  });
  
  const allTags = new Set<string>();
  clients.forEach(c => c.tags.forEach(tag => allTags.add(tag)));
  
  res.json({
    success: true,
    data: Array.from(allTags).sort(),
  });
});

// Estadísticas de clientes
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const [total, byStatus, newThisMonth, topClients] = await Promise.all([
    prisma.client.count({
      where: { tenantId: req.tenant!.id, isActive: true },
    }),
    prisma.client.groupBy({
      by: ['status'],
      where: { tenantId: req.tenant!.id, isActive: true },
      _count: true,
    }),
    prisma.client.count({
      where: {
        tenantId: req.tenant!.id,
        createdAt: {
          gte: new Date(new Date().setDate(1)),
        },
      },
    }),
    prisma.client.findMany({
      where: { tenantId: req.tenant!.id, isActive: true },
      orderBy: { totalVisits: 'desc' },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        totalVisits: true,
        totalSpent: true,
      },
    }),
  ]);
  
  res.json({
    success: true,
    data: {
      total,
      byStatus: byStatus.reduce((acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      }, {} as Record<string, number>),
      newThisMonth,
      topClients,
    },
  });
});
