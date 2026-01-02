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
      stats: {
        totalTenants,
        activeTenants,
        inactiveTenants: totalTenants - activeTenants,
        totalUsers,
        totalClients,
        totalAppointments,
        appointmentsThisMonth,
        revenueThisMonth: revenueThisMonth._sum.price || 0,
        tenantsGrowth: {
          thisMonth: tenantsThisMonth,
          lastMonth: tenantsLastMonth,
          percentage: growthPercentage,
        },
      },
      recentActivity: recentActivity.map(apt => ({
        id: apt.id,
        type: 'appointment',
        tenantName: apt.tenant.name,
        tenantSlug: apt.tenant.slug,
        clientName: `${apt.client.firstName} ${apt.client.lastName}`,
        serviceName: apt.service.name,
        date: apt.date,
        status: apt.status,
        createdAt: apt.createdAt,
      })),
      topTenants: topTenants.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        logo: t.logo,
        appointmentsCount: t._count.appointments,
      })),
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

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          plan: { select: { name: true, displayName: true } },
          _count: {
            select: {
              users: true,
              clients: true,
              appointments: true,
              services: true,
            },
          },
        },
        orderBy: { [sortBy as string]: sortOrder },
        skip,
        take,
      }),
      prisma.tenant.count({ where }),
    ]);

    res.json({
      data: tenants.map(t => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        email: t.email,
        phone: t.phone,
        logo: t.logo,
        plan: t.plan,
        subscriptionStatus: t.subscriptionStatus,
        isActive: t.isActive,
        createdAt: t.createdAt,
        counts: t._count,
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

// Actualizar empresa (activar/desactivar, cambiar plan, etc.)
export async function updateTenant(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { isActive, planId, subscriptionStatus } = req.body;

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
    const { page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Últimas citas creadas
    const recentAppointments = await prisma.appointment.findMany({
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { name: true, slug: true } },
        client: { select: { firstName: true, lastName: true } },
        employee: { select: { firstName: true, lastName: true } },
        service: { select: { name: true } },
      },
    });

    res.json({
      data: recentAppointments.map(apt => ({
        id: apt.id,
        type: 'appointment',
        action: `Nueva cita: ${apt.service.name}`,
        tenant: apt.tenant.name,
        client: `${apt.client.firstName} ${apt.client.lastName}`,
        employee: `${apt.employee.firstName} ${apt.employee.lastName}`,
        status: apt.status,
        createdAt: apt.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error getting activity logs:', error);
    res.status(500).json({ error: 'Error al obtener logs' });
  }
}
