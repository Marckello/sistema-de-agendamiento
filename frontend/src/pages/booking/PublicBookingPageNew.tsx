import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, startOfDay, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import api from '@/services/api';

// Social Media Icons
const FacebookIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

type BookingStep = 'service' | 'datetime' | 'extras' | 'client' | 'confirm' | 'success';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  color: string;
  category?: { name: string; color: string };
  employees?: Employee[];
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  title?: string;
}

interface Extra {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  primaryColor: string;
  secondaryColor: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  linkedin?: string;
  whatsapp?: string;
}

export default function PublicBookingPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [step, setStep] = useState<BookingStep>('service');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<{ id: string; quantity: number }[]>([]);
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
    return () => {
      delete api.defaults.headers.common['X-Tenant-Subdomain'];
    };
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

  // Fetch extras
  const { data: extrasData } = useQuery({
    queryKey: ['public-extras', subdomain],
    queryFn: async () => {
      const response = await api.get('/public/extras');
      return response.data;
    },
    enabled: !!subdomain,
  });

  // Fetch available times
  const { data: timesData, isLoading: loadingTimes } = useQuery({
    queryKey: ['public-times', subdomain, selectedEmployee?.id, selectedDate, selectedService?.id],
    queryFn: async () => {
      const response = await api.get('/public/availability', {
        params: {
          employeeId: selectedEmployee?.id,
          date: format(selectedDate!, 'yyyy-MM-dd'),
          serviceId: selectedService?.id,
        },
      });
      return response.data;
    },
    enabled: !!subdomain && !!selectedEmployee && !!selectedDate && !!selectedService,
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
        extras: selectedExtras,
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
  const services: Service[] = servicesData?.data?.services || servicesData?.data || [];
  const extras: Extra[] = extrasData?.data || [];
  const timeSlots: TimeSlot[] = timesData?.data?.slots || timesData?.data || [];

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const goBack = () => {
    const steps: BookingStep[] = ['service', 'datetime', 'extras', 'client', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const isExtraSelected = (extraId: string) => selectedExtras.some(e => e.id === extraId);
  
  const toggleExtra = (extraId: string) => {
    setSelectedExtras(prev => {
      if (isExtraSelected(extraId)) {
        return prev.filter(e => e.id !== extraId);
      }
      return [...prev, { id: extraId, quantity: 1 }];
    });
  };

  const calculateTotal = () => {
    let total = selectedService?.price || 0;
    selectedExtras.forEach(selected => {
      const extra = extras.find(e => e.id === selected.id);
      if (extra) total += extra.price * selected.quantity;
    });
    return total;
  };

  if (loadingTenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (tenantError || !tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center text-white">
          <BuildingStorefrontIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Negocio no encontrado</h1>
          <p className="text-gray-400">El negocio que buscas no existe o no está disponible.</p>
        </div>
      </div>
    );
  }

  // Custom CSS variable for tenant color
  const tenantStyle = {
    '--tenant-primary': tenant.primaryColor || '#10B981',
    '--tenant-secondary': tenant.secondaryColor || '#059669',
  } as React.CSSProperties;

  const hasSocialLinks = tenant.facebook || tenant.instagram || tenant.twitter || tenant.tiktok || tenant.linkedin || tenant.whatsapp || tenant.website;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" style={tenantStyle}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          {tenant.logo ? (
            <img
              src={tenant.logo}
              alt={tenant.name}
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-white/10"
            />
          ) : (
            <div 
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: tenant.primaryColor }}
            >
              {tenant.name.charAt(0)}
            </div>
          )}
          <h1 className="text-3xl font-bold text-white mb-2">{tenant.name}</h1>
          {tenant.description && (
            <p className="text-gray-400 max-w-lg mx-auto">{tenant.description}</p>
          )}
          
          {/* Contact Info */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm text-gray-400">
            {tenant.address && (
              <div className="flex items-center gap-1">
                <MapPinIcon className="w-4 h-4" />
                <span>{tenant.address}{tenant.city ? `, ${tenant.city}` : ''}</span>
              </div>
            )}
            {tenant.phone && (
              <a href={`tel:${tenant.phone}`} className="flex items-center gap-1 hover:text-white transition-colors">
                <PhoneIcon className="w-4 h-4" />
                <span>{tenant.phone}</span>
              </a>
            )}
            {tenant.email && (
              <a href={`mailto:${tenant.email}`} className="flex items-center gap-1 hover:text-white transition-colors">
                <EnvelopeIcon className="w-4 h-4" />
                <span>{tenant.email}</span>
              </a>
            )}
          </div>

          {/* Social Links */}
          {hasSocialLinks && (
            <div className="flex items-center justify-center gap-3 mt-4">
              {tenant.website && (
                <a href={tenant.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-all">
                  <GlobeAltIcon className="w-5 h-5" />
                </a>
              )}
              {tenant.facebook && (
                <a href={tenant.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-all">
                  <FacebookIcon />
                </a>
              )}
              {tenant.instagram && (
                <a href={tenant.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-all">
                  <InstagramIcon />
                </a>
              )}
              {tenant.twitter && (
                <a href={tenant.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-all">
                  <TwitterIcon />
                </a>
              )}
              {tenant.tiktok && (
                <a href={tenant.tiktok} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-all">
                  <TikTokIcon />
                </a>
              )}
              {tenant.linkedin && (
                <a href={tenant.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-all">
                  <LinkedInIcon />
                </a>
              )}
              {tenant.whatsapp && (
                <a href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-all">
                  <WhatsAppIcon />
                </a>
              )}
            </div>
          )}
        </header>

        {/* Progress Steps */}
        {step !== 'success' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {['service', 'datetime', 'extras', 'client', 'confirm'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step === s
                      ? 'bg-white text-gray-900'
                      : ['service', 'datetime', 'extras', 'client', 'confirm'].indexOf(step) > i
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {['service', 'datetime', 'extras', 'client', 'confirm'].indexOf(step) > i ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 4 && <div className="w-8 h-0.5 bg-white/10 mx-1" />}
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        {step !== 'service' && step !== 'success' && (
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver
          </button>
        )}

        {/* Main Content */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8">
          {/* Step: Service Selection */}
          {step === 'service' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Selecciona un servicio</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      // Auto-select first employee if only one
                      if (service.employees && service.employees.length === 1) {
                        setSelectedEmployee(service.employees[0]);
                      } else {
                        setSelectedEmployee(null);
                      }
                      setStep('datetime');
                    }}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: service.color || service.category?.color || '#10B981' }}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-white">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{service.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="flex items-center gap-1 text-gray-400">
                            <ClockIcon className="w-4 h-4" />
                            {service.duration} min
                          </span>
                          <span className="font-semibold text-white">
                            ${Number(service.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: DateTime Selection */}
          {step === 'datetime' && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Calendar */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Selecciona fecha</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className="p-2 rounded-lg bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-all"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <span className="text-white font-medium min-w-[140px] text-center">
                      {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </span>
                    <button
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className="p-2 rounded-lg bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-all"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Employee Selection if multiple */}
                {selectedService?.employees && selectedService.employees.length > 1 && (
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-2">Profesional</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedService.employees.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => setSelectedEmployee(emp)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedEmployee?.id === emp.id
                              ? 'bg-white text-gray-900'
                              : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                          }`}
                        >
                          {emp.firstName} {emp.lastName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Calendar Grid */}
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((day) => (
                      <div key={day} className="text-center text-xs text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for days before month starts */}
                    {Array.from({ length: adjustedStartDay }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    {/* Days of the month */}
                    {daysInMonth.map((day) => {
                      const isToday = isSameDay(day, new Date());
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isPast = day < startOfDay(new Date());

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => !isPast && setSelectedDate(day)}
                          disabled={isPast}
                          className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-white text-gray-900'
                              : isToday
                              ? 'bg-white/20 text-white'
                              : isPast
                              ? 'text-gray-600 cursor-not-allowed'
                              : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Selecciona hora</h2>
                {!selectedDate ? (
                  <p className="text-gray-400">Primero selecciona una fecha</p>
                ) : !selectedEmployee ? (
                  <p className="text-gray-400">Primero selecciona un profesional</p>
                ) : loadingTimes ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : timeSlots.filter(s => s.available).length === 0 ? (
                  <p className="text-gray-400">No hay horarios disponibles para esta fecha</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-2">
                    {timeSlots
                      .filter((slot) => slot.available)
                      .map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => {
                            setSelectedTime(slot.time);
                            setStep('extras');
                          }}
                          className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                            selectedTime === slot.time
                              ? 'bg-white text-gray-900'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                  </div>
                )}

                {/* Selected Service Summary */}
                {selectedService && (
                  <div className="mt-6 p-4 bg-white/5 rounded-xl">
                    <h3 className="text-sm text-gray-400 mb-2">Servicio seleccionado</h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">{selectedService.name}</p>
                        <p className="text-sm text-gray-400">{selectedService.duration} min</p>
                      </div>
                      <p className="text-white font-semibold">${Number(selectedService.price).toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step: Extras */}
          {step === 'extras' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">¿Deseas agregar algo extra?</h2>
              <p className="text-gray-400 mb-6">Puedes agregar productos o servicios adicionales a tu cita</p>

              {extras.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No hay extras disponibles</p>
                  <button
                    onClick={() => setStep('client')}
                    className="mt-4 px-6 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    Continuar sin extras
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-2 mb-6">
                    {extras.map((extra) => (
                      <button
                        key={extra.id}
                        onClick={() => toggleExtra(extra.id)}
                        className={`p-4 rounded-xl border transition-all text-left ${
                          isExtraSelected(extra.id)
                            ? 'bg-white/10 border-white/30'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isExtraSelected(extra.id)
                                  ? 'bg-white border-white'
                                  : 'border-gray-500'
                              }`}
                            >
                              {isExtraSelected(extra.id) && (
                                <CheckCircleIcon className="w-4 h-4 text-gray-900" />
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">{extra.name}</p>
                              {extra.description && (
                                <p className="text-sm text-gray-400">{extra.description}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-white font-semibold">+${Number(extra.price).toFixed(2)}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl mb-6">
                    <span className="text-gray-400">Total estimado:</span>
                    <span className="text-2xl font-bold text-white">${calculateTotal().toFixed(2)}</span>
                  </div>

                  <button
                    onClick={() => setStep('client')}
                    className="w-full py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Continuar
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step: Client Data */}
          {step === 'client' && (
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-white mb-6">Tus datos de contacto</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={clientData.firstName}
                      onChange={(e) => setClientData({ ...clientData, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                      placeholder="Juan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Apellido *</label>
                    <input
                      type="text"
                      value={clientData.lastName}
                      onChange={(e) => setClientData({ ...clientData, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                      placeholder="Pérez"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email *</label>
                  <input
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                    placeholder="juan@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Teléfono *</label>
                  <input
                    type="tel"
                    value={clientData.phone}
                    onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                    placeholder="+52 55 1234 5678"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Notas (opcional)</label>
                  <textarea
                    value={clientData.notes}
                    onChange={(e) => setClientData({ ...clientData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 resize-none"
                    placeholder="Algún comentario o solicitud especial..."
                  />
                </div>
                <button
                  onClick={() => {
                    if (!clientData.firstName || !clientData.lastName || !clientData.email || !clientData.phone) {
                      toast.error('Por favor completa todos los campos requeridos');
                      return;
                    }
                    setStep('confirm');
                  }}
                  className="w-full py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                  Revisar y Confirmar
                </button>
              </div>
            </div>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && (
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-white mb-6">Confirma tu cita</h2>
              
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-white/5 rounded-xl">
                  <h3 className="text-sm text-gray-400 mb-2">Servicio</h3>
                  <p className="text-white font-medium">{selectedService?.name}</p>
                  <p className="text-sm text-gray-400">{selectedService?.duration} min</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl">
                  <h3 className="text-sm text-gray-400 mb-2">Fecha y hora</h3>
                  <p className="text-white font-medium">
                    {selectedDate && format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  <p className="text-sm text-gray-400">{selectedTime} hrs</p>
                </div>

                {selectedEmployee && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="text-sm text-gray-400 mb-2">Profesional</h3>
                    <p className="text-white font-medium">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </p>
                  </div>
                )}

                {selectedExtras.length > 0 && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="text-sm text-gray-400 mb-2">Extras</h3>
                    {selectedExtras.map((selected) => {
                      const extra = extras.find(e => e.id === selected.id);
                      return extra ? (
                        <div key={extra.id} className="flex justify-between text-white">
                          <span>{extra.name}</span>
                          <span>+${Number(extra.price).toFixed(2)}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                <div className="p-4 bg-white/5 rounded-xl">
                  <h3 className="text-sm text-gray-400 mb-2">Tus datos</h3>
                  <p className="text-white font-medium">{clientData.firstName} {clientData.lastName}</p>
                  <p className="text-sm text-gray-400">{clientData.email}</p>
                  <p className="text-sm text-gray-400">{clientData.phone}</p>
                </div>

                <div className="p-4 bg-white/10 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total a pagar:</span>
                    <span className="text-2xl font-bold text-white">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="w-full py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Confirmando...' : 'Confirmar Cita'}
              </button>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <CheckCircleIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">¡Cita Confirmada!</h2>
              <p className="text-gray-400 mb-6">
                Hemos enviado los detalles de tu cita a {clientData.email}
              </p>
              
              <div className="max-w-sm mx-auto p-4 bg-white/5 rounded-xl text-left mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Servicio:</span>
                    <span className="text-white">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fecha:</span>
                    <span className="text-white">
                      {selectedDate && format(selectedDate, "d 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hora:</span>
                    <span className="text-white">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-white font-bold">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep('service');
                  setSelectedService(null);
                  setSelectedEmployee(null);
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setSelectedExtras([]);
                  setClientData({ firstName: '', lastName: '', email: '', phone: '', notes: '' });
                }}
                className="px-8 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Agendar otra cita
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-sm text-gray-500">
          Powered by <span className="text-gray-400">CitasPro</span>
        </footer>
      </div>
    </div>
  );
}
