import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  BuildingStorefrontIcon,
  PaintBrushIcon,
  CalendarIcon,
  BellIcon,
  ClockIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  GlobeAltIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { settingsService } from '@/services/settings';
import { TenantSettings } from '@/types';
import WhatsAppSettings from '@/components/settings/WhatsAppSettings';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

type SettingsTab = 'general' | 'branding' | 'social' | 'booking' | 'notifications' | 'schedule' | 'whatsapp' | 'ai';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
  });

  const settings = settingsData?.data;

  const tabs = [
    { id: 'general' as const, label: 'General', icon: BuildingStorefrontIcon },
    { id: 'branding' as const, label: 'Marca', icon: PaintBrushIcon },
    { id: 'social' as const, label: 'Redes Sociales', icon: GlobeAltIcon },
    { id: 'booking' as const, label: 'Reservas', icon: CalendarIcon },
    { id: 'notifications' as const, label: 'Notificaciones', icon: BellIcon },
    { id: 'schedule' as const, label: 'Horarios', icon: ClockIcon },
    { id: 'whatsapp' as const, label: 'WhatsApp', icon: ChatBubbleOvalLeftEllipsisIcon },
    { id: 'ai' as const, label: 'Asistente IA', icon: SparklesIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Administra la configuración de tu negocio
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <nav className="lg:w-64 flex-shrink-0">
          <div className="card p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="card p-6 animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ) : (
            <>
              {activeTab === 'general' && <GeneralSettings settings={settings} />}
              {activeTab === 'branding' && <BrandingSettings settings={settings} />}
              {activeTab === 'social' && <SocialSettings settings={settings} />}
              {activeTab === 'booking' && <BookingSettings settings={settings} />}
              {activeTab === 'notifications' && <NotificationSettings settings={settings} />}
              {activeTab === 'schedule' && <ScheduleSettings />}
              {activeTab === 'whatsapp' && <WhatsAppSettings />}
              {activeTab === 'ai' && <AISettings settings={settings} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// General Settings
function GeneralSettings({ settings }: { settings?: any }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      timezone: 'America/New_York',
      currency: 'USD',
    },
  });

  // Cargar datos cuando settings cambie
  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name || '',
        email: settings.email || '',
        phone: settings.phone || '',
        address: settings.address || '',
        city: settings.city || '',
        country: settings.country || '',
        timezone: settings.timezone || 'America/New_York',
        currency: settings.currency || 'USD',
      });
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (data: TenantSettings['general']) => settingsService.updateGeneral(data),
    onSuccess: () => {
      toast.success('Configuración guardada');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar');
    },
  });

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Información General
        </h2>
      </div>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data as TenantSettings['general']))}>
        <div className="card-body space-y-4">
          <div>
            <label className="label">Nombre del negocio</label>
            <input {...register('name')} className="input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input type="email" {...register('email')} className="input" />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input type="tel" {...register('phone')} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Dirección</label>
            <input {...register('address')} className="input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ciudad</label>
              <input {...register('city')} className="input" />
            </div>
            <div>
              <label className="label">País</label>
              <input {...register('country')} className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Zona horaria</label>
              <select {...register('timezone')} className="input">
                <option value="America/New_York">America/New_York</option>
                <option value="America/Chicago">America/Chicago</option>
                <option value="America/Denver">America/Denver</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="America/Mexico_City">America/Mexico_City</option>
                <option value="America/Bogota">America/Bogota</option>
                <option value="America/Buenos_Aires">America/Buenos_Aires</option>
                <option value="Europe/Madrid">Europe/Madrid</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
            <div>
              <label className="label">Moneda</label>
              <select {...register('currency')} className="input">
                <option value="USD">USD - Dólar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="COP">COP - Peso Colombiano</option>
                <option value="ARS">ARS - Peso Argentino</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card-footer flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Branding Settings
