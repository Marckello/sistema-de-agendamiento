import { useState, useEffect } from 'react';
import { adminService, ActivityLog } from '@/services/admin';
import {
  Activity,
  Building2,
  UserPlus,
  RefreshCw,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await adminService.getActivityLogs({
        page,
        limit: 20,
        action: actionFilter !== 'all' ? actionFilter : undefined,
      });
      setLogs(response.logs);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err) {
      console.error('Error loading activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'TENANT_CREATED':
        return <Building2 className="w-5 h-5 text-green-400" />;
      case 'USER_REGISTERED':
        return <UserPlus className="w-5 h-5 text-blue-400" />;
      case 'SUBSCRIPTION_CHANGED':
        return <RefreshCw className="w-5 h-5 text-yellow-400" />;
      case 'TENANT_SUSPENDED':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'TENANT_ACTIVATED':
        return <Building2 className="w-5 h-5 text-green-400" />;
      case 'PLAN_CREATED':
        return <Activity className="w-5 h-5 text-purple-400" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'TENANT_CREATED':
        return 'bg-green-500/20 border-green-500/30';
      case 'USER_REGISTERED':
        return 'bg-blue-500/20 border-blue-500/30';
      case 'SUBSCRIPTION_CHANGED':
        return 'bg-yellow-500/20 border-yellow-500/30';
      case 'TENANT_SUSPENDED':
        return 'bg-red-500/20 border-red-500/30';
      default:
        return 'bg-gray-800 border-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Registro de Actividad</h1>
        <p className="text-gray-400 mt-1">Historial de acciones en la plataforma</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Todas las acciones</option>
            <option value="TENANT_CREATED">Empresa creada</option>
            <option value="TENANT_SUSPENDED">Empresa suspendida</option>
            <option value="TENANT_ACTIVATED">Empresa activada</option>
            <option value="USER_REGISTERED">Usuario registrado</option>
            <option value="SUBSCRIPTION_CHANGED">Cambio de suscripción</option>
            <option value="PLAN_CREATED">Plan creado</option>
          </select>
          
          <button
            onClick={loadLogs}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:bg-gray-750 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No hay actividad</h3>
            <p className="text-gray-400">No se encontraron registros de actividad</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${getActivityColor(log.action)}`}>
                    {getActivityIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white">{log.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(log.createdAt)}</span>
                      </div>
                      {log.tenant && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Building2 className="w-3 h-3" />
                          <span>{log.tenant.name}</span>
                        </div>
                      )}
                      {log.user && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <UserPlus className="w-3 h-3" />
                          <span>{log.user.firstName} {log.user.lastName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    log.action.includes('CREATED') || log.action.includes('ACTIVATED')
                      ? 'bg-green-500/20 text-green-400'
                      : log.action.includes('SUSPENDED')
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <p className="text-gray-400 text-sm">
              Mostrando {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-white px-3">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
