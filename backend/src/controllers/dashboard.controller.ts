import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import prisma from '../config/database.js';

// Dashboard principal - métricas del día/mes
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  
  // Citas de hoy
  const todayAppointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: { notIn: ['CANCELED'] },
    },
    include: {
      client: {
        select: { firstName: true, lastName: true, phone: true },
      },
      employee: {
        select: { firstName: true, lastName: true, title: true, color: true },
      },
      service: {
        select: { name: true, duration: true },
      },
    },
    orderBy: { startTime: 'asc' },
  });
  
  // Estadísticas del mes
  const [
    monthlyAppointments,
    lastMonthAppointments,
    monthlyRevenue,
    lastMonthRevenue,
    newClientsThisMonth,
    newClientsLastMonth,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        tenantId,
        date: { gte: startOfMonth, lte: endOfMonth },
        status: { notIn: ['CANCELED'] },
      },
    }),
    prisma.appointment.count({
      where: {
        tenantId,
        date: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: { notIn: ['CANCELED'] },
      },
    }),
    prisma.appointment.aggregate({
      where: {
        tenantId,
        date: { gte: startOfMonth, lte: endOfMonth },
        status: 'COMPLETED',
      },
      _sum: { price: true },
    }),
    prisma.appointment.aggregate({
      where: {
        tenantId,
        date: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: 'COMPLETED',
      },
      _sum: { price: true },
    }),
    prisma.client.count({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    prisma.client.count({
      where: {
        tenantId,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    }),
  ]);
  
  // Estadísticas por estado
  const appointmentsByStatus = await prisma.appointment.groupBy({
    by: ['status'],
    where: {
      tenantId,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    _count: true,
  });
  
  // Próximas citas (siguientes 5)
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      date: { gte: new Date() },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    include: {
      client: {
        select: { firstName: true, lastName: true },
      },
      service: {
        select: { name: true },
      },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    take: 5,
  });
  
  // Calcular variaciones
  const appointmentChange = lastMonthAppointments > 0 
    ? ((monthlyAppointments - lastMonthAppointments) / lastMonthAppointments) * 100 
    : 0;
    
  const revenueChange = Number(lastMonthRevenue._sum.price || 0) > 0
    ? ((Number(monthlyRevenue._sum.price || 0) - Number(lastMonthRevenue._sum.price || 0)) / Number(lastMonthRevenue._sum.price)) * 100
    : 0;
    
  const clientsChange = newClientsLastMonth > 0
    ? ((newClientsThisMonth - newClientsLastMonth) / newClientsLastMonth) * 100
    : 0;
  
  res.json({
    success: true,
    data: {
      today: {
        date: new Date().toISOString().split('T')[0],
        appointments: todayAppointments,
        totalAppointments: todayAppointments.length,
        completed: todayAppointments.filter(a => a.status === 'COMPLETED').length,
        pending: todayAppointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED').length,
      },
      month: {
        totalAppointments: monthlyAppointments,
        appointmentChange: Math.round(appointmentChange * 10) / 10,
        revenue: Number(monthlyRevenue._sum.price || 0),
        revenueChange: Math.round(revenueChange * 10) / 10,
        newClients: newClientsThisMonth,
        clientsChange: Math.round(clientsChange * 10) / 10,
        byStatus: appointmentsByStatus.reduce((acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        }, {} as Record<string, number>),
      },
      upcomingAppointments,
    },
  });
});