function BrandingSettings({ settings }: { settings?: any }) {
  const queryClient = useQueryClient();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
  });

  // Watch para sincronizar los inputs
  const primaryColor = watch('primaryColor');
  const secondaryColor = watch('secondaryColor');

  // Cargar datos cuando settings cambie
  useEffect(() => {
    console.log('🔄 [BRANDING] Settings recibidos:', settings?.primaryColor, settings?.secondaryColor);
    if (settings) {
      reset({
        primaryColor: settings.primaryColor || '#3B82F6',
        secondaryColor: settings.secondaryColor || '#10B981',
      });
      setLogoPreview(settings.logo || null);
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (data: TenantSettings['branding']) => {
      console.log('🎨 [BRANDING] Enviando datos:', data);
      return settingsService.updateBranding(data);
    },
    onSuccess: () => {
      console.log('✅ [BRANDING] Guardado exitosamente');
      toast.success('Configuración guardada');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error: any) => {
      console.error('❌ [BRANDING] Error:', error);
      toast.error(error.response?.data?.message || 'Error al guardar');
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (2MB máximo)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('El archivo debe ser menor a 2MB');
      return;
    }

    // Validar tipo
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('Solo se permiten archivos PNG o JPG');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const result = await settingsService.uploadLogo(file);
      setLogoPreview(result.data.url);
      toast.success('Logo actualizado');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al subir el logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const onSubmit = (data: any) => {
    console.log('🎨 [BRANDING] Form submit con datos:', data);
    mutation.mutate(data as TenantSettings['branding']);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Marca y Personalización
        </h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card-body space-y-4">
          {/* Logo Upload */}
          <div>
            <label className="label">Logo del negocio</label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-2">Sin logo</span>
                )}
              </div>
              {/* Upload button */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="btn-secondary mb-2"
                >
                  {isUploadingLogo ? 'Subiendo...' : 'Subir logo'}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Formatos: PNG, JPG. Máximo 2MB.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Color primario</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={primaryColor} 
                  onChange={(e) => setValue('primaryColor', e.target.value)}
                  className="h-10 w-20 rounded border cursor-pointer" 
                />
                <input 
                  {...register('primaryColor')} 
                  className="input flex-1" 
                  placeholder="#3B82F6" 
                />
              </div>
            </div>
            <div>
              <label className="label">Color secundario</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={secondaryColor}
                  onChange={(e) => setValue('secondaryColor', e.target.value)}
                  className="h-10 w-20 rounded border cursor-pointer" 
                />
                <input 
                  {...register('secondaryColor')} 
                  className="input flex-1" 
                  placeholder="#10B981" 
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Los colores se aplicarán en la página de reservas públicas.
          </p>
        </div>

        <div className="card-footer flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Booking Settings
function BookingSettings({ settings }: { settings?: any }) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const { register, handleSubmit, reset, formState: { isDirty }, watch, setValue } = useForm({
    defaultValues: {
      allowOnlineBooking: true,
      requireConfirmation: false,
      maxAdvanceBooking: 30,
      minAdvanceBooking: 1,
      cancellationPolicy: '',
    },
  });

  const allowOnlineBooking = watch('allowOnlineBooking');
  const requireConfirmation = watch('requireConfirmation');
  const bookingUrl = settings?.slug 
    ? `${window.location.origin}/book/${settings.slug}`
    : '';

  const copyUrl = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast.success('URL copiada al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  // Cargar datos cuando settings cambie
  useEffect(() => {
    if (settings) {
      reset({
        allowOnlineBooking: settings.allowOnlineBooking ?? true,
        requireConfirmation: settings.requireConfirmation ?? false,
        maxAdvanceBooking: settings.maxAdvanceBooking ?? 30,
        minAdvanceBooking: settings.minAdvanceBooking ?? 1,
        cancellationPolicy: settings.cancellationPolicy ?? '',
      });
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (data: TenantSettings['booking']) => settingsService.updateBooking(data),
    onSuccess: () => {
      toast.success('Configuración guardada');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar');
    },
  });

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Configuración de Reservas
        </h2>
      </div>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data as TenantSettings['booking']))}>
        <div className="card-body space-y-4">
          {/* URL Pública de Reservas */}
          {bookingUrl && (
            <div className={`p-4 rounded-xl border ${allowOnlineBooking ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tu URL pública de reservas:
                  </p>
                  <p className="text-sm font-mono text-primary-600 dark:text-primary-400 truncate">
                    {bookingUrl}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copiado
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copiar
                      </>
                    )}
                  </button>
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex items-center gap-2 whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Ver
                  </a>
                </div>
              </div>
              {!allowOnlineBooking && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  ⚠️ Las reservas online están desactivadas. Actívalas para que tus clientes puedan agendar.
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  Permitir reservas online
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Los clientes pueden reservar citas desde la página pública
                </p>
              </div>
              <ToggleSwitch
                checked={allowOnlineBooking}
                onChange={(val) => setValue('allowOnlineBooking', val, { shouldDirty: true })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  Requerir confirmación manual
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Las citas quedarán pendientes hasta que las confirmes
                </p>
              </div>
              <ToggleSwitch
                checked={requireConfirmation}
                onChange={(val) => setValue('requireConfirmation', val, { shouldDirty: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Reserva mínima anticipada (días)</label>
              <input type="number" {...register('minAdvanceBooking')} className="input" min="0" />
            </div>
            <div>
              <label className="label">Reserva máxima anticipada (días)</label>
              <input type="number" {...register('maxAdvanceBooking')} className="input" min="1" />
            </div>
          </div>

          <div>
            <label className="label">Política de cancelación</label>
            <textarea {...register('cancellationPolicy')} rows={3} className="input" placeholder="Descripción de tu política de cancelación..." />
          </div>
        </div>

        <div className="card-footer flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Notification Settings
function NotificationSettings({ settings }: { settings?: any }) {
  const queryClient = useQueryClient();
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const { register, handleSubmit, reset, formState: { isDirty }, watch, setValue } = useForm({
    defaultValues: {
      emailEnabled: true,
      notifyClients: true,
      notifyEmployees: true,
      reminderHours: 24,
      // SMTP
      smtpEnabled: false,
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
      smtpFrom: '',
      smtpFromName: '',
    },
  });

  const emailEnabled = watch('emailEnabled');
  const notifyClients = watch('notifyClients');
  const notifyEmployees = watch('notifyEmployees');
  const smtpEnabled = watch('smtpEnabled');

  // Cargar datos cuando settings cambie
  useEffect(() => {
    if (settings) {
      reset({
        emailEnabled: settings.emailEnabled ?? true,
        notifyClients: settings.notifyClients ?? true,
        notifyEmployees: settings.notifyEmployees ?? true,
        reminderHours: settings.reminderHours ?? 24,
        smtpEnabled: settings.smtpEnabled ?? false,
        smtpHost: settings.smtpHost ?? '',
        smtpPort: settings.smtpPort ?? 587,
        smtpUser: settings.smtpUser ?? '',
        smtpPass: settings.smtpPass ?? '',
        smtpFrom: settings.smtpFrom ?? '',
        smtpFromName: settings.smtpFromName ?? '',
      });
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (data: any) => settingsService.updateNotifications(data),
    onSuccess: () => {
      toast.success('Configuración guardada');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar');
    },
  });

  return (
    <div className="space-y-6">
      {/* Notificaciones por Email */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notificaciones por Email
          </h2>
        </div>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
          <div className="card-body space-y-6">
            {/* Switch principal */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  Activar notificaciones por email
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enviar confirmaciones y recordatorios por correo electrónico
                </p>
              </div>
              <ToggleSwitch 
                checked={emailEnabled} 
                onChange={(val) => setValue('emailEnabled', val, { shouldDirty: true })} 
              />
            </div>

            {emailEnabled && (
              <>
                {/* Destinatarios */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    ¿A quién enviar notificaciones?
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          Notificar a clientes
                        </span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Confirmaciones, recordatorios y cambios de cita
                        </p>
                      </div>
                      <ToggleSwitch 
                        checked={notifyClients} 
                        onChange={(val) => setValue('notifyClients', val, { shouldDirty: true })} 
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          Notificar a empleados
                        </span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nuevas citas asignadas y cambios en su agenda
                        </p>
                      </div>
                      <ToggleSwitch 
                        checked={notifyEmployees} 
                        onChange={(val) => setValue('notifyEmployees', val, { shouldDirty: true })} 
                      />
                    </div>
                  </div>
                </div>

                {/* Recordatorio */}
                <div>
                  <label className="label">Enviar recordatorio con antelación (horas)</label>
                  <input 
                    type="number" 
                    {...register('reminderHours', { valueAsNumber: true })} 
                    className="input max-w-xs" 
                    min="1" 
                    max="72"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se enviará un recordatorio automático antes de cada cita
                  </p>
                </div>
              </>
            )}
          </div>
          
          <div className="card-footer flex justify-end">
            <button
              type="submit"
              disabled={!isDirty || mutation.isPending}
              className="btn-primary"
            >
              {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      {/* Configuración SMTP */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Servidor de Correo (SMTP)
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Configura tu propio servidor SMTP para enviar emails con tu dominio
              </p>
            </div>
            <ToggleSwitch 
              checked={smtpEnabled} 
              onChange={(val) => setValue('smtpEnabled', val, { shouldDirty: true })} 
            />
          </div>
        </div>
        
        {smtpEnabled && (
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
            <div className="card-body space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  💡 <strong>Tip:</strong> Si no configuras SMTP, los emails se enviarán desde nuestro servidor por defecto.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Servidor SMTP</label>
                  <input 
                    {...register('smtpHost')} 
                    className="input" 
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="label">Puerto</label>
                  <input 
                    type="number"
                    {...register('smtpPort', { valueAsNumber: true })} 
                    className="input" 
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Usuario</label>
                  <input 
                    {...register('smtpUser')} 
                    className="input" 
                    placeholder="usuario@tudominio.com"
                  />
                </div>
                <div>
                  <label className="label">Contraseña</label>
                  <div className="relative">
                    <input 
                      type={showSmtpPassword ? 'text' : 'password'}
                      {...register('smtpPass')} 
                      className="input pr-10" 
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSmtpPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Email remitente</label>
                  <input 
                    type="email"
                    {...register('smtpFrom')} 
                    className="input" 
                    placeholder="citas@tudominio.com"
                  />
                </div>
                <div>
                  <label className="label">Nombre remitente</label>
                  <input 
                    {...register('smtpFromName')} 
                    className="input" 
                    placeholder="Mi Negocio"
                  />
                </div>
              </div>
            </div>
            
            <div className="card-footer flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => toast('Función de prueba próximamente', { icon: 'ℹ️' })}
              >
                Enviar email de prueba
              </button>
              <button
                type="submit"
                disabled={!isDirty || mutation.isPending}
                className="btn-primary"
              >
                {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Schedule Settings
function ScheduleSettings() {
  const queryClient = useQueryClient();
  const { data: scheduleData } = useQuery({
    queryKey: ['work-schedule'],
    queryFn: () => settingsService.getWorkSchedule(),
  });

  const DAYS = [
    { id: 0, label: 'Domingo' },
    { id: 1, label: 'Lunes' },
    { id: 2, label: 'Martes' },
    { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' },
    { id: 5, label: 'Viernes' },
    { id: 6, label: 'Sábado' },
  ];

  const schedule = scheduleData?.data || [];

  const [localSchedule, setLocalSchedule] = useState(
    DAYS.map((day) => ({
      dayOfWeek: day.id,
      isActive: day.id >= 1 && day.id <= 5, // Lunes a Viernes por default
      startTime: '09:00',
      endTime: '18:00',
    }))
  );

  // Actualizar localSchedule cuando lleguen los datos del servidor
  useEffect(() => {
    if (schedule.length > 0) {
      setLocalSchedule(
        DAYS.map((day) => {
          const existing = schedule.find((s: any) => s.dayOfWeek === day.id);
          return {
            dayOfWeek: day.id,
            isActive: existing?.isWorking ?? (day.id >= 1 && day.id <= 5),
            startTime: existing?.startTime || '09:00',
            endTime: existing?.endTime || '18:00',
          };
        })
      );
    }
  }, [schedule]);

  const mutation = useMutation({
    mutationFn: (data: any[]) => settingsService.updateWorkSchedule(data),
    onSuccess: () => {
      toast.success('Horarios guardados');
      queryClient.invalidateQueries({ queryKey: ['work-schedule'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar');
    },
  });

  const handleChange = (dayIndex: number, field: string, value: any) => {
    setLocalSchedule((prev) => {
      const updated = [...prev];
      updated[dayIndex] = { ...updated[dayIndex], [field]: value };
      return updated;
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Horarios de Trabajo
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configura los días y horarios en los que atiendes
        </p>
      </div>
      <div className="card-body">
        <div className="space-y-3">
          {DAYS.map((day, index) => (
            <div
              key={day.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="flex items-center gap-3 w-40">
                <ToggleSwitch
                  checked={localSchedule[index]?.isActive}
                  onChange={(val) => handleChange(index, 'isActive', val)}
                />
                <span className="font-medium text-gray-900 dark:text-white">{day.label}</span>
              </div>
              
              {localSchedule[index]?.isActive && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={localSchedule[index]?.startTime}
                    onChange={(e) => handleChange(index, 'startTime', e.target.value)}
                    className="input w-auto"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="time"
                    value={localSchedule[index]?.endTime}
                    onChange={(e) => handleChange(index, 'endTime', e.target.value)}
                    className="input w-auto"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="card-footer flex justify-end">
        <button
          onClick={() => mutation.mutate(localSchedule)}
          disabled={mutation.isPending}
          className="btn-primary"
        >
          {mutation.isPending ? 'Guardando...' : 'Guardar Horarios'}
        </button>
      </div>
    </div>
  );
}

// Social Settings
function SocialSettings({ settings }: { settings?: any }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm({
    defaultValues: {
      website: '',
      facebook: '',
      instagram: '',
      twitter: '',
      tiktok: '',
      linkedin: '',
      whatsapp: '',
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        website: settings.website || '',
        facebook: settings.facebook || '',
        instagram: settings.instagram || '',
        twitter: settings.twitter || '',
        tiktok: settings.tiktok || '',
        linkedin: settings.linkedin || '',
        whatsapp: settings.whatsapp || '',
      });
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (data: any) => settingsService.updateGeneral(data),
    onSuccess: () => {
      toast.success('Redes sociales actualizadas');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar');
    },
  });

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Redes Sociales y Web
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Estos enlaces aparecerán en tu página pública de reservas
        </p>
      </div>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <div className="card-body space-y-4">
          <div>
            <label className="label">Sitio Web</label>
            <input 
              type="url"
              {...register('website')} 
              className="input" 
              placeholder="https://www.minegocio.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Facebook</label>
              <input 
                type="url"
                {...register('facebook')} 
                className="input" 
                placeholder="https://facebook.com/minegocio"
              />
            </div>
            <div>
              <label className="label">Instagram</label>
              <input 
                type="url"
                {...register('instagram')} 
                className="input" 
                placeholder="https://instagram.com/minegocio"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Twitter / X</label>
              <input 
                type="url"
                {...register('twitter')} 
                className="input" 
                placeholder="https://x.com/minegocio"
              />
            </div>
            <div>
              <label className="label">TikTok</label>
              <input 
                type="url"
                {...register('tiktok')} 
                className="input" 
                placeholder="https://tiktok.com/@minegocio"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">LinkedIn</label>
              <input 
                type="url"
                {...register('linkedin')} 
                className="input" 
                placeholder="https://linkedin.com/company/minegocio"
              />
            </div>
            <div>
              <label className="label">WhatsApp (número)</label>
              <input 
                type="text"
                {...register('whatsapp')} 
                className="input" 
                placeholder="+52 55 1234 5678"
              />
              <p className="text-xs text-gray-500 mt-1">
                Número con código de país para enlace de WhatsApp
              </p>
            </div>
          </div>
        </div>

        <div className="card-footer flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

// AI Settings Component (Tenant - Limited)
function AISettings({ settings }: { settings?: any }) {
  const queryClient = useQueryClient();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [savingEmployee, setSavingEmployee] = useState<string | null>(null);

  // Check if AI is enabled by platform admin
  const aiEnabledByAdmin = settings?.aiEnabled ?? false;

  // Local state for tenant toggle
  const [aiActiveForTenant, setAiActiveForTenant] = useState(settings?.aiActiveForTenant ?? true);
  const [savingTenant, setSavingTenant] = useState(false);

  // Fetch all users (employees)
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        const data = await response.json();
        // La respuesta tiene estructura { success: true, data: [...], pagination: {...} }
        if (data.success && Array.isArray(data.data)) {
          setEmployees(data.data);
        } else if (data.data && Array.isArray(data.data)) {
          setEmployees(data.data);
        } else if (Array.isArray(data)) {
          setEmployees(data);
        } else {
          console.log('Respuesta de usuarios:', data);
          setEmployees([]);
        }
      } catch (error) {
        console.error('Error loading employees:', error);
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // Toggle AI for tenant
  const handleToggleTenantAI = async (enabled: boolean) => {
    try {
      setSavingTenant(true);
      await settingsService.updateGeneral({ aiActiveForTenant: enabled });
      setAiActiveForTenant(enabled);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(enabled ? 'Asistente IA activado' : 'Asistente IA desactivado');
    } catch (error) {
      toast.error('Error al actualizar');
    } finally {
      setSavingTenant(false);
    }
  };

  // Toggle AI for employee
  const handleToggleEmployeeAI = async (employeeId: string, canUseAI: boolean) => {
    try {
      setSavingEmployee(employeeId);
      const response = await fetch(`/api/users/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ canUseAI }),
      });
      
      if (response.ok) {
        setEmployees(prev => prev.map(emp => 
          emp.id === employeeId ? { ...emp, canUseAI } : emp
        ));
        toast.success(canUseAI ? 'IA activada para empleado' : 'IA desactivada para empleado');
      }
    } catch (error) {
      toast.error('Error al actualizar');
    } finally {
      setSavingEmployee(null);
    }
  };

  // If AI not enabled by admin
  if (!aiEnabledByAdmin) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Asistente de Inteligencia Artificial
            </h2>
          </div>
        </div>
        <div className="card-body">
          <div className="p-6 text-center">
            <SparklesIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Asistente IA no disponible
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              El asistente de inteligencia artificial no está habilitado para tu cuenta.
              Contacta al administrador de la plataforma para activar esta función.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Asistente de Inteligencia Artificial
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gestiona el acceso al asistente de IA para tu equipo
        </p>
      </div>

      <div className="card-body space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Activar Asistente IA</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Habilita o deshabilita el asistente para todo tu negocio
            </p>
          </div>
          <ToggleSwitch
            checked={aiActiveForTenant}
            onChange={handleToggleTenantAI}
            disabled={savingTenant}
          />
        </div>

        {aiActiveForTenant && (
          <>
            {/* Employee Access */}
            <div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Acceso por Empleado
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Selecciona qué empleados pueden usar el asistente de IA
              </p>

              {loadingEmployees ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                        <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
                      </div>
                      <div className="w-12 h-6 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : !Array.isArray(employees) || employees.length === 0 ? (
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                  <p className="text-gray-500 dark:text-gray-400">No hay empleados registrados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {employees.map((employee) => (
                    <div 
                      key={employee.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                          <span className="text-purple-600 dark:text-purple-400 font-medium">
                            {employee.firstName?.[0]}{employee.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={employee.canUseAI ?? false}
                        onChange={(val) => handleToggleEmployeeAI(employee.id, val)}
                        disabled={savingEmployee === employee.id}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box - What can the assistant do */}
            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
              <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                ¿Qué puede hacer el asistente?
              </h4>
              <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span><strong>Crear citas:</strong> Agenda nuevas citas mediante conversación natural</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span><strong>Modificar citas:</strong> Cambia fecha, hora, servicio o empleado de citas existentes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span><strong>Cancelar citas:</strong> Cancela citas programadas con confirmación</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span><strong>Consultar disponibilidad:</strong> Verifica horarios disponibles por servicio o empleado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span><strong>Buscar clientes:</strong> Encuentra información de clientes existentes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span><strong>Ver servicios y precios:</strong> Consulta el catálogo de servicios con sus precios</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span><strong>Resumen del día:</strong> Obtén un resumen rápido de las citas del día</span>
                </li>
              </ul>
            </div>

            {/* Tips */}
            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
              <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2">
                💡 Consejos de uso
              </h4>
              <ul className="text-sm text-amber-600 dark:text-amber-300 space-y-1">
                <li>• Usa lenguaje natural: "Agenda una cita con María para mañana a las 3pm"</li>
                <li>• Sé específico con fechas y horas para mejores resultados</li>
                <li>• El asistente confirmará antes de realizar cambios importantes</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}