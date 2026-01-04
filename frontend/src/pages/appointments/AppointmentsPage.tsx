import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';
import { appointmentService } from '@/services/appointments';
import { Appointment, AppointmentStatus, AppointmentFilters } from '@/types';
import AppointmentModal from '@/components/appointments/AppointmentModal';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50' },
  CONFIRMED: { label: 'Confirmada', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
  COMPLETED: { label: 'Completada', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/50' },
  CANCELED: { label: 'Cancelada', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/50' },
  NO_SHOW: { label: 'No asistió', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  RESCHEDULED: { label: 'Reprogramada', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/50' },
};

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [filters, setFilters] = useState<AppointmentFilters>({
    page: 1,
    limit: 20,
  });
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => appointmentService.getAll(filters),
  });

  const appointments = data?.data?.appointments || [];
  const pagination = data?.data?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appointmentService.delete(id),
    onSuccess: () => {
      toast.success('Cita eliminada');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => 
      appointmentService.update(id, { status }),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    },
  });

  const handleDelete = (appointment: Appointment) => {
    if (confirm(`¿Estás seguro de eliminar la cita de ${appointment.client?.firstName} ${appointment.client?.lastName}?`)) {
      deleteMutation.mutate(appointment.id);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAppointment(null);
  };

  const handleStatusFilter = (status: AppointmentStatus | undefined) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Citas</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestiona todas las citas de tu negocio
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Nueva Cita
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, servicio..."
              className="input pl-10"
            />
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusFilter(undefined)}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                !filters.status
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-500'
              }`}
            >
              Todas
            </button>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status as AppointmentStatus)}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  filters.status === status
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-500'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>

          {/* Date filters */}
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              className="input"
            />
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Fecha y Hora</th>
                <th>Empleado</th>
                <th>Estado</th>
                <th>Precio</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7}>
                      <div className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                      No hay citas que mostrar
                    </p>
                  </td>
                </tr>
              ) : (
                appointments.map((appointment: Appointment) => {
                  const statusConfig = STATUS_CONFIG[appointment.status];
                  return (
                    <tr key={appointment.id}>
                      <td>
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                              {appointment.client?.firstName?.[0]}{appointment.client?.lastName?.[0]}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {appointment.client?.firstName} {appointment.client?.lastName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {appointment.client?.email || appointment.client?.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {appointment.service?.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {appointment.service?.duration} min
                        </p>
                      </td>
                      <td>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {appointment.date ? format(new Date(appointment.date), "d MMM yyyy", { locale: es }) : '-'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {appointment.startTime} - {appointment.endTime}
                        </p>
                      </td>
                      <td>
                        <p className="text-gray-900 dark:text-white">
                          {appointment.employee?.firstName} {appointment.employee?.lastName}
                        </p>
                      </td>
                      <td>
                        <select
                          value={appointment.status}
                          onChange={(e) => updateStatusMutation.mutate({ 
                            id: appointment.id, 
                            status: e.target.value as AppointmentStatus 
                          })}
                          disabled={updateStatusMutation.isPending}
                          className={`pl-2 pr-6 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer transition-colors appearance-none
                            ${statusConfig.bgColor} ${statusConfig.color}
                            focus:ring-2 focus:ring-primary-500 focus:outline-none
                            disabled:opacity-50 disabled:cursor-wait
                            bg-[length:16px_16px] bg-[right_4px_center] bg-no-repeat
                            bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')]`}
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key} className="bg-dark-900 text-gray-300">
                              {config.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${(() => {
                            const basePrice = appointment.price || appointment.service?.price || 0;
                            const extrasTotal = appointment.extras?.reduce((sum: number, extra: any) => {
                              const extraPrice = extra.priceAtTime || extra.extra?.price || 0;
                              return sum + (extraPrice * (extra.quantity || 1));
                            }, 0) || 0;
                            return (Number(basePrice) + Number(extrasTotal)).toFixed(0);
                          })()}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Link
                            to={`/appointments/${appointment.id}`}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            title="Ver detalles"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleEdit(appointment)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Editar"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(appointment)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Eliminar"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
                disabled={pagination.page <= 1}
                className="btn-secondary btn-sm"
              >
                Anterior
              </button>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="btn-secondary btn-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={() => {
          handleCloseModal();
          refetch();
        }}
        editAppointment={editingAppointment}
      />
    </div>
  );
}