// Estadísticas detalladas
export const getDetailedStats = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;
  const { startDate, endDate, groupBy = 'day' } = req.query;
  
  const start = startDate 
    ? new Date(startDate as string) 
    : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate 
    ? new Date(endDate as string) 
    : new Date();
  
  // Añadir día completo al end date
  end.setHours(23, 59, 59, 999);
  
  // Citas en el rango
  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      date: { gte: start, lte: end },
      isActive: true,
    },
    select: {
      id: true,
      date: true,
      status: true,
      price: true,
      employeeId: true,
      serviceId: true,
      createdById: true,
    },
  });
  
  // Agrupar por fecha
  const byDate: Record<string, { count: number; revenue: number; completed: number; canceled: number }> = {};
  
  appointments.forEach(apt => {
    let key: string;
    
    if (groupBy === 'week') {
      const weekStart = new Date(apt.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (groupBy === 'month') {
      key = `${apt.date.getFullYear()}-${String(apt.date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      key = apt.date.toISOString().split('T')[0];
    }
    
    if (!byDate[key]) {
      byDate[key] = { count: 0, revenue: 0, completed: 0, canceled: 0 };
    }
    
    byDate[key].count++;
    if (apt.status === 'COMPLETED') {
      byDate[key].completed++;
      byDate[key].revenue += Number(apt.price);
    }
    if (apt.status === 'CANCELED') {
      byDate[key].canceled++;
    }
  });
  
  // Por empleado
  const byEmployee = await prisma.appointment.groupBy({
    by: ['employeeId'],
    where: {
      tenantId,
      date: { gte: start, lte: end },
      status: { notIn: ['CANCELED'] },
    },
    _count: true,
    _sum: { price: true },
  });
  
  const employeeDetails = await prisma.user.findMany({
    where: {
      id: { in: byEmployee.map(e => e.employeeId) },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      color: true,
    },
  });
  
  const byEmployeeWithNames = byEmployee.map(e => {
    const employee = employeeDetails.find(ed => ed.id === e.employeeId);
    return {
      employeeId: e.employeeId,
      name: employee ? `${employee.firstName} ${employee.lastName}` : 'Desconocido',
      color: employee?.color || '#3B82F6',
      count: e._count,
      revenue: Number(e._sum.price || 0),
    };
  });
  
  // Por servicio
  const byService = await prisma.appointment.groupBy({
    by: ['serviceId'],
    where: {
      tenantId,
      date: { gte: start, lte: end },
      status: { notIn: ['CANCELED'] },
    },
    _count: true,
    _sum: { price: true },
  });
  
  const serviceDetails = await prisma.service.findMany({
    where: {
      id: { in: byService.map(s => s.serviceId) },
    },
    select: {
      id: true,
      name: true,
      color: true,
    },
  });
  
  const byServiceWithNames = byService.map(s => {
    const service = serviceDetails.find(sd => sd.id === s.serviceId);
    return {
      serviceId: s.serviceId,
      name: service?.name || 'Desconocido',
      color: service?.color || '#3B82F6',
      count: s._count,
      revenue: Number(s._sum.price || 0),
    };
  });
  
  // Por día de la semana
  const byDayOfWeek: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  appointments.forEach(apt => {
    byDayOfWeek[apt.date.getDay()]++;
  });
  
  // Por hora del día
  const byHour: Record<number, number> = {};
  for (let i = 6; i <= 22; i++) byHour[i] = 0;
  
  const appointmentsWithTime = await prisma.appointment.findMany({
    where: {
      tenantId,
      date: { gte: start, lte: end },
      status: { notIn: ['CANCELED'] },
    },
    select: { startTime: true },
  });
  
  appointmentsWithTime.forEach(apt => {
    const hour = parseInt(apt.startTime.split(':')[0]);
    if (byHour[hour] !== undefined) {
      byHour[hour]++;
    }
  });
  
  // Tasas
  const total = appointments.length;
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;
  const canceled = appointments.filter(a => a.status === 'CANCELED').length;
  const noShow = appointments.filter(a => a.status === 'NO_SHOW').length;
  
  // Ingresos por servicios (precio de la cita)
  const serviceRevenue = appointments
    .filter(a => a.status === 'COMPLETED')
    .reduce((sum, a) => sum + Number(a.price), 0);
  
  // Ingresos por extras - obtener las citas completadas con sus extras
  const completedAppointmentIds = appointments
    .filter(a => a.status === 'COMPLETED')
    .map(a => a.id);
  
  const extrasRevenue = completedAppointmentIds.length > 0 
    ? await prisma.appointmentExtra.aggregate({
        where: {
          appointmentId: { in: completedAppointmentIds },
        },
        _sum: { total: true },
      }).then(result => Number(result._sum.total || 0))
    : 0;
  
  const totalRevenue = serviceRevenue + extrasRevenue;
  
  // Nuevos clientes en el periodo
  const newClients = await prisma.client.count({
    where: {
      tenantId,
      createdAt: { gte: start, lte: end },
    },
  });
  
  res.json({
    success: true,
    data: {
      // Campos esperados por el frontend
      totalAppointments: total,
      completedAppointments: completed,
      cancelledAppointments: canceled,
      noShowAppointments: noShow,
      totalRevenue,
      serviceRevenue,
      extrasRevenue,
      newClients,
      // Datos adicionales para compatibilidad
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      summary: {
        totalAppointments: total,
        completed,
        canceled,
        noShow,
        completionRate: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
        cancellationRate: total > 0 ? Math.round((canceled / total) * 1000) / 10 : 0,
        noShowRate: total > 0 ? Math.round((noShow / total) * 1000) / 10 : 0,
        totalRevenue,
      },
      byDate: Object.entries(byDate)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      byEmployee: byEmployeeWithNames.sort((a, b) => b.count - a.count),
      byService: byServiceWithNames.sort((a, b) => b.count - a.count),
      byDayOfWeek: [
        { day: 'Domingo', value: byDayOfWeek[0] },
        { day: 'Lunes', value: byDayOfWeek[1] },
        { day: 'Martes', value: byDayOfWeek[2] },
        { day: 'Miércoles', value: byDayOfWeek[3] },
        { day: 'Jueves', value: byDayOfWeek[4] },
        { day: 'Viernes', value: byDayOfWeek[5] },
        { day: 'Sábado', value: byDayOfWeek[6] },
      ],
      byHour: Object.entries(byHour)
        .map(([hour, count]) => ({ hour: `${hour}:00`, value: count })),
    },
  });
});

// Top clientes
export const getTopClients = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;
  const { limit = 10 } = req.query;
  
  const clients = await prisma.client.findMany({
    where: {
      tenantId,
      isActive: true,
    },
    orderBy: [
      { totalVisits: 'desc' },
      { totalSpent: 'desc' },
    ],
    take: Number(limit),
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      totalVisits: true,
      totalSpent: true,
      lastVisit: true,
      status: true,
    },
  });
  
  res.json({
    success: true,
    data: clients,
  });
});

// Resumen de actividad reciente
export const getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;
  const { limit = 20 } = req.query;
  
  // Últimas citas creadas/modificadas
  const recentAppointments = await prisma.appointment.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
    take: Number(limit),
    include: {
      client: {
        select: { firstName: true, lastName: true },
      },
      service: {
        select: { name: true },
      },
      createdBy: {
        select: { firstName: true, lastName: true },
      },
    },
  });
  
  // Últimos clientes creados
  const recentClients = await prisma.client.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      source: true,
    },
  });
  
  res.json({
    success: true,
    data: {
      appointments: recentAppointments.map(apt => ({
        id: apt.id,
        type: 'appointment',
        action: apt.status,
        client: `${apt.client.firstName} ${apt.client.lastName}`,
        service: apt.service.name,
        date: apt.date,
        time: apt.startTime,
        createdBy: apt.createdBy ? `${apt.createdBy.firstName} ${apt.createdBy.lastName}` : 'Sistema',
        updatedAt: apt.updatedAt,
      })),
      clients: recentClients.map(c => ({
        id: c.id,
        type: 'client',
        action: 'created',
        name: `${c.firstName} ${c.lastName}`,
        source: c.source,
        createdAt: c.createdAt,
      })),
    },
  });
});

// Appointments by status for charts
export const getAppointmentsByStatus = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;
  const { startDate, endDate } = req.query;
  
  const where: any = { tenantId };
  if (startDate) {
    where.date = { gte: new Date(startDate as string) };
  }
  if (endDate) {
    where.date = { ...where.date, lte: new Date(endDate as string) };
  }
  
  const byStatus = await prisma.appointment.groupBy({
    by: ['status'],
    where,
    _count: true,
  });
  
  res.json({
    success: true,
    data: byStatus.map(item => ({
      status: item.status,
      count: item._count,
    })),
  });
});

// Appointments by day for charts
export const getAppointmentsByDay = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;
  const { startDate, endDate } = req.query;
  
  const start = startDate ? new Date(startDate as string) : new Date();
  const end = endDate ? new Date(endDate as string) : new Date();
  
  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      date: { gte: start, lte: end },
      status: { notIn: ['CANCELED'] },
    },
    select: { date: true },
  });
  
  // Group by date
  const byDay: Record<string, number> = {};
  appointments.forEach(apt => {
    const dateStr = apt.date.toISOString().split('T')[0];
    byDay[dateStr] = (byDay[dateStr] || 0) + 1;
  });
  
  res.json({
    success: true,
    data: Object.entries(byDay).map(([date, count]) => ({ date, count })),
  });
});

// Top services
export const getTopServices = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;
  const { startDate, endDate, limit = '5' } = req.query;
  
  const where: any = { tenantId, status: 'COMPLETED' };
  if (startDate) {
    where.date = { gte: new Date(startDate as string) };
  }
  if (endDate) {
    where.date = { ...where.date, lte: new Date(endDate as string) };
  }
  
  const topServices = await prisma.appointment.groupBy({
    by: ['serviceId'],
    where,
    _count: true,
    _sum: { price: true },
    orderBy: { _count: { serviceId: 'desc' } },
    take: Number(limit),
  });
  
  const servicesWithNames = await Promise.all(
    topServices.map(async (item) => {
      const service = await prisma.service.findUnique({
        where: { id: item.serviceId },
        select: { name: true, price: true },
      });
      return {
        serviceId: item.serviceId,
        name: service?.name || 'Desconocido',
        count: item._count,
        revenue: Number(item._sum.price || 0),
      };
    })
  );
  
  res.json({
    success: true,
    data: servicesWithNames,
  });
});

// Top employees
export const getTopEmployees = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;
  const { startDate, endDate, limit = '5' } = req.query;
  
  const where: any = { tenantId, status: 'COMPLETED' };
  if (startDate) {
    where.date = { gte: new Date(startDate as string) };
  }
  if (endDate) {
    where.date = { ...where.date, lte: new Date(endDate as string) };
  }
  
  const topEmployees = await prisma.appointment.groupBy({
    by: ['employeeId'],
    where,
    _count: true,
    _sum: { price: true },
    orderBy: { _count: { employeeId: 'desc' } },
    take: Number(limit),
  });
  
  const employeesWithNames = await Promise.all(
    topEmployees.map(async (item) => {
      const employee = await prisma.user.findUnique({
        where: { id: item.employeeId },
        select: { firstName: true, lastName: true, avatar: true },
      });
      return {
        employeeId: item.employeeId,
        name: employee ? `${employee.firstName} ${employee.lastName}` : 'Desconocido',
        avatar: employee?.avatar,
        count: item._count,
        revenue: Number(item._sum.price || 0),
      };
    })
  );
  
  res.json({
    success: true,
    data: employeesWithNames,
  });
});
