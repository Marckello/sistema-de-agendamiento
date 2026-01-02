import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, addDays, startOfDay, setHours, setMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import api from '@/services/api';

type BookingStep = 'service' | 'employee' | 'datetime' | 'client' | 'confirm' | 'success';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: { name: string; color: string };
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TenantInfo {
  name: string;
  logo?: string;
  primaryColor: string;
  address: string;
  phone: string;
}

export default function PublicBookingPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [step, setStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientData, setClientData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  });

  // Set tenant header for public API calls
  useEffect(() => {
    if (subdomain) {
      api.defaults.headers.common['X-Tenant-Subdomain'] = subdomain;
    }
  }, [subdomain]);

  // Fetch tenant info
  const { data: tenantData, isLoading: loadingTenant, error: tenantError } = useQuery({
    queryKey: ['public-tenant', subdomain],
    queryFn: async () => {
      const response = await api.get(`/public/tenant/${subdomain}`);
      return response.data;
    },
    enabled: !!subdomain,
  });

  // Fetch services
  const { data: servicesData } = useQuery({
    queryKey: ['public-services', subdomain],
    queryFn: async () => {
      const response = await api.get('/public/services');
      return response.data;
    },
    enabled: !!subdomain,
  });

  // Fetch employees
  const { data: employeesData } = useQuery({
    queryKey: ['public-employees', subdomain, selectedService?.id],
    queryFn: async () => {
      const response = await api.get('/public/employees', {
        params: { serviceId: selectedService?.id },
      });
      return response.data;
    },
    enabled: !!subdomain && !!selectedService,
  });

  // Fetch available times
  const { data: timesData, isLoading: loadingTimes } = useQuery({
    queryKey: ['public-times', subdomain, selectedEmployee?.id, selectedDate],
    queryFn: async () => {
      const response = await api.get('/public/availability', {
        params: {
          employeeId: selectedEmployee?.id,
          date: format(selectedDate!, 'yyyy-MM-dd'),
          duration: selectedService?.duration,
        },
      });
      return response.data;
    },
    enabled: !!subdomain && !!selectedEmployee && !!selectedDate,
  });

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/public/appointments', {
        serviceId: selectedService?.id,
        employeeId: selectedEmployee?.id,
        date: format(selectedDate!, 'yyyy-MM-dd'),
        time: selectedTime,
        client: clientData,
      });
      return response.data;
    },
    onSuccess: () => {
      setStep('success');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear la cita');
    },
  });

  const tenant: TenantInfo = tenantData?.data;
  const services: Service[] = servicesData?.data || [];
  const employees: Employee[] = employeesData?.data || [];
  const timeSlots: TimeSlot[] = timesData?.data || [];

  // Generate next 14 days for date selection
  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i));

  if (loadingTenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (tenantError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BuildingStorefrontIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Negocio no encontrado</h1>
          <p className="text-gray-600">El negocio que buscas no existe o no está disponible.</p>
        </div>
      </div>
    );
  }

  const goBack = () => {
    const steps: BookingStep[] = ['service', 'employee', 'datetime', 'client', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'service':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Selecciona un servicio</h2>
            <div className="grid gap-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep('employee');
                  }}
                  className="w-full p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-primary-500 transition-colors text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: service.category?.color || '#3B82F6' }}
                        />
                        <span className="text-xs text-gray-500">{service.category?.name}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mt-1">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary-600">${service.price}</p>
                      <p className="text-sm text-gray-500">{service.duration} min</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'employee':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Selecciona un profesional</h2>
            <div className="grid gap-3">
              {employees.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setStep('datetime');
                  }}
                  className="w-full p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-primary-500 transition-colors text-left flex items-center gap-4"
                >
                  {employee.avatar ? (
                    <img
                      src={employee.avatar}
                      alt={employee.firstName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-bold">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </h3>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'datetime':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Selecciona fecha y hora</h2>
            
            {/* Date Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Fecha</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {availableDates.map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                    className={`flex-shrink-0 p-3 rounded-xl text-center min-w-[80px] border-2 transition-colors ${
                      selectedDate?.toDateString() === date.toDateString()
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-white hover:border-primary-300'
                    }`}
                  >
                    <p className="text-xs text-gray-500 uppercase">
                      {format(date, 'EEE', { locale: es })}
                    </p>
                    <p className="text-lg font-bold text-gray-900">{format(date, 'd')}</p>
                    <p className="text-xs text-gray-500">{format(date, 'MMM', { locale: es })}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Hora</label>
                {loadingTimes ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : timeSlots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`p-3 rounded-lg text-center border-2 transition-colors ${
                          selectedTime === slot.time
                            ? 'border-primary-500 bg-primary-50 text-primary-600'
                            : slot.available
                            ? 'border-gray-200 bg-white hover:border-primary-300'
                            : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No hay horarios disponibles para esta fecha
                  </p>
                )}
              </div>
            )}

            {/* Continue Button */}
            {selectedDate && selectedTime && (
              <button
                onClick={() => setStep('client')}
                className="w-full btn-primary py-3"
              >
                Continuar
              </button>
            )}
          </div>
        );

      case 'client':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Tus datos</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre *</label>
                  <input
                    type="text"
                    value={clientData.firstName}
                    onChange={(e) => setClientData({ ...clientData, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Apellido *</label>
                  <input
                    type="text"
                    value={clientData.lastName}
                    onChange={(e) => setClientData({ ...clientData, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Tu apellido"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email *</label>
                <input
                  type="email"
                  value={clientData.email}
                  onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Teléfono</label>
                <input
                  type="tel"
                  value={clientData.phone}
                  onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Notas adicionales</label>
                <textarea
                  value={clientData.notes}
                  onChange={(e) => setClientData({ ...clientData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Información adicional..."
                />
              </div>
            </div>
            <button
              onClick={() => setStep('confirm')}
              disabled={!clientData.firstName || !clientData.lastName || !clientData.email}
              className="w-full btn-primary py-3 disabled:opacity-50"
            >
              Revisar Reserva
            </button>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Confirma tu reserva</h2>
            
            <div className="bg-white rounded-xl border p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Servicio</p>
                  <p className="font-semibold text-gray-900">{selectedService?.name}</p>
                  <p className="text-sm text-gray-600">${selectedService?.price} · {selectedService?.duration} min</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <UserIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profesional</p>
                  <p className="font-semibold text-gray-900">
                    {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha y Hora</p>
                  <p className="font-semibold text-gray-900">
                    {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="text-gray-600">{selectedTime}</p>
                </div>
              </div>

              <hr />

              <div>
                <p className="text-sm text-gray-500 mb-1">Datos del cliente</p>
                <p className="font-semibold text-gray-900">
                  {clientData.firstName} {clientData.lastName}
                </p>
                <p className="text-sm text-gray-600">{clientData.email}</p>
                {clientData.phone && <p className="text-sm text-gray-600">{clientData.phone}</p>}
              </div>
            </div>

            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="w-full btn-primary py-3"
            >
              {createMutation.isPending ? 'Creando reserva...' : 'Confirmar Reserva'}
            </button>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircleIcon className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">¡Reserva confirmada!</h2>
              <p className="text-gray-600 mt-2">
                Hemos enviado un email de confirmación a {clientData.email}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-left">
              <p className="text-sm text-gray-500">Resumen de tu cita</p>
              <p className="font-semibold text-gray-900 mt-1">{selectedService?.name}</p>
              <p className="text-gray-600">
                {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })} a las {selectedTime}
              </p>
              <p className="text-gray-600">
                con {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </p>
            </div>
            <button
              onClick={() => {
                setStep('service');
                setSelectedService(null);
                setSelectedEmployee(null);
                setSelectedDate(null);
                setSelectedTime(null);
                setClientData({ firstName: '', lastName: '', email: '', phone: '', notes: '' });
              }}
              className="btn-secondary"
            >
              Hacer otra reserva
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {tenant?.logo ? (
              <img src={tenant.logo} alt={tenant.name} className="h-10 w-auto" />
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: tenant?.primaryColor || '#3B82F6' }}
              >
                {tenant?.name?.[0]}
              </div>
            )}
            <div>
              <h1 className="font-bold text-gray-900">{tenant?.name}</h1>
              {tenant?.address && (
                <p className="text-xs text-gray-500">{tenant.address}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Progress */}
      {step !== 'success' && (
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            {['service', 'employee', 'datetime', 'client', 'confirm'].map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  ['service', 'employee', 'datetime', 'client', 'confirm'].indexOf(step) >= i
                    ? 'bg-primary-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 pb-8">
        {step !== 'service' && step !== 'success' && (
          <button
            onClick={goBack}
            className="mb-4 text-sm text-gray-600 hover:text-gray-900"
          >
            ← Volver
          </button>
        )}
        {renderStep()}
      </main>
    </div>
  );
}
