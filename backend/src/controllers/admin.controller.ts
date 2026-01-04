import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { Prisma } from '@prisma/client';

// ============================================
// DASHBOARD STATS
// ============================================

// Obtener estadísticas globales de la plataforma
export async function getPlatformStats(req: Request, res: Response) {
  try {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalClients,
      totalAppointments,
      appointmentsThisMonth,
      revenueThisMonth,
      tenantsGrowth,
    ] = await Promise.all([
      // Total de empresas
      prisma.tenant.count(),
      // Empresas activas
      prisma.tenant.count({ where: { isActive: true } }),
      // Total de usuarios
      prisma.user.count(),
      // Total de clientes
      prisma.client.count(),
      // Total de citas
      prisma.appointment.count(),
      // Citas este mes
      prisma.appointment.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      // Ingresos este mes (suma de todas las citas completadas)
      prisma.appointment.aggregate({
        _sum: { price: true },
        where: {
          status: 'COMPLETED',
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      // Nuevas empresas este mes vs mes anterior
      Promise.all([
        prisma.tenant.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        prisma.tenant.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
              lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]),
    ]);

    // Calcular crecimiento
    const [tenantsThisMonth, tenantsLastMonth] = tenantsGrowth;
    const growthPercentage = tenantsLastMonth > 0 
      ? ((tenantsThisMonth - tenantsLastMonth) / tenantsLastMonth * 100).toFixed(1)
      : tenantsThisMonth > 0 ? '100' : '0';

    // Obtener actividad reciente (últimas 10 acciones)
    const recentActivity = await prisma.appointment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { name: true, slug: true } },
        client: { select: { firstName: true, lastName: true } },
        service: { select: { name: true } },
      },
    });

    // Empresas más activas (por número de citas este mes)
    const topTenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        _count: {
          select: {
            appointments: {
              where: {
                createdAt: {
                  gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
              },
            },
          },
        },
      },
      orderBy: {
        appointments: { _count: 'desc' },
      },
      take: 5,
    });

    res.json({
      totalTenants,
      activeTenants,
      inactiveTenants: totalTenants - activeTenants,
      totalUsers,
      totalClients,
      totalAppointments,
      appointmentsThisMonth,
      monthlyRevenue: revenueThisMonth._sum.price || 0,
      growth: {
        tenants: tenantsLastMonth > 0 
          ? Math.round((tenantsThisMonth - tenantsLastMonth) / tenantsLastMonth * 100)
          : tenantsThisMonth > 0 ? 100 : 0,
        users: 0,
        appointments: 0,
      },
    });
  } catch (error) {
    console.error('Error getting platform stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}

// ============================================
// TENANTS MANAGEMENT
// ============================================

// Listar todas las empresas
export async function listTenants(req: Request, res: Response) {
  try {
    const { 
      page = '1', 
      limit = '20', 
      search = '',
      status = '',
      planId = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: Prisma.TenantWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { slug: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    if (planId) {
      where.planId = planId as string;
    }

    // Determinar el ordenamiento
    let orderBy: Prisma.TenantOrderByWithRelationInput = { createdAt: 'desc' };
    
    if (sortBy === 'appointments') {
      orderBy = { appointments: { _count: sortOrder as 'asc' | 'desc' } };
    } else if (sortBy === 'users') {
      orderBy = { users: { _count: sortOrder as 'asc' | 'desc' } };
    } else if (sortBy === 'clients') {
      orderBy = { clients: { _count: sortOrder as 'asc' | 'desc' } };
    } else if (['name', 'createdAt', 'updatedAt'].includes(sortBy as string)) {
      orderBy = { [sortBy as string]: sortOrder };
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          plan: { select: { id: true, name: true, displayName: true, price: true } },
          _count: {
            select: {
              users: true,
              clients: true,
              appointments: true,
              services: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.tenant.count({ where }),
    ]);

    res.json({
      tenants: tenants.map(t => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        email: t.email,
        phone: t.phone,
        logo: t.logo,
        plan: t.plan,
        planId: t.planId,
        subscriptionStatus: t.subscriptionStatus,
        isActive: t.isActive,
        createdAt: t.createdAt,
        _count: t._count,
      })),
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Error listing tenants:', error);
    res.status(500).json({ error: 'Error al listar empresas' });
  }
}

// Obtener detalle de una empresa
export async function getTenantDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        plan: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
            lastLogin: true,
          },
        },
        _count: {
          select: {
            clients: true,
            appointments: true,
            services: true,
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Estadísticas de la empresa
    const [appointmentsThisMonth, revenue, clientsGrowth] = await Promise.all([
      prisma.appointment.count({
        where: {
          tenantId: id,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.appointment.aggregate({
        _sum: { price: true },
        where: {
          tenantId: id,
          status: 'COMPLETED',
        },
      }),
      prisma.client.count({
        where: {
          tenantId: id,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    res.json({
      ...tenant,
      stats: {
        appointmentsThisMonth,
        totalRevenue: revenue._sum.price || 0,
        newClientsThisMonth: clientsGrowth,
      },
    });
  } catch (error) {
    console.error('Error getting tenant detail:', error);
    res.status(500).json({ error: 'Error al obtener detalle de empresa' });
  }
}

// Actualizar empresa (activar/desactivar, cambiar plan, configuración de IA, etc.)
export async function updateTenant(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { isActive, planId, subscriptionStatus, aiEnabled, aiModel, aiMaxTokens, aiTemperature } = req.body;

    const updateData: Prisma.TenantUpdateInput = {};

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    if (planId) {
      updateData.plan = { connect: { id: planId } };
    }

    if (subscriptionStatus) {
      updateData.subscriptionStatus = subscriptionStatus;
    }

    // AI Configuration
    if (typeof aiEnabled === 'boolean') {
      updateData.aiEnabled = aiEnabled;
    }

    if (aiModel) {
      updateData.aiModel = aiModel;
    }

    if (typeof aiMaxTokens === 'number') {
      updateData.aiMaxTokens = aiMaxTokens;
    }

    if (typeof aiTemperature === 'number') {
      updateData.aiTemperature = aiTemperature;
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
      include: {
        plan: { select: { name: true, displayName: true } },
      },
    });

    res.json(tenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Error al actualizar empresa' });
  }
}

// ============================================
// PLANS MANAGEMENT
// ============================================

// Listar planes
export async function listPlans(req: Request, res: Response) {
  try {
    const plans = await prisma.plan.findMany({
      include: {
        _count: {
          select: { tenants: true },
        },
      },
      orderBy: { price: 'asc' },
    });

    res.json(plans);
  } catch (error) {
    console.error('Error listing plans:', error);
    res.status(500).json({ error: 'Error al listar planes' });
  }
}

// ============================================
// ANALYTICS
// ============================================

// Obtener métricas de uso
export async function getUsageMetrics(req: Request, res: Response) {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Citas por día
    const appointmentsByDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE(date) as date, COUNT(*) as count
      FROM appointments
      WHERE date >= ${startDate}
      GROUP BY DATE(date)
      ORDER BY date ASC
    `;

    // Nuevos tenants por día
    const tenantsByDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM tenants
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Nuevos clientes por día
    const clientsByDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM clients
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Distribución por plan
    const planDistribution = await prisma.tenant.groupBy({
      by: ['planId'],
      _count: true,
      where: { isActive: true },
    });

    const plans = await prisma.plan.findMany({
      select: { id: true, displayName: true },
    });

    const planMap = new Map(plans.map(p => [p.id, p.displayName]));

    // Tasa de conversión (citas completadas vs total)
    const [completedAppointments, totalAppointments] = await Promise.all([
      prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      prisma.appointment.count(),
    ]);

    res.json({
      appointmentsTrend: appointmentsByDay.map(d => ({
        date: d.date,
        count: Number(d.count),
      })),
      tenantsTrend: tenantsByDay.map(d => ({
        date: d.date,
        count: Number(d.count),
      })),
      clientsTrend: clientsByDay.map(d => ({
        date: d.date,
        count: Number(d.count),
      })),
      planDistribution: planDistribution.map(p => ({
        plan: planMap.get(p.planId) || 'Unknown',
        count: p._count,
      })),
      conversionRate: totalAppointments > 0 
        ? ((completedAppointments / totalAppointments) * 100).toFixed(1)
        : 0,
    });
  } catch (error) {
    console.error('Error getting usage metrics:', error);
    res.status(500).json({ error: 'Error al obtener métricas' });
  }
}

// Obtener logs de actividad global
export async function getActivityLogs(req: Request, res: Response) {
  try {
    const { page = '1', limit = '50', action } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Últimas citas creadas
    const recentAppointments = await prisma.appointment.findMany({
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        client: { select: { firstName: true, lastName: true } },
        employee: { select: { id: true, firstName: true, lastName: true } },
        service: { select: { name: true } },
      },
    });

    const total = await prisma.appointment.count();

    res.json({
      logs: recentAppointments.map(apt => ({
        id: apt.id,
        action: 'APPOINTMENT_CREATED',
        description: `Nueva cita: ${apt.service.name} para ${apt.client.firstName} ${apt.client.lastName}`,
        tenant: { id: apt.tenant.id, name: apt.tenant.name },
        user: apt.employee ? { id: apt.employee.id, firstName: apt.employee.firstName, lastName: apt.employee.lastName } : null,
        createdAt: apt.createdAt,
      })),
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Error getting activity logs:', error);
    res.status(500).json({ error: 'Error al obtener logs' });
  }
}

// ============================================
// PLANS CRUD
// ============================================

// Crear plan
export async function createPlan(req: Request, res: Response) {
  try {
    const {
      name,
      price,
      maxUsers,
      maxClients,
      maxAppointmentsPerMonth,
      hasWhatsApp,
      hasAI,
      hasReports,
      hasCustomBranding,
    } = req.body;

    const plan = await prisma.plan.create({
      data: {
        name,
        displayName: name,
        price: price || 0,
        maxEmployees: maxUsers || 5,
        maxClients: maxClients || 100,
        maxAppointments: maxAppointmentsPerMonth || 500,
        hasPublicBooking: true,
        hasEmailReminders: true,
        hasSmsReminders: hasWhatsApp || false,
        hasWebhooks: false,
        hasReports: hasReports || false,
        hasCustomBranding: hasCustomBranding || false,
      },
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Error al crear plan' });
  }
}

// Actualizar plan
export async function updatePlan(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      maxUsers,
      maxClients,
      maxAppointmentsPerMonth,
      hasWhatsApp,
      hasAI,
      hasReports,
      hasCustomBranding,
    } = req.body;

    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name;
      updateData.displayName = name;
    }
    if (price !== undefined) updateData.price = price;
    if (maxUsers !== undefined) updateData.maxEmployees = maxUsers;
    if (maxClients !== undefined) updateData.maxClients = maxClients;
    if (maxAppointmentsPerMonth !== undefined) updateData.maxAppointments = maxAppointmentsPerMonth;
    if (hasWhatsApp !== undefined) updateData.hasSmsReminders = hasWhatsApp;
    if (hasReports !== undefined) updateData.hasReports = hasReports;
    if (hasCustomBranding !== undefined) updateData.hasCustomBranding = hasCustomBranding;

    const plan = await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    res.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Error al actualizar plan' });
  }
}

// Eliminar plan
export async function deletePlan(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Verificar que no tenga empresas asociadas
    const tenantsCount = await prisma.tenant.count({
      where: { planId: id },
    });

    if (tenantsCount > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar el plan. Hay ${tenantsCount} empresa(s) asociada(s).` 
      });
    }

    await prisma.plan.delete({
      where: { id },
    });

    res.json({ message: 'Plan eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Error al eliminar plan' });
  }
}
