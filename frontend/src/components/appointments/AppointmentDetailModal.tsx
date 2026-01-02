import { Fragment } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { Appointment, AppointmentStatus } from '@/types';
import { appointmentService } from '@/services/appointments';

interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onUpdate?: () => void;
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50' },
  CONFIRMED: { label: 'Confirmada', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
  COMPLETED: { label: 'Completada', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/50' },
  CANCELLED: { label: 'Cancelada', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/50' },
  NO_SHOW: { label: 'No asistió', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  RESCHEDULED: { label: 'Reprogramada', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/50' },
};

export default function AppointmentDetailModal({
  isOpen,
  onClose,
  appointment,
  onUpdate,
}: AppointmentDetailModalProps) {
  // Mutations
  const confirmMutation = useMutation({
    mutationFn: () => appointmentService.confirm(appointment.id),
    onSuccess: () => {
      toast.success('Cita confirmada');
      onUpdate?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al confirmar');
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => appointmentService.complete(appointment.id),
    onSuccess: () => {
      toast.success('Cita completada');
      onUpdate?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al completar');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => appointmentService.cancel(appointment.id, 'Cancelado desde el panel'),
    onSuccess: () => {
      toast.success('Cita cancelada');
      onUpdate?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al cancelar');
    },
  });

  const noShowMutation = useMutation({
    mutationFn: () => appointmentService.noShow(appointment.id),
    onSuccess: () => {
      toast.success('Marcado como no asistió');
      onUpdate?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al marcar');
    },
  });

  const statusConfig = STATUS_CONFIG[appointment.status];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Menu as="div" className="relative">
                      <Menu.Button className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 dark:divide-gray-700">
                          <div className="py-1">
                            {appointment.status === 'PENDING' && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => confirmMutation.mutate()}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                      active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                    } text-gray-700 dark:text-gray-300`}
                                  >
                                    Confirmar cita
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                            {['PENDING', 'CONFIRMED'].includes(appointment.status) && (
                              <>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => completeMutation.mutate()}
                                      className={`w-full text-left px-4 py-2 text-sm ${
                                        active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                      } text-green-600 dark:text-green-400`}
                                    >
                                      Marcar como completada
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => noShowMutation.mutate()}
                                      className={`w-full text-left px-4 py-2 text-sm ${
                                        active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                      } text-gray-600 dark:text-gray-400`}
                                    >
                                      Marcar como no asistió
                                    </button>
                                  )}
                                </Menu.Item>
                              </>
                            )}
                          </div>
                          <div className="py-1">
                            {!['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status) && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => cancelMutation.mutate()}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                      active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                    } text-red-600 dark:text-red-400`}
                                  >
                                    Cancelar cita
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                  {/* Service */}
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {appointment.service?.name}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      {appointment.service?.duration} minutos
                    </p>
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center justify-center gap-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {format(new Date(appointment.startTime), "EEEE d 'de' MMMM", { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {format(new Date(appointment.startTime), 'HH:mm')} - {format(new Date(appointment.endTime), 'HH:mm')}
                      </span>
                    </div>
                  </div>

                  {/* Client info */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Cliente
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-medium text-lg">
                          {appointment.client?.firstName?.[0]}{appointment.client?.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {appointment.client?.firstName} {appointment.client?.lastName}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          {appointment.client?.email && (
                            <a
                              href={`mailto:${appointment.client.email}`}
                              className="flex items-center gap-1 hover:text-primary-600"
                            >
                              <EnvelopeIcon className="w-4 h-4" />
                              {appointment.client.email}
                            </a>
                          )}
                          {appointment.client?.phone && (
                            <a
                              href={`tel:${appointment.client.phone}`}
                              className="flex items-center gap-1 hover:text-primary-600"
                            >
                              <PhoneIcon className="w-4 h-4" />
                              {appointment.client.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Employee */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Atendido por
                    </h4>
                    <div className="flex items-center gap-3">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {appointment.employee?.firstName} {appointment.employee?.lastName}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-500 dark:text-gray-400">Precio</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        ${appointment.price || appointment.service?.price || 0}
                      </p>
                      {appointment.isPaid ? (
                        <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircleIcon className="w-4 h-4" />
                          Pagado
                        </span>
                      ) : (
                        <span className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                          <XCircleIcon className="w-4 h-4" />
                          Pendiente de pago
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {appointment.notes && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Notas
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {appointment.notes}
                      </p>
                    </div>
                  )}

                  {/* Internal Notes */}
                  {appointment.internalNotes && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Notas internas
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                        {appointment.internalNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <button onClick={onClose} className="btn-secondary">
                    Cerrar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
