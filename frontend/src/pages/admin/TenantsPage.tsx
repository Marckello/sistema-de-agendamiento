import { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import adminService, { TenantListItem, TenantDetail, Plan } from '../../services/admin';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

const SUBSCRIPTION_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
  trialing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  past_due: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400',
  canceled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Modal states
  const [selectedTenant, setSelectedTenant] = useState<TenantDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<{
    isActive: boolean;
    planId: string;
    subscriptionStatus: string;
  } | null>(null);

  const loadTenants = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await adminService.listTenants({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter as 'active' | 'inactive' | '',
        planId: planFilter,
      });
      setTenants(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, planFilter]);

  const loadPlans = async () => {
    try {
      const data = await adminService.listPlans();
      setPlans(data);
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const handleViewTenant = async (id: string) => {
    try {
      const detail = await adminService.getTenant(id);
      setSelectedTenant(detail);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error loading tenant detail:', error);
    }
  };

  const handleEditTenant = async (tenant: TenantListItem) => {
    try {
      const detail = await adminService.getTenant(tenant.id);
      setSelectedTenant(detail);
      setEditData({
        isActive: detail.isActive,
        planId: detail.plan.id,
        subscriptionStatus: detail.subscriptionStatus,
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error loading tenant:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedTenant || !editData) return;

    try {
      await adminService.updateTenant(selectedTenant.id, editData);
      setShowEditModal(false);
      loadTenants();
    } catch (error) {
      console.error('Error updating tenant:', error);
    }
  };

  const handleToggleActive = async (tenant: TenantListItem) => {
    try {
      await adminService.updateTenant(tenant.id, { isActive: !tenant.isActive });
      loadTenants();
    } catch (error) {
      console.error('Error toggling tenant:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Empresas</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Administra las empresas registradas en la plataforma
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o slug..."
                className="input pl-10 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              className="input"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="">Todos los planes</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.displayName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estadísticas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creada
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron empresas
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {tenant.logo ? (
                          <img src={tenant.logo} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            <BuildingOffice2Icon className="w-5 h-5 text-primary-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-sm text-gray-500">{tenant.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400">
                        {tenant.plan.displayName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 text-sm ${
                          tenant.isActive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tenant.isActive ? (
                            <CheckCircleIcon className="w-4 h-4" />
                          ) : (
                            <XCircleIcon className="w-4 h-4" />
                          )}
                          {tenant.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${
                          SUBSCRIPTION_COLORS[tenant.subscriptionStatus] || 'bg-gray-100 text-gray-700'
                        }`}>
                          {tenant.subscriptionStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span title="Usuarios" className="flex items-center gap-1">
                          <UserGroupIcon className="w-4 h-4" />
                          {tenant.counts.users}
                        </span>
                        <span title="Clientes" className="flex items-center gap-1">
                          <UserGroupIcon className="w-4 h-4" />
                          {tenant.counts.clients}
                        </span>
                        <span title="Citas" className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {tenant.counts.appointments}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewTenant(tenant.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <EyeIcon className="w-5 h-5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleEditTenant(tenant)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(tenant)}
                          className={`p-2 rounded-lg transition-colors ${
                            tenant.isActive 
                              ? 'hover:bg-red-100 dark:hover:bg-red-900/50' 
                              : 'hover:bg-green-100 dark:hover:bg-green-900/50'
                          }`}
                          title={tenant.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {tenant.isActive ? (
                            <XCircleIcon className="w-5 h-5 text-red-500" />
                          ) : (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn btn-secondary"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn btn-secondary"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedTenant.logo ? (
                    <img src={selectedTenant.logo} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <BuildingOffice2Icon className="w-6 h-6 text-primary-600" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{selectedTenant.name}</h2>
                    <p className="text-sm text-gray-500">{selectedTenant.slug}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <CalendarIcon className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{selectedTenant.stats.appointmentsThisMonth}</p>
                  <p className="text-xs text-gray-500">Citas este mes</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">${Number(selectedTenant.stats.totalRevenue).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Ingresos totales</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">{selectedTenant.stats.newClientsThisMonth}</p>
                  <p className="text-xs text-gray-500">Nuevos clientes</p>
                </div>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{selectedTenant.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Teléfono</label>
                  <p className="font-medium">{selectedTenant.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Plan</label>
                  <p className="font-medium">{selectedTenant.plan.displayName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Estado</label>
                  <p className={`font-medium ${selectedTenant.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedTenant.isActive ? 'Activa' : 'Inactiva'}
                  </p>
                </div>
              </div>

              {/* Users */}
              <div>
                <h3 className="font-semibold mb-3">Usuarios ({selectedTenant.users.length})</h3>
                <div className="space-y-2">
                  {selectedTenant.users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {user.lastLoginAt ? `Último acceso: ${new Date(user.lastLoginAt).toLocaleDateString()}` : 'Sin acceso'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTenant && editData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold">Editar Empresa</h2>
              <p className="text-sm text-gray-500">{selectedTenant.name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Estado</label>
                <select
                  className="input w-full"
                  value={editData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditData({ ...editData, isActive: e.target.value === 'active' })}
                >
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Plan</label>
                <select
                  className="input w-full"
                  value={editData.planId}
                  onChange={(e) => setEditData({ ...editData, planId: e.target.value })}
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.displayName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Estado Suscripción</label>
                <select
                  className="input w-full"
                  value={editData.subscriptionStatus}
                  onChange={(e) => setEditData({ ...editData, subscriptionStatus: e.target.value })}
                >
                  <option value="active">Activa</option>
                  <option value="trialing">En prueba</option>
                  <option value="past_due">Pago pendiente</option>
                  <option value="canceled">Cancelada</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn btn-primary"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
