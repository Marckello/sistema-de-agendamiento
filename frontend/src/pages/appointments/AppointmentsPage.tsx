import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { appointmentService } from '@/services/appointments';
import { Appointment, AppointmentStatus, AppointmentFilters } from '@/types';
import AppointmentModal from '@/components/appointments/AppointmentModal';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50' },
  CONFIRMED: { label: 'Confirmada', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
  COMPLETED: { label: 'Completada', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/50' },
  CANCELLED: { label: 'Cancelada', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/50' },
  NO_SHOW: { label: 'No asistió', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  RESCHEDULED: { label: 'Reprogramada', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/50' },
};

export default function AppointmentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<AppointmentFilters>({
    page: 1,
    limit: 20,
  });
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => appointmentService.getAll(filters),
  });

  const appointments = data?.data || [];
  const pagination = data?.pagination;

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
                <th className="text-right">Acciones</th>
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
                          {format(new Date(appointment.startTime), "d MMM yyyy", { locale: es })}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(appointment.startTime), 'HH:mm')} - {format(new Date(appointment.endTime), 'HH:mm')}
                        </p>
                      </td>
                      <td>
                        <p className="text-gray-900 dark:text-white">
                          {appointment.employee?.firstName} {appointment.employee?.lastName}
                        </p>
                      </td>
                      <td>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            ${appointment.price || appointment.service?.price || 0}
                          </span>
                          {appointment.isPaid ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircleIcon className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/appointments/${appointment.id}`}
                          className="inline-flex items-center text-primary-600 hover:text-primary-500"
                        >
                          <EyeIcon className="w-5 h-5 mr-1" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
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
                disabled={pagination.page >= pagination.totalPages}
                className="btn-secondary btn-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
