import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService, PlatformStats, ActivityLog } from '@/services/admin';
import {
  Building2,
  Users,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Activity,
  Clock,
  AlertCircle,
  UserPlus,
  RefreshCw,
  CreditCard,
  Settings,
} from 'lucide-react';

interface TopTenant {
  id: string;
  name: string;
  slug: string;
  plan?: { name: string };
  _count?: { appointments: number; users: number; clients: number };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [topTenants, setTopTenants] = useState<TopTenant[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, tenantsRes, activityRes] = await Promise.all([
        adminService.getPlatformStats(),
        adminService.listTenants({ limit: 5, sortBy: 'appointments' }),
        adminService.getActivityLogs({ limit: 10 }),
      ]);

      setStats(statsData);
      setTopTenants(tenantsRes.tenants);
      setRecentActivity(activityRes.logs);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
      setError('Error al cargar los datos del panel');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'TENANT_CREATED':
        return <Building2 className="w-4 h-4 text-green-400" />;
      case 'USER_REGISTERED':
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'SUBSCRIPTION_CHANGED':
        return <RefreshCw className="w-4 h-4 text-yellow-400" />;
      case 'TENANT_SUSPENDED':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Error</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
        <p className="text-gray-400 mt-1">Vista general de la plataforma CitasPro</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tenants */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Empresas Activas</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.activeTenants || 0}</p>
              <p className="text-gray-500 text-xs mt-1">de {stats?.totalTenants || 0} totales</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          {stats?.growth?.tenants !== undefined && (
            <div className="mt-4 flex items-center gap-2">
              {stats.growth.tenants >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={stats.growth.tenants >= 0 ? 'text-green-400' : 'text-red-400'}>
                {stats.growth.tenants >= 0 ? '+' : ''}{stats.growth.tenants}%
              </span>
              <span className="text-gray-500 text-sm">vs mes anterior</span>
            </div>
          )}
        </div>

        {/* Total Users */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Usuarios Totales</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalUsers || 0}</p>
              <p className="text-gray-500 text-xs mt-1">en todas las empresas</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          {stats?.growth?.users !== undefined && (
            <div className="mt-4 flex items-center gap-2">
              {stats.growth.users >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={stats.growth.users >= 0 ? 'text-green-400' : 'text-red-400'}>
                {stats.growth.users >= 0 ? '+' : ''}{stats.growth.users}%
              </span>
              <span className="text-gray-500 text-sm">vs mes anterior</span>
            </div>
          )}
        </div>

        {/* Appointments This Month */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Citas Este Mes</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.appointmentsThisMonth || 0}</p>
              <p className="text-gray-500 text-xs mt-1">{stats?.totalClients || 0} clientes registrados</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CalendarCheck className="w-6 h-6 text-green-400" />
            </div>
          </div>
          {stats?.growth?.appointments !== undefined && (
            <div className="mt-4 flex items-center gap-2">
              {stats.growth.appointments >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={stats.growth.appointments >= 0 ? 'text-green-400' : 'text-red-400'}>
                {stats.growth.appointments >= 0 ? '+' : ''}{stats.growth.appointments}%
              </span>
              <span className="text-gray-500 text-sm">vs mes anterior</span>
            </div>
          )}
        </div>

        {/* Revenue */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Ingresos (MRR)</p>
              <p className="text-3xl font-bold text-white mt-1">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
              <p className="text-gray-500 text-xs mt-1">recurrente mensual</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tenants */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Top Empresas</h2>
              <p className="text-gray-400 text-sm">Por número de citas</p>
            </div>
            <Link
              to="/admin/tenants"
              className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {topTenants.length > 0 ? (
              topTenants.map((tenant, index) => (
                <div key={tenant.id} className="p-4 flex items-center gap-4 hover:bg-gray-800/50 transition-colors">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{tenant.name}</p>
                    <p className="text-gray-500 text-sm">{tenant.plan?.name || 'Sin plan'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{(tenant._count && tenant._count.appointments) || 0}</p>
                    <p className="text-gray-500 text-xs">citas</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay empresas registradas</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Actividad Reciente</h2>
              <p className="text-gray-400 text-sm">Últimas acciones en la plataforma</p>
            </div>
            <Link
              to="/admin/activity"
              className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
            >
              Ver todo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 flex items-start gap-3 hover:bg-gray-800/50 transition-colors">
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-500 text-xs">{formatDate(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay actividad reciente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/admin/tenants?action=new"
            className="flex flex-col items-center gap-3 p-4 bg-gray-800 rounded-xl hover:bg-gray-750 transition-colors group"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
              <Building2 className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-white text-sm font-medium">Nueva Empresa</span>
          </Link>

          <Link
            to="/admin/plans"
            className="flex flex-col items-center gap-3 p-4 bg-gray-800 rounded-xl hover:bg-gray-750 transition-colors group"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
              <CreditCard className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-white text-sm font-medium">Gestionar Planes</span>
          </Link>

          <Link
            to="/admin/activity"
            className="flex flex-col items-center gap-3 p-4 bg-gray-800 rounded-xl hover:bg-gray-750 transition-colors group"
          >
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-white text-sm font-medium">Ver Actividad</span>
          </Link>

          <Link
            to="/admin/settings"
            className="flex flex-col items-center gap-3 p-4 bg-gray-800 rounded-xl hover:bg-gray-750 transition-colors group"
          >
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
              <Settings className="w-6 h-6 text-yellow-400" />
            </div>
            <span className="text-white text-sm font-medium">Configuración</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
