import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { appointmentService } from '@/services/appointments';
import { AppointmentStatus } from '@/types';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50' },
  CONFIRMED: { label: 'Confirmada', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
  COMPLETED: { label: 'Completada', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/50' },
  CANCELLED: { label: 'Cancelada', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/50' },
  NO_SHOW: { label: 'No asistió', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  RESCHEDULED: { label: 'Reprogramada', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/50' },
};

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentService.getById(id!),
    enabled: !!id,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/appointments"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Detalle de Cita
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            ID: {appointment.id}
          </p>
        </div>
        <span className={`ml-auto px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Servicio
            </h2>
            <div className="flex items-start gap-4">
              <div
                className="w-4 h-16 rounded"
                style={{ backgroundColor: appointment.service?.color || '#3B82F6' }}
              />
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {appointment.service?.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {appointment.service?.description}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <ClockIcon className="w-4 h-4" />
                    {appointment.service?.duration} minutos
                  </span>
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <CurrencyDollarIcon className="w-4 h-4" />
                    ${appointment.service?.price}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Date and time */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Fecha y Hora
            </h2>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-8 h-8 text-primary-600" />
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {format(new Date(appointment.startTime), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">Fecha</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ClockIcon className="w-8 h-8 text-primary-600" />
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {format(new Date(appointment.startTime), 'HH:mm')} - {format(new Date(appointment.endTime), 'HH:mm')}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">Horario</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(appointment.notes || appointment.internalNotes) && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Notas
              </h2>
              {appointment.notes && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Notas para el cliente
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{appointment.notes}</p>
                </div>
              )}
              {appointment.internalNotes && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Notas internas
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{appointment.internalNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cliente
            </h2>
            <Link
              to={`/clients/${appointment.client?.id}`}
              className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-medium text-lg">
                  {appointment.client?.firstName?.[0]}{appointment.client?.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {appointment.client?.firstName} {appointment.client?.lastName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {appointment.client?.email}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {appointment.client?.phone}
                </p>
              </div>
            </Link>
          </div>

          {/* Employee */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Atendido por
            </h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {appointment.employee?.firstName} {appointment.employee?.lastName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {appointment.employee?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pago
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Precio</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${appointment.price || appointment.service?.price || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Estado</span>
                <span className={`font-medium ${appointment.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                  {appointment.isPaid ? 'Pagado' : 'Pendiente'}
                </span>
              </div>
              {appointment.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Método</span>
                  <span className="font-medium text-gray-900 dark:text-white">
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
