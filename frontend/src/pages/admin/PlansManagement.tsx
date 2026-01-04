import { useState, useEffect } from 'react';
import { adminService, Plan } from '@/services/admin';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  Users,
  Calendar,
  MessageSquare,
  Brain,
  Star,
  DollarSign,
} from 'lucide-react';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

export default function PlansManagement() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    maxUsers: 5,
    maxClients: 100,
    maxAppointmentsPerMonth: 500,
    hasWhatsApp: false,
    hasAI: false,
    hasReports: false,
    hasCustomBranding: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPlans();
      setPlans(data);
    } catch (err) {
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const openNewPlanModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      price: 0,
      maxUsers: 5,
      maxClients: 100,
      maxAppointmentsPerMonth: 500,
      hasWhatsApp: false,
      hasAI: false,
      hasReports: false,
      hasCustomBranding: false,
    });
    setShowModal(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || plan.displayName || '',
      price: plan.price,
      maxUsers: plan.maxUsers || plan.maxEmployees || 5,
      maxClients: plan.maxClients,
      maxAppointmentsPerMonth: plan.maxAppointmentsPerMonth || plan.maxAppointments || 500,
      hasWhatsApp: plan.hasWhatsApp || plan.hasSmsReminders || false,
      hasAI: plan.hasAI || false,
      hasReports: plan.hasReports || false,
      hasCustomBranding: plan.hasCustomBranding || false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingPlan) {
        await adminService.updatePlan(editingPlan.id, formData);
      } else {
        await adminService.createPlan(formData);
      }
      loadPlans();
      setShowModal(false);
    } catch (err) {
      console.error('Error saving plan:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('¿Estás seguro de eliminar este plan? Las empresas asociadas perderán su plan.')) {
      return;
    }
    try {
      await adminService.deletePlan(planId);
      loadPlans();
    } catch (err) {
      console.error('Error deleting plan:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Planes</h1>
          <p className="text-gray-400 mt-1">Configura los planes de suscripción de la plataforma</p>
        </div>
        <button
          onClick={openNewPlanModal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-purple-500/50 transition-colors"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-purple-500/10 to-transparent">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold text-white">{formatCurrency(plan.price)}</span>
                <span className="text-gray-400">/mes</span>
              </div>
            </div>

            {/* Features */}
            <div className="p-6 space-y-4">
              {/* Limits */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-300">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>Hasta {plan.maxUsers || plan.maxEmployees || 0} usuarios</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>Hasta {(plan.maxClients || 0).toLocaleString()} clientes</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{(plan.maxAppointmentsPerMonth || plan.maxAppointments || 0).toLocaleString()} citas/mes</span>
                </div>
              </div>

              <hr className="border-gray-800" />

              {/* Features */}
              <div className="space-y-3">
                <div className={`flex items-center gap-3 ${plan.hasWhatsApp || plan.hasSmsReminders ? 'text-green-400' : 'text-gray-500'}`}>
                  {plan.hasWhatsApp || plan.hasSmsReminders ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  <span>Integración WhatsApp</span>
                </div>
                <div className={`flex items-center gap-3 ${plan.hasAI ? 'text-green-400' : 'text-gray-500'}`}>
                  {plan.hasAI ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  <span>Asistente IA</span>
                </div>
                <div className={`flex items-center gap-3 ${plan.hasReports ? 'text-green-400' : 'text-gray-500'}`}>
                  {plan.hasReports ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  <span>Reportes avanzados</span>
                </div>
                <div className={`flex items-center gap-3 ${plan.hasCustomBranding ? 'text-green-400' : 'text-gray-500'}`}>
                  {plan.hasCustomBranding ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  <span>Marca personalizada</span>
                </div>
              </div>

              {/* Subscribers count */}
              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Empresas suscritas</span>
                  <span className="text-white font-medium">{plan._count?.tenants || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {plans.length === 0 && (
          <div className="col-span-full bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No hay planes creados</h3>
            <p className="text-gray-400 mb-4">Crea tu primer plan de suscripción</p>
            <button
              onClick={openNewPlanModal}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Crear Plan
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div key={editingPlan?.id || 'new'} className="bg-gray-900 rounded-xl border border-gray-800 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Nombre del Plan</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Plan Pro"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Precio Mensual (MXN)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Max Usuarios</label>
                  <input
                    type="number"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 0 })}
                    min="1"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Max Clientes</label>
                  <input
                    type="number"
                    value={formData.maxClients}
                    onChange={(e) => setFormData({ ...formData, maxClients: parseInt(e.target.value) || 0 })}
                    min="1"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Citas/Mes</label>
                  <input
                    type="number"
                    value={formData.maxAppointmentsPerMonth}
                    onChange={(e) => setFormData({ ...formData, maxAppointmentsPerMonth: parseInt(e.target.value) || 0 })}
                    min="1"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-gray-400 text-sm mb-3">Características</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <span className="text-white">Integración WhatsApp</span>
                    </div>
                    <ToggleSwitch
                      checked={formData.hasWhatsApp}
                      onChange={(val) => setFormData({ ...formData, hasWhatsApp: val })}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Brain className="w-4 h-4 text-gray-400" />
                      <span className="text-white">Asistente IA</span>
                    </div>
                    <ToggleSwitch
                      checked={formData.hasAI}
                      onChange={(val) => setFormData({ ...formData, hasAI: val })}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Star className="w-4 h-4 text-gray-400" />
                      <span className="text-white">Reportes avanzados</span>
                    </div>
                    <ToggleSwitch
                      checked={formData.hasReports}
                      onChange={(val) => setFormData({ ...formData, hasReports: val })}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-white">Marca personalizada</span>
                    </div>
                    <ToggleSwitch
                      checked={formData.hasCustomBranding}
                      onChange={(val) => setFormData({ ...formData, hasCustomBranding: val })}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
