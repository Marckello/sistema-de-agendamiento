import { useState } from 'react';
import {
  Settings,
  Mail,
  Shield,
  Save,
  CheckCircle,
  Eye,
  EyeOff,
  Webhook,
  Send,
} from 'lucide-react';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

export default function PlatformSettings() {
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'security' | 'webhooks'>('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'CitasPro',
    supportEmail: 'soporte@citaspro.com',
    defaultTimezone: 'America/Mexico_City',
    maintenanceMode: false,
  });

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    smtpFromName: 'CitasPro',
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    requireEmailVerification: true,
    allowSelfRegistration: true,
  });

  // Webhook settings
  const [webhookSettings, setWebhookSettings] = useState({
    enabled: false,
    url: '',
    secret: '',
    events: {
      appointmentCreated: false,
      appointmentUpdated: false,
      appointmentConfirmed: false,
      appointmentCancelled: false,
      appointmentCompleted: false,
      appointmentNoShow: false,
      clientCreated: false,
      clientUpdated: false,
    },
  });

  const [testingWebhook, setTestingWebhook] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      // In real implementation, save to API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'security', name: 'Seguridad', icon: Shield },
    { id: 'webhooks', name: 'Webhooks', icon: Webhook },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración de Plataforma</h1>
          <p className="text-gray-400 mt-1">Ajustes globales de CitasPro</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : saved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Configuración General</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Nombre de la Plataforma</label>
                    <input
                      type="text"
                      value={generalSettings.platformName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, platformName: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Email de Soporte</label>
                    <input
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Zona Horaria por Defecto</label>
                    <select
                      value={generalSettings.defaultTimezone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, defaultTimezone: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                      <option value="America/Monterrey">Monterrey (GMT-6)</option>
                      <option value="America/Tijuana">Tijuana (GMT-8)</option>
                      <option value="America/Cancun">Cancún (GMT-5)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Modo Mantenimiento</p>
                      <p className="text-gray-400 text-sm">Desactiva el acceso público a la plataforma</p>
                    </div>
                    <ToggleSwitch
                      checked={generalSettings.maintenanceMode}
                      onChange={(val) => setGeneralSettings({ ...generalSettings, maintenanceMode: val })}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Configuración de Email (SMTP)</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Configura el servidor SMTP para enviar emails de la plataforma (notificaciones globales, recuperación de contraseña, etc.)
                </p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Servidor SMTP</label>
                      <input
                        type="text"
                        value={emailSettings.smtpHost}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                        placeholder="smtp.gmail.com"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Puerto</label>
                      <input
                        type="number"
                        value={emailSettings.smtpPort}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Usuario SMTP</label>
                      <input
                        type="text"
                        value={emailSettings.smtpUser}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                        placeholder="tu-email@gmail.com"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Contraseña SMTP</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={emailSettings.smtpPass}
                          onChange={(e) => setEmailSettings({ ...emailSettings, smtpPass: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Email Remitente</label>
                      <input
                        type="email"
                        value={emailSettings.smtpFrom}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpFrom: e.target.value })}
                        placeholder="noreply@tudominio.com"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Nombre Remitente</label>
                      <input
                        type="text"
                        value={emailSettings.smtpFromName}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpFromName: e.target.value })}
                        placeholder="CitasPro"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-750 transition-colors"
                  >
                    Enviar Email de Prueba
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Configuración de Seguridad</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Tiempo de Sesión (minutos)</label>
                      <input
                        type="number"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                        min="5"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Máx. Intentos de Login</label>
                      <input
                        type="number"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                        min="3"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Requerir Verificación de Email</p>
                      <p className="text-gray-400 text-sm">Los usuarios deben verificar su email antes de acceder</p>
                    </div>
                    <ToggleSwitch
                      checked={securitySettings.requireEmailVerification}
                      onChange={(val) => setSecuritySettings({ ...securitySettings, requireEmailVerification: val })}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Permitir Auto-Registro</p>
                      <p className="text-gray-400 text-sm">Nuevas empresas pueden registrarse por sí mismas</p>
                    </div>
                    <ToggleSwitch
                      checked={securitySettings.allowSelfRegistration}
                      onChange={(val) => setSecuritySettings({ ...securitySettings, allowSelfRegistration: val })}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Webhooks Settings */}
          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">Webhooks (n8n / Integraciones)</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Configura webhooks globales para integraciones con n8n, Zapier u otras herramientas de automatización
                </p>
                
                <div className="space-y-6">
                  {/* Enable toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Habilitar Webhooks</p>
                      <p className="text-gray-400 text-sm">Activa el envío de eventos a URLs externas</p>
                    </div>
                    <ToggleSwitch
                      checked={webhookSettings.enabled}
                      onChange={(val) => setWebhookSettings({ ...webhookSettings, enabled: val })}
                      size="sm"
                    />
                  </div>

                  {/* URL and Secret */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">URL del Webhook</label>
                      <input
                        type="url"
                        value={webhookSettings.url}
                        onChange={(e) => setWebhookSettings({ ...webhookSettings, url: e.target.value })}
                        placeholder="https://tu-servidor.com/webhook"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Secret (para firma HMAC)</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={webhookSettings.secret}
                          onChange={(e) => setWebhookSettings({ ...webhookSettings, secret: e.target.value })}
                          placeholder="••••••••"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Events */}
                  <div>
                    <label className="block text-gray-400 text-sm mb-3">Eventos a enviar</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { key: 'appointmentCreated', label: 'Cita creada' },
                        { key: 'appointmentUpdated', label: 'Cita actualizada' },
                        { key: 'appointmentConfirmed', label: 'Cita confirmada' },
                        { key: 'appointmentCancelled', label: 'Cita cancelada' },
                        { key: 'appointmentCompleted', label: 'Cita completada' },
                        { key: 'appointmentNoShow', label: 'Cliente no asistió' },
                        { key: 'clientCreated', label: 'Cliente creado' },
                        { key: 'clientUpdated', label: 'Cliente actualizado' },
                      ].map((event) => (
                        <div key={event.key} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                          <span className="text-white text-sm">{event.label}</span>
                          <ToggleSwitch
                            checked={webhookSettings.events[event.key as keyof typeof webhookSettings.events]}
                            onChange={(val) => setWebhookSettings({
                              ...webhookSettings,
                              events: { ...webhookSettings.events, [event.key]: val }
                            })}
                            size="sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Test button */}
                  <div className="pt-4 border-t border-gray-700">
                    <button
                      onClick={async () => {
                        setTestingWebhook(true);
                        // Simulate test
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        setTestingWebhook(false);
                        alert('Webhook de prueba enviado exitosamente');
                      }}
                      disabled={!webhookSettings.url || testingWebhook}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      {testingWebhook ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Probar Webhook
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
