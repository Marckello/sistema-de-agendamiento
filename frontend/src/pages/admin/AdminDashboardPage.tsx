import { useState, useEffect } from 'react';
import { 
  BuildingOffice2Icon, 
  UserGroupIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import adminService, { DashboardData } from '../../services/admin';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function StatCard({ title, value, change, changeType, icon: Icon, color }: StatCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              changeType === 'increase' ? 'text-green-600' :
              changeType === 'decrease' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {changeType === 'increase' ? (
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
              ) : changeType === 'decrease' ? (
                <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
              ) : null}
              {change}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getStats();
      setData(response);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button onClick={loadData} className="btn btn-primary mt-4">
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { stats, recentActivity, topTenants } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Vista general de la plataforma CitasPro
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Empresas Activas"
          value={stats.activeTenants}
          change={`+${stats.tenantsGrowth.thisMonth} este mes`}
          changeType={stats.tenantsGrowth.thisMonth > 0 ? 'increase' : 'neutral'}
          icon={BuildingOffice2Icon}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Usuarios"
          value={stats.totalUsers}
          icon={UserGroupIcon}
          color="bg-purple-500"
        />
        <StatCard
          title="Citas Este Mes"
          value={stats.appointmentsThisMonth.toLocaleString()}
          icon={CalendarIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Ingresos del Mes"
          value={`$${Number(stats.revenueThisMonth).toLocaleString()}`}
          icon={CurrencyDollarIcon}
          color="bg-yellow-500"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Resumen de Empresas</h3>
            <ChartBarIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Activas</span>
              <span className="font-semibold text-green-600">{stats.activeTenants}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Inactivas</span>
              <span className="font-semibold text-red-600">{stats.inactiveTenants}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold">{stats.totalTenants}</span>
            </div>
            <div className="pt-4 border-t dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Crecimiento</span>
                <span className={`font-semibold ${
                  parseFloat(stats.tenantsGrowth.percentage) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {parseFloat(stats.tenantsGrowth.percentage) >= 0 ? '+' : ''}{stats.tenantsGrowth.percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Estadísticas Globales</h3>
            <ChartBarIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Clientes</span>
              <span className="font-semibold">{stats.totalClients.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Citas</span>
              <span className="font-semibold">{stats.totalAppointments.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Promedio por Empresa</span>
              <span className="font-semibold">
                {stats.totalTenants > 0 
                  ? Math.round(stats.totalClients / stats.totalTenants)
                  : 0} clientes
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Top Empresas</h3>
            <ArrowTrendingUpIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {topTenants.length > 0 ? topTenants.slice(0, 5).map((tenant, index) => (
              <div key={tenant.id} className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-400 w-5">{index + 1}</span>
                {tenant.logo ? (
                  <img src={tenant.logo} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary-600">
                      {tenant.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tenant.name}</p>
                </div>
                <span className="text-sm text-gray-500">{tenant.appointmentsCount} citas</span>
              </div>
            )) : (
              <p className="text-sm text-gray-500">Sin datos</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Actividad Reciente</h3>
            <ClockIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        <div className="divide-y dark:divide-gray-700">
          {recentActivity.length > 0 ? recentActivity.map((activity) => (
            <div key={activity.id} className="p-4 flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${
                activity.status === 'COMPLETED' ? 'bg-green-500' :
                activity.status === 'CANCELED' ? 'bg-red-500' :
                activity.status === 'CONFIRMED' ? 'bg-blue-500' :
                'bg-yellow-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.tenantName}</span>
                  {' - '}
                  <span>{activity.serviceName}</span>
                  {' para '}
                  <span className="font-medium">{activity.clientName}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                activity.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
                activity.status === 'CANCELED' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' :
                activity.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' :
                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
              }`}>
                {activity.status}
              </span>
            </div>
          )) : (
            <div className="p-8 text-center text-gray-500">
              No hay actividad reciente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
