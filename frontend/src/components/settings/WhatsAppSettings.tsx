import { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  QrCode, 
  Power, 
  PowerOff, 
  Settings, 
  Clock, 
  Bell, 
  Send, 
  MessageCircle,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { whatsappService, WhatsAppStatus, WhatsAppConfig, WhatsAppMessageLog } from '../../services/whatsapp';
import { toast } from 'react-hot-toast';

interface TabProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function Tab({ active, onClick, children }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
        active
          ? 'bg-dark-800 text-white border-b-2 border-accent-500'
          : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
      }`}
    >
      {children}
    </button>
  );
}

export default function WhatsAppSettings() {
  const [activeTab, setActiveTab] = useState<'connection' | 'config' | 'logs'>('connection');
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [logs, setLogs] = useState<WhatsAppMessageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  
  // Form states
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hola, este es un mensaje de prueba de CitasPro 👋');

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    try {
      const [statusData, configData] = await Promise.all([
        whatsappService.getStatus(),
        whatsappService.getConfig()
      ]);
      setStatus(statusData);
      setConfig(configData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar logs
  const loadLogs = useCallback(async () => {
    try {
      const logsData = await whatsappService.getMessageLogs({ limit: 50 });
      setLogs(logsData);
    } catch (error) {
      console.error('Error cargando logs:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, loadLogs]);

  // Polling para actualizar estado cuando está conectando
  useEffect(() => {
    if (status?.status === 'CONNECTING' || status?.status === 'QR_READY' || status?.status === 'AUTHENTICATED') {
      const interval = setInterval(async () => {
        try {
          const newStatus = await whatsappService.getStatus();
          setStatus(newStatus);
          
          if (newStatus.status === 'CONNECTED') {
            toast.success('¡WhatsApp conectado correctamente!');
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Error polling status:', error);
        }
      }, 2000);
      
      setPollInterval(interval);
      return () => clearInterval(interval);
    } else if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  }, [status?.status]);

  // Iniciar conexión
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await whatsappService.connect();
      setStatus(prev => prev ? { ...prev, status: result.status as any, qrCode: result.qrCode } : null);
      
      if (result.qrCode) {
        toast.success('Escanea el código QR con tu WhatsApp');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error conectando WhatsApp');
    } finally {
      setIsConnecting(false);
    }
  };

  // Desconectar
  const handleDisconnect = async () => {
    try {
      await whatsappService.disconnect();
      setStatus(prev => prev ? { ...prev, status: 'DISCONNECTED', phone: undefined, qrCode: undefined } : null);
      toast.success('WhatsApp desconectado');
    } catch (error: any) {
      toast.error(error.message || 'Error desconectando');
    }
  };

  // Guardar configuración
  const handleSaveConfig = async () => {
    if (!config) return;
    
    try {
      await whatsappService.updateConfig(config);
      toast.success('Configuración guardada');
    } catch (error: any) {
      toast.error(error.message || 'Error guardando configuración');
    }
  };

  // Enviar mensaje de prueba
  const handleSendTest = async () => {
    if (!testPhone || !testMessage) {
      toast.error('Ingresa un número y mensaje');
      return;
    }
    
    try {
      await whatsappService.sendTestMessage(testPhone, testMessage);
      toast.success('Mensaje de prueba enviado');
      setTestPhone('');
    } catch (error: any) {
      toast.error(error.message || 'Error enviando mensaje');
    }
  };

  // Renderizar estado
  const renderStatus = () => {
    if (!status) return null;
    
    const statusConfig = {
      DISCONNECTED: { color: 'text-red-500', bg: 'bg-red-500/10', icon: PowerOff, label: 'Desconectado' },
      CONNECTING: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Loader2, label: 'Conectando...' },
      QR_READY: { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: QrCode, label: 'Escanea el QR' },
      AUTHENTICATED: { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Loader2, label: 'Autenticando...' },
      CONNECTED: { color: 'text-green-500', bg: 'bg-green-500/10', icon: Check, label: 'Conectado' },
      SLEEPING: { color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Clock, label: 'En reposo' }
    };
    
    const cfg = statusConfig[status.status];
    const Icon = cfg.icon;
    
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color} ${status.status === 'CONNECTING' || status.status === 'AUTHENTICATED' ? 'animate-spin' : ''}`} />
        <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
        {status.phone && (
          <span className="text-dark-400 text-sm">({status.phone})</span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <MessageSquare className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">WhatsApp Business</h2>
            <p className="text-sm text-dark-400">Conecta tu WhatsApp para enviar recordatorios automáticos</p>
          </div>
        </div>
        {renderStatus()}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-700">
        <Tab active={activeTab === 'connection'} onClick={() => setActiveTab('connection')}>
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4" />
            Conexión
          </div>
        </Tab>
        <Tab active={activeTab === 'config'} onClick={() => setActiveTab('config')}>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuración
          </div>
        </Tab>
        <Tab active={activeTab === 'logs'} onClick={() => setActiveTab('logs')}>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Mensajes
          </div>
        </Tab>
      </div>

      {/* Tab Content */}
      <div className="bg-dark-800 rounded-xl p-6">
        {/* Connection Tab */}
        {activeTab === 'connection' && (
          <div className="space-y-6">
            {/* Estado y acciones principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* QR Code / Estado */}
              <div className="bg-dark-900 rounded-xl p-6 flex flex-col items-center justify-center min-h-[300px]">
                {status?.status === 'DISCONNECTED' || status?.status === 'SLEEPING' ? (
                  <>
                    <PowerOff className="w-16 h-16 text-dark-500 mb-4" />
                    <p className="text-dark-400 mb-4 text-center">
                      {status?.status === 'SLEEPING' 
                        ? 'WhatsApp está en modo reposo (fuera de horario)'
                        : 'WhatsApp no está conectado'}
                    </p>
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Power className="w-5 h-5" />
                          Conectar WhatsApp
                        </>
                      )}
                    </button>
                  </>
                ) : status?.status === 'QR_READY' && status?.qrCode ? (
                  <>
                    <p className="text-white font-medium mb-4">Escanea este código QR con tu WhatsApp</p>
                    <div className="bg-white p-4 rounded-xl">
                      <img src={status.qrCode} alt="QR Code" className="w-56 h-56" />
                    </div>
                    <p className="text-dark-400 text-sm mt-4 text-center">
                      Abre WhatsApp → Menú → Dispositivos vinculados → Vincular dispositivo
                    </p>
                  </>
                ) : status?.status === 'CONNECTING' || status?.status === 'AUTHENTICATED' ? (
                  <>
                    <Loader2 className="w-16 h-16 text-accent-500 animate-spin mb-4" />
                    <p className="text-white font-medium">
                      {status?.status === 'AUTHENTICATED' ? 'Iniciando sesión...' : 'Generando código QR...'}
                    </p>
                  </>
                ) : status?.status === 'CONNECTED' ? (
                  <>
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                      <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <p className="text-white font-medium text-lg mb-2">WhatsApp Conectado</p>
                    <p className="text-dark-400 mb-6">{status.phone}</p>
                    <button
                      onClick={handleDisconnect}
                      className="px-6 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                      <PowerOff className="w-4 h-4" />
                      Desconectar
                    </button>
                  </>
                ) : null}
              </div>

              {/* Info y estadísticas */}
              <div className="space-y-4">
                {/* Estadísticas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-900 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-dark-400 mb-1">
                      <Send className="w-4 h-4" />
                      <span className="text-sm">Mensajes Enviados</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{config?.totalMessagesSent || 0}</p>
                  </div>
                  <div className="bg-dark-900 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-dark-400 mb-1">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">Mensajes Recibidos</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{config?.totalMessagesReceived || 0}</p>
                  </div>
                  <div className="bg-dark-900 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-dark-400 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Mensajes Hoy</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {status?.dailyMessageCount || 0}
                      <span className="text-sm text-dark-400 font-normal"> / 50</span>
                    </p>
                  </div>
                  <div className="bg-dark-900 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-dark-400 mb-1">
                      {status?.isOperatingHours ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm">Horario Activo</span>
                    </div>
                    <p className={`text-lg font-medium ${status?.isOperatingHours ? 'text-green-500' : 'text-red-500'}`}>
                      {status?.isOperatingHours ? 'Sí (8:00 - 20:00)' : 'No'}
                    </p>
                  </div>
                </div>

                {/* Alerta de límite */}
                {status?.dailyLimitReached && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-500 font-medium">Límite diario alcanzado</p>
                      <p className="text-dark-400 text-sm">
                        Has alcanzado el límite de 50 mensajes por día. Se reiniciará a medianoche.
                      </p>
                    </div>
                  </div>
                )}

                {/* Mensaje de prueba */}
                {status?.status === 'CONNECTED' && (
                  <div className="bg-dark-900 rounded-xl p-4">
                    <h3 className="text-white font-medium mb-3">Enviar mensaje de prueba</h3>
                    <div className="space-y-3">
                      <input
                        type="tel"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="Número (ej: 5551234567)"
                        className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-accent-500"
                      />
                      <textarea
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-accent-500 resize-none"
                      />
                      <button
                        onClick={handleSendTest}
                        className="w-full px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Enviar prueba
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && config && (
          <div className="space-y-6">
            {/* Horarios automáticos */}
            <div className="bg-dark-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-accent-500" />
                  <h3 className="text-white font-medium">Horario de operación automático</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoConnectEnabled}
                    onChange={(e) => setConfig({ ...config, autoConnectEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-600"></div>
                </label>
              </div>
              
              {config.autoConnectEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-dark-400 mb-1">Conectar a las</label>
                    <input
                      type="time"
                      value={config.connectAt || '08:00'}
                      onChange={(e) => setConfig({ ...config, connectAt: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-dark-400 mb-1">Desconectar a las</label>
                    <input
                      type="time"
                      value={config.disconnectAt || '20:00'}
                      onChange={(e) => setConfig({ ...config, disconnectAt: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-accent-500"
                    />
                  </div>
                </div>
              )}
              
              <p className="text-dark-500 text-sm mt-3">
                WhatsApp se conectará y desconectará automáticamente para evitar estar siempre en línea.
              </p>
            </div>

            {/* Recordatorios */}
            <div className="bg-dark-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-accent-500" />
                  <h3 className="text-white font-medium">Recordatorios automáticos</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.reminderEnabled}
                    onChange={(e) => setConfig({ ...config, reminderEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-600"></div>
                </label>
              </div>

              {config.reminderEnabled && (
                <div className="space-y-4">
                  {/* Recordatorio 24h */}
                  <div className="bg-dark-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-white text-sm">Recordatorio 24 horas antes</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.reminder24hEnabled}
                          onChange={(e) => setConfig({ ...config, reminder24hEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-600"></div>
                      </label>
                    </div>
                    {config.reminder24hEnabled && (
                      <textarea
                        value={config.reminderMessage24h}
                        onChange={(e) => setConfig({ ...config, reminderMessage24h: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-500 resize-none"
                      />
                    )}
                  </div>

                  {/* Recordatorio 1h */}
                  <div className="bg-dark-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-white text-sm">Recordatorio 1 hora antes</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.reminder1hEnabled}
                          onChange={(e) => setConfig({ ...config, reminder1hEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-600"></div>
                      </label>
                    </div>
                    {config.reminder1hEnabled && (
                      <textarea
                        value={config.reminderMessage1h}
                        onChange={(e) => setConfig({ ...config, reminderMessage1h: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-500 resize-none"
                      />
                    )}
                  </div>

                  <p className="text-dark-500 text-sm">
                    Variables disponibles: {'{clientName}'}, {'{serviceName}'}, {'{time}'}, {'{date}'}
                  </p>
                </div>
              )}
            </div>

            {/* Respuesta automática */}
            <div className="bg-dark-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-accent-500" />
                  <h3 className="text-white font-medium">Respuesta automática</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoReplyEnabled}
                    onChange={(e) => setConfig({ ...config, autoReplyEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-600"></div>
                </label>
              </div>

              {config.autoReplyEnabled && (
                <textarea
                  value={config.autoReplyMessage}
                  onChange={(e) => setConfig({ ...config, autoReplyMessage: e.target.value })}
                  rows={2}
                  placeholder="Mensaje de respuesta automática..."
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-accent-500 resize-none"
                />
              )}
            </div>

            {/* Guardar */}
            <button
              onClick={handleSaveConfig}
              className="w-full px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Check className="w-5 h-5" />
              Guardar configuración
            </button>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Historial de mensajes</h3>
              <button
                onClick={loadLogs}
                className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-12 text-dark-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay mensajes registrados</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg ${
                      log.direction === 'OUT' ? 'bg-accent-600/10 ml-8' : 'bg-dark-900 mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-dark-400">
                        {log.direction === 'OUT' ? 'Enviado a' : 'Recibido de'}: {log.phone}
                      </span>
                      <span className="text-xs text-dark-500">
                        {new Date(log.createdAt).toLocaleString('es-MX')}
                      </span>
                    </div>
                    <p className="text-white text-sm">{log.message}</p>
                    {log.isReminder && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-accent-600/20 text-accent-400 text-xs rounded">
                        Recordatorio
                      </span>
                    )}
                    {log.error && (
                      <p className="text-red-400 text-xs mt-1">{log.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
