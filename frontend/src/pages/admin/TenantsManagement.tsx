import { useState, useEffect } from 'react';
import { adminService, Tenant, Plan } from '@/services/admin';
import {
  Building2,
  Search,
  Edit,
  Eye,
  Power,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export default function TenantsManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Modals
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    loadTenants();
  }, [page, statusFilter, planFilter, search]);

  const loadPlans = async () => {
    try {
      const data = await adminService.getPlans();
      setPlans(data);
    } catch (err) {
      console.error('Error loading plans:', err);
    }
  };

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await adminService.listTenants({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        planId: planFilter !== 'all' ? planFilter : undefined,
      });
      setTenants(response.tenants);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err) {
      console.error('Error loading tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadTenants();
  };

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      setActionLoading(true);
      await adminService.updateTenant(tenant.id, { isActive: !tenant.isActive });
      loadTenants();
      setShowEditModal(false);
    } catch (err) {
      console.error('Error toggling tenant:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePlan = async (tenantId: string, planId: string) => {
    try {
      setActionLoading(true);
      await adminService.updateTenant(tenantId, { planId });
      loadTenants();
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating plan:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const viewTenantDetail = async (tenant: Tenant) => {
    try {
      const detail = await adminService.getTenantDetail(tenant.id);
      setSelectedTenant(detail);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error loading tenant detail:', err);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Empresas</h1>
          <p className="text-gray-400 mt-1">{total} empresas registradas</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Empresa
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por nombre, slug o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </form>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Todos los planes</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>

          {/* Refresh */}
          <button
            onClick={loadTenants}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:bg-gray-750 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Empresa</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Plan</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Estado</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Usuarios</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Citas</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Creada</th>
                <th className="text-right py-4 px-6 text-gray-400 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    </div>
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No se encontraron empresas</p>
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{tenant.name}</p>
                          <p className="text-gray-500 text-sm">{tenant.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                        {tenant.plan?.name || 'Sin plan'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {tenant.isActive ? (
                        <span className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          Activa
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          Inactiva
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="w-4 h-4 text-gray-500" />
                        {tenant._count?.users || 0}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {tenant._count?.appointments || 0}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm">
                      {formatDate(tenant.createdAt)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewTenantDetail(tenant)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(tenant)}
                          className={`p-2 rounded-lg transition-colors ${
                            tenant.isActive
                              ? 'text-yellow-400 hover:bg-yellow-500/10'
                              : 'text-green-400 hover:bg-green-500/10'
                          }`}
                          title={tenant.isActive ? 'Desactivar' : 'Activar'}
                        >
                          <Power className="w-4 h-4" />
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <p className="text-gray-400 text-sm">
              Mostrando {(page - 1) * 10 + 1} - {Math.min(page * 10, total)} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, page - 3),
                Math.min(totalPages, page + 2)
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg transition-colors ${
                    p === page
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {p}
                </button>
              ))}
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

      {/* Detail Modal */}
      {showDetailModal && selectedTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Detalles de la Empresa</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedTenant.name}</h3>
                  <p className="text-gray-400">{selectedTenant.slug}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{selectedTenant._count?.users || 0}</p>
                  <p className="text-gray-400 text-sm">Usuarios</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{selectedTenant._count?.clients || 0}</p>
                  <p className="text-gray-400 text-sm">Clientes</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{selectedTenant._count?.appointments || 0}</p>
                  <p className="text-gray-400 text-sm">Citas</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Plan</span>
                  <span className="text-white">{selectedTenant.plan?.name || 'Sin plan'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Estado</span>
                  <span className={selectedTenant.isActive ? 'text-green-400' : 'text-red-400'}>
                    {selectedTenant.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Suscripción</span>
                  <span className="text-white capitalize">{selectedTenant.subscriptionStatus || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Creada</span>
                  <span className="text-white">{formatDate(selectedTenant.createdAt)}</span>
                </div>
              </div>

              {/* Users */}
              {selectedTenant.users && selectedTenant.users.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-3">Usuarios</h4>
                  <div className="space-y-2">
                    {selectedTenant.users.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                            <span className="text-purple-400 text-sm font-medium">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-white text-sm">{user.firstName} {user.lastName}</p>
                            <p className="text-gray-500 text-xs">{user.email}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-md w-full">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Editar Empresa</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Nombre</label>
                <p className="text-white font-medium">{selectedTenant.name}</p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Plan</label>
                <select
                  defaultValue={selectedTenant.planId || ''}
                  onChange={(e) => handleUpdatePlan(selectedTenant.id, e.target.value)}
                  disabled={actionLoading}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Sin plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name} - ${plan.price}/mes</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Estado</label>
                <button
                  onClick={() => handleToggleActive(selectedTenant)}
                  disabled={actionLoading}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    selectedTenant.isActive
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {actionLoading ? 'Procesando...' : selectedTenant.isActive ? 'Desactivar Empresa' : 'Activar Empresa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
