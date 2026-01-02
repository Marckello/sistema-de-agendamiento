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
  CANCELED: { label: 'Cancelada', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/50' },
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-dark-900 border border-dark-800 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Menu as="div" className="relative">
                      <Menu.Button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-800">
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
                        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-dark-800 border border-dark-700 shadow-lg focus:outline-none divide-y divide-dark-700">
                          <div className="py-1">
                            {appointment.status === 'PENDING' && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => confirmMutation.mutate()}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                      active ? 'bg-dark-700' : ''
                                    } text-gray-300`}
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
                                        active ? 'bg-dark-700' : ''
                                      } text-emerald-400`}
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
                                        active ? 'bg-dark-700' : ''
                                      } text-gray-400`}
                                    >
                                      Marcar como no asistió
                                    </button>
                                  )}
                                </Menu.Item>
                              </>
                            )}
                          </div>
                          <div className="py-1">
                            {!['CANCELED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status) && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => cancelMutation.mutate()}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                      active ? 'bg-dark-700' : ''
                                    } text-red-400`}
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
                      className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-800"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                  {/* Service */}
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-white">
                      {appointment.service?.name}
                    </h3>
                    <p className="text-gray-400 mt-1">
                      {appointment.service?.duration} minutos
                    </p>
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center justify-center gap-6 py-4 bg-dark-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-primary-400" />
                      <span className="font-medium text-white">
                        {appointment.date ? format(new Date(appointment.date), "EEEE d 'de' MMMM", { locale: es }) : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-primary-400" />
                      <span className="font-medium text-white">
                        {appointment.startTime} - {appointment.endTime}
                      </span>
                    </div>
                  </div>

                  {/* Client info */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-500 uppercase">
                      Cliente
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                        <span className="text-dark-950 font-medium text-lg">
                          {appointment.client?.firstName?.[0]}{appointment.client?.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {appointment.client?.firstName} {appointment.client?.lastName}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          {appointment.client?.email && (
                            <a
                              href={`mailto:${appointment.client.email}`}
                              className="flex items-center gap-1 hover:text-primary-400"
                            >
                              <EnvelopeIcon className="w-4 h-4" />
                              {appointment.client.email}
                            </a>
                          )}
                          {appointment.client?.phone && (
                            <a
                              href={`tel:${appointment.client.phone}`}
                              className="flex items-center gap-1 hover:text-primary-400"
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
                    <h4 className="text-sm font-medium text-gray-500 uppercase">
                      Atendido por
                    </h4>
                    <div className="flex items-center gap-3">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-white">
                        {appointment.employee?.firstName} {appointment.employee?.lastName}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between py-4 border-t border-dark-800">
                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-400">Precio</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">
                        ${appointment.price || appointment.service?.price || 0}
                      </p>
                      {appointment.isPaid ? (
                        <span className="text-sm text-emerald-400 flex items-center gap-1 justify-end">
                          <CheckCircleIcon className="w-4 h-4" />
                          Pagado
                        </span>
                      ) : (
                        <span className="text-sm text-yellow-400 flex items-center gap-1 justify-end">
                          <XCircleIcon className="w-4 h-4" />
                          Pendiente de pago
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {appointment.notes && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500 uppercase">
                        Notas
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {appointment.notes}
                      </p>
                    </div>
                  )}

                  {/* Internal Notes */}
                  {appointment.internalNotes && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500 uppercase">
                        Notas internas
                      </h4>
                      <p className="text-gray-300 text-sm bg-yellow-900/20 p-3 rounded-lg border border-yellow-500/20">
                        {appointment.internalNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex flex-col gap-3 px-6 py-4 border-t border-dark-800 bg-dark-950">
                  {/* Action buttons based on status */}
                  {!['CANCELED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status) && (
                    <div className="flex gap-2">
                      {appointment.status === 'PENDING' && (
                        <button 
                          onClick={() => confirmMutation.mutate()}
                          disabled={confirmMutation.isPending}
                          className="flex-1 btn-primary"
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Confirmar
                        </button>
                      )}
                      {['PENDING', 'CONFIRMED'].includes(appointment.status) && (
                        <button 
                          onClick={() => completeMutation.mutate()}
                          disabled={completeMutation.isPending}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-dark-950 font-semibold py-2.5 px-4 rounded-full transition-colors"
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1 inline" />
                          Completar
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {!['CANCELED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status) && (
                      <>
                        <button 
                          onClick={() => noShowMutation.mutate()}
                          disabled={noShowMutation.isPending}
                          className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-300 font-medium py-2.5 px-4 rounded-full transition-colors border border-dark-700"
                        >
                          No asistió
                        </button>
                        <button 
                          onClick={() => cancelMutation.mutate()}
                          disabled={cancelMutation.isPending}
                          className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium py-2.5 px-4 rounded-full transition-colors border border-red-500/30"
                        >
                          <XCircleIcon className="w-4 h-4 mr-1 inline" />
                          Cancelar
                        </button>
                      </>
                    )}
                    <button onClick={onClose} className="btn-secondary">
                      Cerrar
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
