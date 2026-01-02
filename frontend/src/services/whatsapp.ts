import api from './api';

export interface WhatsAppStatus {
  status: 'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'AUTHENTICATED' | 'CONNECTED' | 'SLEEPING';
  phone?: string;
  qrCode?: string;
  dailyMessageCount: number;
  dailyLimitReached: boolean;
  isOperatingHours: boolean;
}

export interface WhatsAppConfig {
  autoConnectEnabled: boolean;
  connectAt: string | null;
  disconnectAt: string | null;
  reminderEnabled: boolean;
  reminder24hEnabled: boolean;
  reminder1hEnabled: boolean;
  reminderMessage24h: string;
  reminderMessage1h: string;
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  totalMessagesSent: number;
  totalMessagesReceived: number;
}

export interface WhatsAppMessageLog {
  id: string;
  direction: 'IN' | 'OUT';
  phone: string;
  message: string;
  messageType: string;
  appointmentId?: string;
  isReminder: boolean;
  status: string;
  error?: string;
  createdAt: string;
}

class WhatsAppService {
  /**
   * Iniciar conexión (generar QR)
   */
  async connect(): Promise<{ status: string; qrCode?: string }> {
    const response = await api.post('/whatsapp/connect');
    return response.data;
  }

  /**
   * Obtener estado actual
   */
  async getStatus(): Promise<WhatsAppStatus> {
    const response = await api.get('/whatsapp/status');
    return response.data;
  }

  /**
   * Obtener QR code
   */
  async getQR(): Promise<{ qrCode: string }> {
    const response = await api.get('/whatsapp/qr');
    return response.data;
  }

  /**
   * Desconectar
   */
  async disconnect(): Promise<void> {
    await api.post('/whatsapp/disconnect');
  }

  /**
   * Obtener configuración
   */
  async getConfig(): Promise<WhatsAppConfig> {
    const response = await api.get('/whatsapp/config');
    return response.data.config;
  }

  /**
   * Actualizar configuración
   */
  async updateConfig(config: Partial<WhatsAppConfig>): Promise<void> {
    await api.put('/whatsapp/config', config);
  }

  /**
   * Enviar mensaje de prueba
   */
  async sendTestMessage(phone: string, message: string): Promise<void> {
    await api.post('/whatsapp/send-test', { phone, message });
  }

  /**
   * Enviar recordatorio manual
   */
  async sendReminder(appointmentId: string): Promise<void> {
    await api.post(`/whatsapp/send-reminder/${appointmentId}`);
  }

  /**
   * Obtener logs de mensajes
   */
  async getMessageLogs(options?: {
    limit?: number;
    offset?: number;
    direction?: 'IN' | 'OUT';
  }): Promise<WhatsAppMessageLog[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.direction) params.append('direction', options.direction);

    const response = await api.get(`/whatsapp/logs?${params.toString()}`);
    return response.data.logs;
  }
}

export const whatsappService = new WhatsAppService();
