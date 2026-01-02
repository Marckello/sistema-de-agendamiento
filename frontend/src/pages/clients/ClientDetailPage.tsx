import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { clientService } from '@/services/clients';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientService.getById(id!),
    enabled: !!id,
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ['client-appointments', id],
    queryFn: () => clientService.getAppointments(id!),
    enabled: !!id,
  });

  const client = data?.data;
  // appointmentsData.data is { appointments: [], pagination: {} }
  const appointments = appointmentsData?.data?.appointments || [];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        <div className="card p-6 space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Cliente no encontrado</p>
        <Link to="/clients" className="text-primary-600 hover:text-primary-500 mt-2 inline-block">
          Volver a clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/clients"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <span className="text-primary-600 dark:text-primary-400 font-bold text-2xl">
              {client.firstName?.[0]}{client.lastName?.[0]}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Cliente desde {format(new Date(client.createdAt), "MMMM yyyy", { locale: es })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <CalendarIcon className="w-8 h-8 mx-auto text-primary-600" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {client._count?.appointments || appointments.length || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Citas</p>
            </div>
            <div className="card p-4 text-center">
              <CurrencyDollarIcon className="w-8 h-8 mx-auto text-green-600" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                ${client.totalSpent || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total gastado</p>
            </div>
            <div className="card p-4 text-center">
              <ClockIcon className="w-8 h-8 mx-auto text-yellow-600" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {client.lastVisit 
                  ? format(new Date(client.lastVisit), "d MMM", { locale: es })
                  : '-'
                }
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Última visita</p>
            </div>
          </div>

          {/* Appointments history */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Historial de Citas
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {appointments.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No hay citas registradas
                </div>
              ) : (
                appointments.slice(0, 10).map((appointment: any) => (
                  <Link
                    key={appointment.id}
                    to={`/appointments/${appointment.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-3 h-12 rounded"
                        style={{ backgroundColor: appointment.service?.color || '#3B82F6' }}
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {appointment.service?.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {appointment.date ? format(new Date(appointment.date), "d 'de' MMMM yyyy", { locale: es }) : ''} a las {appointment.startTime}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${appointment.price || appointment.service?.price || 0}
                      </p>
                      <span className={`text-sm ${
                        appointment.status === 'COMPLETED' ? 'text-green-600' :
                        appointment.status === 'CANCELED' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {appointment.status === 'COMPLETED' ? 'Completada' :
                         appointment.status === 'CANCELED' ? 'Cancelada' :
                         appointment.status === 'PENDING' ? 'Pendiente' :
                         appointment.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Información de Contacto
            </h2>
            <div className="space-y-4">
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-primary-600"
                >
                  <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                  {client.email}
                </a>
              )}
              {client.phone && (
                <a
                  href={`tel:${client.phone}`}
                  className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-primary-600"
                >
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                  {client.phone}
                </a>
              )}
              {(client.address || client.city) && (
                <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    {client.address && <p>{client.address}</p>}
                    {client.city && <p>{client.city}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Información Adicional
            </h2>
            <div className="space-y-3 text-sm">
              {client.birthDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Cumpleaños</span>
                  <span className="text-gray-900 dark:text-white">
                    {format(new Date(client.birthDate), "d 'de' MMMM", { locale: es })}
                  </span>
                </div>
              )}
              {client.gender && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Género</span>
                  <span className="text-gray-900 dark:text-white">
                    {client.gender === 'MALE' ? 'Masculino' :
                     client.gender === 'FEMALE' ? 'Femenino' :
                     client.gender === 'OTHER' ? 'Otro' : 'No especificado'}
                  </span>
                </div>
              )}
              {client.source && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Fuente</span>
                  <span className="text-gray-900 dark:text-white">{client.source}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {client.tags && client.tags.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Etiquetas
              </h2>
              <div className="flex flex-wrap gap-2">
                {client.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {client.notes && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Notas
              </h2>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {client.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
