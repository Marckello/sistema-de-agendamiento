import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { appointmentService } from '@/services/appointments';
import { AppointmentStatus } from '@/types';
import AppointmentModal from '@/components/appointments/AppointmentModal';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50' },
  CONFIRMED: { label: 'Confirmada', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
  COMPLETED: { label: 'Completada', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/50' },
  CANCELED: { label: 'Cancelada', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/50' },
  NO_SHOW: { label: 'No asistió', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  RESCHEDULED: { label: 'Reprogramada', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/50' },
};

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentService.getById(id!),
    enabled: !!id,
  });

  // Mutations
  const confirmMutation = useMutation({
    mutationFn: () => appointmentService.confirm(id!),
    onSuccess: () => {
      toast.success('Cita confirmada');
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al confirmar');
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => appointmentService.complete(id!),
    onSuccess: () => {
      toast.success('Cita completada');
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al completar');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => appointmentService.cancel(id!, 'Cancelado desde el panel'),
    onSuccess: () => {
      toast.success('Cita cancelada');
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      setShowCancelConfirm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al cancelar');
    },
  });

  const noShowMutation = useMutation({
    mutationFn: () => appointmentService.noShow(id!),
    onSuccess: () => {
      toast.success('Marcado como no asistió');
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al marcar');
    },
  });

  const appointment = data?.data;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        <div className="card p-6 space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Cita no encontrada</p>
        <Link to="/appointments" className="text-primary-600 hover:text-primary-500 mt-2 inline-block">
          Volver a citas
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[appointment.status];
  const canModify = !['CANCELED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/appointments"
          className="p-2 rounded-lg hover:bg-dark-800 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Detalle de Cita
          </h1>
          <p className="text-gray-500">
            ID: {appointment.id}
          </p>
        </div>
        <span className={`ml-auto px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Action Buttons */}
      {canModify && (
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <PencilIcon className="w-4 h-4" />
              Editar Cita
            </button>
            
            {appointment.status === 'PENDING' && (
              <button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Confirmar
              </button>
            )}
            
            {['PENDING', 'CONFIRMED'].includes(appointment.status) && (
              <button
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-dark-950 font-semibold py-2.5 px-4 rounded-full transition-colors flex items-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Completar
              </button>
            )}
            
            <button
              onClick={() => noShowMutation.mutate()}
              disabled={noShowMutation.isPending}
              className="bg-dark-800 hover:bg-dark-700 text-gray-300 font-medium py-2.5 px-4 rounded-full transition-colors border border-dark-700"
            >
              No asistió
            </button>
            
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium py-2.5 px-4 rounded-full transition-colors border border-red-500/30 flex items-center gap-2"
            >
              <XCircleIcon className="w-4 h-4" />
              Cancelar Cita
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">¿Cancelar cita?</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Esta acción no se puede deshacer. El cliente será notificado de la cancelación.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="btn-secondary"
              >
                No, mantener
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-full transition-colors"
              >
                {cancelMutation.isPending ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <AppointmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['appointment', id] });
        }}
        editAppointment={appointment}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Servicio
            </h2>
            <div className="flex items-start gap-4">
              <div
                className="w-4 h-16 rounded"
                style={{ backgroundColor: appointment.service?.color || '#10b981' }}
              />
              <div>
                <h3 className="text-xl font-bold text-white">
                  {appointment.service?.name}
                </h3>
                <p className="text-gray-400 mt-1">
                  {appointment.service?.description}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1 text-gray-300">
                    <ClockIcon className="w-4 h-4" />
                    {appointment.service?.duration} minutos
                  </span>
                  <span className="flex items-center gap-1 text-gray-300">
                    <CurrencyDollarIcon className="w-4 h-4" />
                    ${appointment.service?.price}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Date and time */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Fecha y Hora
            </h2>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-8 h-8 text-primary-500" />
                <div>
                  <p className="text-lg font-medium text-white">
                    {appointment.date ? format(new Date(appointment.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : '-'}
                  </p>
                  <p className="text-gray-400">Fecha</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ClockIcon className="w-8 h-8 text-primary-500" />
                <div>
                  <p className="text-lg font-medium text-white">
                    {appointment.startTime} - {appointment.endTime}
                  </p>
                  <p className="text-gray-400">Horario</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(appointment.notes || appointment.internalNotes) && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Notas
              </h2>
              {appointment.notes && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Notas para el cliente
                  </p>
                  <p className="text-gray-300">{appointment.notes}</p>
                </div>
              )}
              {appointment.internalNotes && (
                <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/20">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Notas internas
                  </p>
                  <p className="text-gray-300">{appointment.internalNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Cliente
            </h2>
            <Link
              to={`/clients/${appointment.client?.id}`}
              className="flex items-center gap-3 hover:bg-dark-800 p-2 rounded-lg transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-dark-950 font-medium text-lg">
                  {appointment.client?.firstName?.[0]}{appointment.client?.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-white">
                  {appointment.client?.firstName} {appointment.client?.lastName}
                </p>
                <p className="text-sm text-gray-400">
                  {appointment.client?.email}
                </p>
                <p className="text-sm text-gray-400">
                  {appointment.client?.phone}
                </p>
              </div>
            </Link>
          </div>

          {/* Employee */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Atendido por
            </h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-dark-800 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-white">
                  {appointment.employee?.firstName} {appointment.employee?.lastName}
                </p>
                <p className="text-sm text-gray-400">
                  {appointment.employee?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Pago
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Precio</span>
                <span className="font-medium text-white">
                  ${appointment.price || appointment.service?.price || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estado</span>
                <span className={`font-medium ${appointment.isPaid ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {appointment.isPaid ? 'Pagado' : 'Pendiente'}
                </span>
              </div>
              {appointment.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Método</span>
                  <span className="font-medium text-white">
                    {appointment.paymentMethod}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
