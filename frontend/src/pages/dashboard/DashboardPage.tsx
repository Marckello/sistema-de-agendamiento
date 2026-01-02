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
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { dashboardService } from '@/services/dashboard';
import { appointmentService } from '@/services/appointments';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
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

  const stats = statsData?.data;
  const appointmentsByDay = appointmentsByDayData?.data || [];
  const appointmentsByStatus = appointmentsByStatusData?.data || [];
  const topServices = topServicesData?.data || [];
  const upcomingAppointments = upcomingData?.data || [];

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
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Resumen de {format(new Date(dateRange.startDate), 'MMMM yyyy', { locale: es })}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/appointments" className="btn-primary">
            <CalendarDaysIcon className="w-5 h-5 mr-2" />
            Nueva Cita
          </Link>
        </div>
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
          title="Ingresos"
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

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Appointments over time */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Citas por Día
            </h3>
          </div>
          <div className="card-body">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="date" 
                    className="text-gray-600 dark:text-gray-400"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-gray-600 dark:text-gray-400"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="citas"
                    stroke="#3B82F6"
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
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
                      {statusChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
              )}
            </div>
            {/* Legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {statusChartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Servicios Más Solicitados
            </h3>
            <Link
              to="/services"
              className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              Ver todos
            </Link>
          </div>
          <div className="card-body">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServices} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Upcoming appointments */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Próximas Citas
            </h3>
            <Link
              to="/appointments"
              className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              Ver todas
            </Link>
          </div>
          <div className="card-body p-0">
            {upcomingAppointments.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {upcomingAppointments.map((appointment: any) => (
                  <li key={appointment.id}>
                    <Link
                      to={`/appointments/${appointment.id}`}
                      className="flex items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {appointment.client?.firstName} {appointment.client?.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {appointment.service?.name}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {format(new Date(appointment.startTime), 'HH:mm')}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(appointment.startTime), 'dd MMM', { locale: es })}
                        </p>
                      </div>
                      <ChevronRightIcon className="ml-4 w-5 h-5 text-gray-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-12 text-center">
                <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
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
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
  };

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="ml-4 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        {change !== undefined && (
          <div className="ml-4 flex items-center">
            {change >= 0 ? (
              <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(change)}% {changeLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
