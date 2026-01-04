import { Request, Response } from 'express';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';
import { paginationSchema } from '../utils/validators.js';
import { z } from 'zod';
import prisma from '../config/database.js';

// Schemas de validación
const createExtraSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

const updateExtraSchema = createExtraSchema.partial();

// Obtener todos los extras del tenant
export const getExtras = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse(req.query);
  const { isActive } = req.query;
  
  const where: any = {
    tenantId: req.tenant!.id,
  };
  
  // Filtrar por estado activo si se especifica
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }
  
  // Búsqueda por nombre o descripción
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  const [extras, total] = await Promise.all([
    prisma.extra.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { [sortBy || 'name']: sortOrder || 'asc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.extra.count({ where }),
  ]);
  
  res.json({
    success: true,
    data: extras,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Obtener extras activos (para select en formularios)
export const getActiveExtras = asyncHandler(async (req: Request, res: Response) => {
  const extras = await prisma.extra.findMany({
    where: {
      tenantId: req.tenant!.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      description: true,
    },
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' },
    ],
  });
  
  res.json({
    success: true,
    data: extras,
  });
});

// Obtener un extra por ID
export const getExtraById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const extra = await prisma.extra.findFirst({
    where: {
      id,
      tenantId: req.tenant!.id,
    },
    include: {
      _count: {
        select: {
          appointments: true,
        },
      },
    },
  });
  
  if (!extra) {
    throw new NotFoundError('Extra');
  }
  
  res.json({
    success: true,
    data: extra,
  });
});

// Crear un nuevo extra
export const createExtra = asyncHandler(async (req: Request, res: Response) => {
  const data = createExtraSchema.parse(req.body);
  
  // Verificar que no exista un extra con el mismo nombre
  const existing = await prisma.extra.findFirst({
    where: {
      tenantId: req.tenant!.id,
      name: data.name,
    },
  });
  
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Ya existe un extra con ese nombre',
    });
  }
  
  const extra = await prisma.extra.create({
    data: {
      tenantId: req.tenant!.id,
      name: data.name,
      description: data.description,
      price: data.price,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    },
  });
  
  res.status(201).json({
    success: true,
    message: 'Extra creado exitosamente',
    data: extra,
  });
});

// Actualizar un extra
export const updateExtra = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateExtraSchema.parse(req.body);
  
  // Verificar que el extra existe
  const existing = await prisma.extra.findFirst({
    where: {
      id,
      tenantId: req.tenant!.id,
    },
  });
  
  if (!existing) {
    throw new NotFoundError('Extra');
  }
  
  // Si se cambia el nombre, verificar que no exista otro con el mismo nombre
  if (data.name && data.name !== existing.name) {
    const duplicate = await prisma.extra.findFirst({
      where: {
        tenantId: req.tenant!.id,
        name: data.name,
        id: { not: id },
      },
    });
    
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe otro extra con ese nombre',
      });
    }
  }
  
  const extra = await prisma.extra.update({
    where: { id },
    data,
  });
  
  res.json({
    success: true,
    message: 'Extra actualizado exitosamente',
    data: extra,
  });
});

// Eliminar un extra
export const deleteExtra = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Verificar que el extra existe
  const existing = await prisma.extra.findFirst({
    where: {
      id,
      tenantId: req.tenant!.id,
    },
    include: {
      _count: {
        select: {
          appointments: true,
        },
      },
    },
  });
  
  if (!existing) {
    throw new NotFoundError('Extra');
  }
  
  // Si tiene citas asociadas, solo desactivar
  if (existing._count.appointments > 0) {
    await prisma.extra.update({
      where: { id },
      data: { isActive: false },
    });
    
    return res.json({
      success: true,
      message: 'Extra desactivado (tiene citas asociadas)',
    });
  }
  
  // Si no tiene citas, eliminar completamente
  await prisma.extra.delete({
    where: { id },
  });
  
  res.json({
    success: true,
    message: 'Extra eliminado exitosamente',
  });
});

// Reordenar extras
export const reorderExtras = asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body;
  
  if (!Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere un array de items',
    });
  }
  
  // Actualizar el orden de cada extra
  await Promise.all(
    items.map((item: { id: string; sortOrder: number }) =>
      prisma.extra.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );
  
  res.json({
    success: true,
    message: 'Orden actualizado exitosamente',
  });
});
