import { useState, useEffect } from 'react';
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
} from '@heroicons/react/24/outline';
import { settingsService } from '@/services/settings';
import { TenantSettings } from '@/types';
import WhatsAppSettings from '@/components/settings/WhatsAppSettings';

type SettingsTab = 'general' | 'branding' | 'booking' | 'notifications' | 'schedule' | 'whatsapp';

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
    { id: 'booking' as const, label: 'Reservas', icon: CalendarIcon },
    { id: 'notifications' as const, label: 'Notificaciones', icon: BellIcon },
    { id: 'schedule' as const, label: 'Horarios', icon: ClockIcon },
    { id: 'whatsapp' as const, label: 'WhatsApp', icon: ChatBubbleOvalLeftEllipsisIcon },
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
              {activeTab === 'booking' && <BookingSettings settings={settings} />}
              {activeTab === 'notifications' && <NotificationSettings settings={settings} />}
              {activeTab === 'schedule' && <ScheduleSettings />}
              {activeTab === 'whatsapp' && <WhatsAppSettings />}
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
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm({
    defaultValues: {
      logo: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
  });

  // Cargar datos cuando settings cambie
  useEffect(() => {
    if (settings) {
      reset({
        logo: settings.logo || '',
        primaryColor: settings.primaryColor || '#3B82F6',
        secondaryColor: settings.secondaryColor || '#10B981',
      });
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (data: TenantSettings['branding']) => settingsService.updateBranding(data),
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
          Marca y Personalización
        </h2>
      </div>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data as TenantSettings['branding']))}>
        <div className="card-body space-y-4">
          <div>
            <label className="label">Logo (URL)</label>
            <input {...register('logo')} className="input" placeholder="https://ejemplo.com/logo.png" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Color primario</label>
              <div className="flex gap-2">
                <input type="color" {...register('primaryColor')} className="h-10 w-20 rounded border cursor-pointer" />
                <input {...register('primaryColor')} className="input flex-1" placeholder="#3B82F6" />
              </div>
            </div>
            <div>
              <label className="label">Color secundario</label>
              <div className="flex gap-2">
                <input type="color" {...register('secondaryColor')} className="h-10 w-20 rounded border cursor-pointer" />
                <input {...register('secondaryColor')} className="input flex-1" placeholder="#10B981" />
              </div>
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

// Booking Settings
function BookingSettings({ settings }: { settings?: any }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm({
    defaultValues: {
      allowOnlineBooking: true,
      requireConfirmation: false,
      maxAdvanceBooking: 30,
      minAdvanceBooking: 1,
    },
  });

  // Cargar datos cuando settings cambie
  useEffect(() => {
    if (settings) {
      reset({
        allowOnlineBooking: settings.allowOnlineBooking ?? true,
        requireConfirmation: settings.requireConfirmation ?? false,
        maxAdvanceBooking: settings.maxAdvanceBooking ?? 30,
        minAdvanceBooking: settings.minAdvanceBooking ?? 1,
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
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('allowOnlineBooking')}
                className="w-5 h-5 text-primary-600 rounded"
              />
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  Permitir reservas online
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Los clientes pueden reservar citas desde la página pública
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('requireConfirmation')}
                className="w-5 h-5 text-primary-600 rounded"
              />
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  Requerir confirmación manual
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Las citas quedarán pendientes hasta que las confirmes
                </p>
              </div>
            </label>
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
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm({
    defaultValues: {
      emailEnabled: true,
      smsEnabled: false,
      reminderHours: 24,
    },
  });

  // Cargar datos cuando settings cambie
  useEffect(() => {
    if (settings) {
      reset({
        emailEnabled: settings.emailEnabled ?? true,
        smsEnabled: settings.smsEnabled ?? false,
        reminderHours: settings.reminderHours ?? 24,
      });
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (data: TenantSettings['notifications']) => settingsService.updateNotifications(data),
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
          Notificaciones
        </h2>
      </div>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data as TenantSettings['notifications']))}>
        <div className="card-body space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('emailEnabled')}
                className="w-5 h-5 text-primary-600 rounded"
              />
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  Notificaciones por email
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enviar confirmaciones y recordatorios por email
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('smsEnabled')}
                className="w-5 h-5 text-primary-600 rounded"
              />
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  Notificaciones por SMS
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enviar recordatorios por mensaje de texto
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="label">Enviar recordatorio con antelación (horas)</label>
            <input type="number" {...register('reminderHours')} className="input max-w-xs" min="1" />
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
              <label className="flex items-center gap-2 w-32 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSchedule[index]?.isActive}
                  onChange={(e) => handleChange(index, 'isActive', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="font-medium text-gray-900 dark:text-white">{day.label}</span>
              </label>
              
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
