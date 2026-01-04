import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDaysIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { dashboardService } from '@/services/dashboard';
import { appointmentService } from '@/services/appointments';
import { settingsService } from '@/services/settings';

const COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#a855f7', '#ec4899', '#3b82f6'];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada',
  CANCELED: 'Cancelada',
  NO_SHOW: 'No asistió',
  RESCHEDULED: 'Reprogramada',
};

export default function DashboardPage() {
  const [dateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', dateRange],
    queryFn: () => dashboardService.getStats(dateRange),
  });

  // Fetch appointments by day
  const { data: appointmentsByDayData } = useQuery({
    queryKey: ['appointments-by-day', dateRange],
    queryFn: () => dashboardService.getAppointmentsByDay(dateRange),
  });

  // Fetch appointments by status
  const { data: appointmentsByStatusData } = useQuery({
    queryKey: ['appointments-by-status', dateRange],
    queryFn: () => dashboardService.getAppointmentsByStatus(dateRange),
  });

  // Fetch top services
  const { data: topServicesData } = useQuery({
    queryKey: ['top-services', dateRange],
    queryFn: () => dashboardService.getTopServices(dateRange, 5),
  });

  // Fetch upcoming appointments
  const { data: upcomingData } = useQuery({
    queryKey: ['upcoming-appointments'],
    queryFn: () => appointmentService.getUpcoming(5),
  });

  // Fetch tenant settings for currency
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
  });

  const stats = statsData?.data;
  const appointmentsByDay = appointmentsByDayData?.data || [];
  const appointmentsByStatus = appointmentsByStatusData?.data || [];
  const topServices = topServicesData?.data || [];
  // upcomingData.data is { appointments: [], pagination: {} }
  const upcomingAppointments = upcomingData?.data?.appointments || [];
  const tenantCurrency = settingsData?.data?.currency || 'USD';

  // Format chart data
  const chartData = appointmentsByDay.map((item: any) => ({
    date: format(new Date(item.date), 'dd MMM', { locale: es }),
    citas: item.count,
    ingresos: item.revenue,
  }));

  const statusChartData = appointmentsByStatus.map((item: any) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item._count || item.count,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: tenantCurrency,
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <SparklesIcon className="w-8 h-8 text-primary-500" />
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="mt-1 text-gray-500">
            Resumen de {format(new Date(dateRange.startDate), 'MMMM yyyy', { locale: es })}
          </p>
        </div>
        <Link to="/appointments" className="btn-primary">
          <CalendarDaysIcon className="w-5 h-5 mr-2" />
          Nueva Cita
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Citas"
          value={stats?.totalAppointments || 0}
          icon={CalendarDaysIcon}
          color="blue"
          loading={statsLoading}
        />
        <StatCard
          title="Citas Completadas"
          value={stats?.completedAppointments || 0}
          icon={ClockIcon}
          color="green"
          change={stats?.totalAppointments ? 
            Math.round((stats.completedAppointments / stats.totalAppointments) * 100) : 0}
          changeLabel="del total"
          loading={statsLoading}
        />
        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={CurrencyDollarIcon}
          color="yellow"
          loading={statsLoading}
        />
        <StatCard
          title="Nuevos Clientes"
          value={stats?.newClients || 0}
          icon={UsersIcon}
          color="purple"
          loading={statsLoading}
        />
      </div>

      {/* Revenue breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Ingresos por Servicios</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(stats?.serviceRevenue || 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <CalendarDaysIcon className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {stats?.totalRevenue ? Math.round((stats.serviceRevenue / stats.totalRevenue) * 100) : 0}% del total
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Ingresos por Extras</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(stats?.extrasRevenue || 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <SparklesIcon className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {stats?.totalRevenue ? Math.round((stats.extrasRevenue / stats.totalRevenue) * 100) : 0}% del total
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Ticket Promedio</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(stats?.completedAppointments ? (stats.totalRevenue / stats.completedAppointments) : 0)}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <ArrowTrendingUpIcon className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Por cita completada
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Appointments over time */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold gradient-text">
              Citas por Día
            </h3>
          </div>
          <div className="card-body">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="citas"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorCitas)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Appointments by status */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold gradient-text">
              Citas por Estado
            </h3>
          </div>
          <div className="card-body">
            <div className="h-72 flex items-center justify-center">
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusChartData.map((_: { name: string; value: number }, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        color: '#fff',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No hay datos disponibles</p>
              )}
            </div>
            {/* Legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {statusChartData.map((entry: { name: string; value: number }, index: number) => (
                <div key={entry.name} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-400">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top services */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold gradient-text">
              Servicios Más Solicitados
            </h3>
            <Link
              to="/services"
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              Ver todos
            </Link>
          </div>
          <div className="card-body">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServices} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#64748b" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    stroke="#64748b"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                    }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Upcoming appointments */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold gradient-text">
              Próximas Citas
            </h3>
            <Link
              to="/appointments"
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              Ver todas
            </Link>
          </div>
          <div className="p-0">
            {upcomingAppointments.length > 0 ? (
              <ul className="divide-y divide-dark-800/50">
                {upcomingAppointments.map((appointment: any) => (
                  <li key={appointment.id}>
                    <Link
                      to={`/appointments/${appointment.id}`}
                      className="flex items-center px-6 py-4 hover:bg-dark-800/50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-dark-950 text-sm font-semibold">
                          {appointment.client?.firstName?.[0]}{appointment.client?.lastName?.[0]}
                        </span>
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {appointment.client?.firstName} {appointment.client?.lastName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {appointment.service?.name}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="text-sm font-semibold text-white">
                          {appointment.startTime}
                        </p>
                        <p className="text-xs text-gray-500">
                          {appointment.date ? format(new Date(appointment.date), 'dd MMM', { locale: es }) : ''}
                        </p>
                      </div>
                      <ChevronRightIcon className="ml-3 w-5 h-5 text-gray-600 group-hover:text-primary-400 transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-4">
                  <CalendarDaysIcon className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-sm text-gray-500">
                  No hay citas próximas
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat card component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  change?: number;
  changeLabel?: string;
  loading?: boolean;
}

function StatCard({ title, value, icon: Icon, color, change, changeLabel, loading }: StatCardProps) {
  const iconBgClasses = {
    blue: 'bg-primary-500',
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    purple: 'bg-fuchsia-500',
    red: 'bg-red-500',
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="h-4 w-24 skeleton" />
            <div className="h-8 w-20 skeleton" />
          </div>
          <div className="w-12 h-12 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 hover:border-dark-700 transition-all group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {value}
          </p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {change >= 0 ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {Math.abs(change)}%
              </span>
              <span className="text-xs text-gray-600">{changeLabel}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBgClasses[color]} shadow-lg`}>
          <Icon className="w-6 h-6 text-dark-950" />
        </div>
      </div>
    </div>
  );
}
