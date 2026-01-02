import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as QRCode from 'qrcode';
import { PrismaClient, WhatsAppStatus } from '@prisma/client';
import { EventEmitter } from 'events';

const prisma = new PrismaClient();

// Configuración anti-ban
const ANTI_BAN_CONFIG = {
  // Delays aleatorios entre mensajes (ms)
  minDelay: 3000,        // 3 segundos mínimo
  maxDelay: 8000,        // 8 segundos máximo
  
  // Delay de typing (simulación de escritura)
  minTypingDelay: 1500,  // 1.5 segundos mínimo
  maxTypingDelay: 4000,  // 4 segundos máximo
  
  // Límites diarios
  dailyMessageLimit: 50, // Máximo 50 mensajes por día
  
  // Cooldown entre ráfagas
  burstLimit: 5,         // Máximo 5 mensajes seguidos
  burstCooldown: 60000,  // 1 minuto de cooldown después de ráfaga
  
  // Horario de operación
  operatingHours: {
    start: 8,  // 8 AM
    end: 20    // 8 PM
  }
};

interface WhatsAppInstance {
  client: Client;
  qrCode: string | null;
  status: WhatsAppStatus;
  lastActivity: Date;
  messageQueue: QueuedMessage[];
  isProcessingQueue: boolean;
  burstCount: number;
  lastBurstReset: Date;
}

interface QueuedMessage {
  phone: string;
  message: string;
  appointmentId?: string;
  isReminder: boolean;
  resolve: (value: boolean) => void;
  reject: (reason: any) => void;
}

class WhatsAppService extends EventEmitter {
  private instances: Map<string, WhatsAppInstance> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  
  constructor() {
    super();
  }
  
  /**
   * Obtener delay aleatorio entre min y max
   */
  private getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /**
   * Esperar un tiempo determinado
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Verificar si estamos en horario de operación
   */
  private isOperatingHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    return hour >= ANTI_BAN_CONFIG.operatingHours.start && 
           hour < ANTI_BAN_CONFIG.operatingHours.end;
  }
  
  /**
   * Formatear número de teléfono para WhatsApp
   */
  private formatPhone(phone: string): string {
    // Remover caracteres no numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Si empieza con 52 (México) y tiene 10 dígitos después, agregar 1
    if (cleaned.startsWith('52') && cleaned.length === 12) {
      cleaned = '521' + cleaned.slice(2);
    }
    
    // Si no tiene código de país, asumir México
    if (cleaned.length === 10) {
      cleaned = '521' + cleaned;
    }
    
    return cleaned + '@c.us';
  }
  
  /**
   * Inicializar cliente de WhatsApp para un tenant
   */
  async initializeClient(tenantId: string): Promise<{ qrCode?: string; status: WhatsAppStatus }> {
    // Si ya existe una instancia conectada, devolverla
    const existingInstance = this.instances.get(tenantId);
    if (existingInstance && existingInstance.status === 'CONNECTED') {
      return { status: existingInstance.status };
    }
    
    // Limpiar instancia anterior si existe
    if (existingInstance) {
      await this.destroyClient(tenantId);
    }
    
    // Actualizar estado en BD
    await prisma.whatsAppSession.upsert({
      where: { tenantId },
      create: { tenantId, status: 'CONNECTING' },
      update: { status: 'CONNECTING' }
    });
    
    // Crear nuevo cliente
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: tenantId }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });
    
    const instance: WhatsAppInstance = {
      client,
      qrCode: null,
      status: 'CONNECTING',
      lastActivity: new Date(),
      messageQueue: [],
      isProcessingQueue: false,
      burstCount: 0,
      lastBurstReset: new Date()
    };
    
    this.instances.set(tenantId, instance);
    
    // Evento QR
    client.on('qr', async (qr) => {
      try {
        const qrDataUrl = await QRCode.toDataURL(qr, { width: 256 });
        instance.qrCode = qrDataUrl;
        instance.status = 'QR_READY';
        
        await prisma.whatsAppSession.update({
          where: { tenantId },
          data: { status: 'QR_READY' }
        });
        
        this.emit('qr', { tenantId, qrCode: qrDataUrl });
        console.log(`[WhatsApp ${tenantId}] QR Code generado`);
      } catch (error) {
        console.error(`[WhatsApp ${tenantId}] Error generando QR:`, error);
      }
    });
    
    // Evento autenticado
    client.on('authenticated', async () => {
      instance.status = 'AUTHENTICATED';
      instance.qrCode = null;
      
      await prisma.whatsAppSession.update({
        where: { tenantId },
        data: { status: 'AUTHENTICATED' }
      });
      
      console.log(`[WhatsApp ${tenantId}] Autenticado`);
    });
    
    // Evento listo
    client.on('ready', async () => {
      instance.status = 'CONNECTED';
      instance.lastActivity = new Date();
      
      const info = client.info;
      
      await prisma.whatsAppSession.update({
        where: { tenantId },
        data: {
          status: 'CONNECTED',
          phone: info?.wid?.user || null,
          pushName: info?.pushname || null,
          connectedAt: new Date()
        }
      });
      
      this.emit('ready', { tenantId, phone: info?.wid?.user });
      console.log(`[WhatsApp ${tenantId}] Conectado: ${info?.wid?.user}`);
      
      // Iniciar procesamiento de cola
      this.processMessageQueue(tenantId);
      
      // Programar desconexión automática si está habilitada
      this.scheduleAutoDisconnect(tenantId);
    });
    
    // Evento mensaje recibido
    client.on('message', async (message: Message) => {
      await this.handleIncomingMessage(tenantId, message);
    });
    
    // Evento desconectado
    client.on('disconnected', async (reason) => {
      instance.status = 'DISCONNECTED';
      
      await prisma.whatsAppSession.update({
        where: { tenantId },
        data: {
          status: 'DISCONNECTED',
          disconnectedAt: new Date()
        }
      });
      
      this.emit('disconnected', { tenantId, reason });
      console.log(`[WhatsApp ${tenantId}] Desconectado: ${reason}`);
      
      // Limpiar recursos
      this.instances.delete(tenantId);
    });
    
    // Evento error de autenticación
    client.on('auth_failure', async (msg) => {
      instance.status = 'DISCONNECTED';
      
      await prisma.whatsAppSession.update({
        where: { tenantId },
        data: { status: 'DISCONNECTED' }
      });
      
      console.error(`[WhatsApp ${tenantId}] Error de autenticación:`, msg);
    });
    
    // Inicializar cliente
    try {
      await client.initialize();
      return { status: instance.status, qrCode: instance.qrCode || undefined };
    } catch (error) {
      console.error(`[WhatsApp ${tenantId}] Error inicializando:`, error);
      this.instances.delete(tenantId);
      throw error;
    }
  }
  
  /**
   * Manejar mensaje entrante
   */
  private async handleIncomingMessage(tenantId: string, message: Message): Promise<void> {
    try {
      const session = await prisma.whatsAppSession.findUnique({
        where: { tenantId }
      });
      
      if (!session) return;
      
      // Registrar mensaje
      await prisma.whatsAppMessageLog.create({
        data: {
          sessionId: session.id,
          direction: 'IN',
          phone: message.from.replace('@c.us', ''),
          message: message.body,
          messageType: message.type
        }
      });
      
      // Actualizar contador
      await prisma.whatsAppSession.update({
        where: { tenantId },
        data: { totalMessagesReceived: { increment: 1 } }
      });
      
      // Respuesta automática si está habilitada
      if (session.autoReplyEnabled && session.autoReplyMessage) {
        await this.sendMessage(tenantId, message.from.replace('@c.us', ''), session.autoReplyMessage);
      }
      
      this.emit('message', { tenantId, message: message.body, from: message.from });
    } catch (error) {
      console.error(`[WhatsApp ${tenantId}] Error procesando mensaje:`, error);
    }
  }
  
  /**
   * Enviar mensaje con protección anti-ban
   */
  async sendMessage(
    tenantId: string, 
    phone: string, 
    message: string,
    options?: { appointmentId?: string; isReminder?: boolean }
  ): Promise<boolean> {
    const instance = this.instances.get(tenantId);
    
    if (!instance || instance.status !== 'CONNECTED') {
      console.log(`[WhatsApp ${tenantId}] No conectado, encolando mensaje`);
      // Si no está conectado, intentar reconectar
      const canReconnect = await this.tryAutoReconnect(tenantId);
      if (!canReconnect) {
        throw new Error('WhatsApp no conectado y no se puede reconectar automáticamente');
      }
    }
    
    // Verificar límite diario
    const session = await prisma.whatsAppSession.findUnique({
      where: { tenantId }
    });
    
    if (session?.dailyLimitReached) {
      throw new Error('Límite diario de mensajes alcanzado');
    }
    
    // Encolar mensaje
    return new Promise((resolve, reject) => {
      const queuedMessage: QueuedMessage = {
        phone,
        message,
        appointmentId: options?.appointmentId,
        isReminder: options?.isReminder || false,
        resolve,
        reject
      };
      
      instance!.messageQueue.push(queuedMessage);
      
      // Iniciar procesamiento si no está activo
      if (!instance!.isProcessingQueue) {
        this.processMessageQueue(tenantId);
      }
    });
  }
  
  /**
   * Procesar cola de mensajes con delays anti-ban
   */
  private async processMessageQueue(tenantId: string): Promise<void> {
    const instance = this.instances.get(tenantId);
    if (!instance || instance.isProcessingQueue) return;
    
    instance.isProcessingQueue = true;
    
    while (instance.messageQueue.length > 0 && instance.status === 'CONNECTED') {
      const queuedMessage = instance.messageQueue.shift();
      if (!queuedMessage) continue;
      
      try {
        // Verificar horario de operación
        if (!this.isOperatingHours()) {
          console.log(`[WhatsApp ${tenantId}] Fuera de horario de operación`);
          queuedMessage.reject(new Error('Fuera de horario de operación'));
          continue;
        }
        
        // Verificar burst limit
        const now = new Date();
        if (now.getTime() - instance.lastBurstReset.getTime() > ANTI_BAN_CONFIG.burstCooldown) {
          instance.burstCount = 0;
          instance.lastBurstReset = now;
        }
        
        if (instance.burstCount >= ANTI_BAN_CONFIG.burstLimit) {
          console.log(`[WhatsApp ${tenantId}] Burst limit alcanzado, esperando cooldown...`);
          await this.sleep(ANTI_BAN_CONFIG.burstCooldown);
          instance.burstCount = 0;
          instance.lastBurstReset = new Date();
        }
        
        // Formatear número
        const formattedPhone = this.formatPhone(queuedMessage.phone);
        const chat = await instance.client.getChatById(formattedPhone);
        
        // Simular escritura (typing)
        await chat.sendStateTyping();
        const typingDelay = this.getRandomDelay(
          ANTI_BAN_CONFIG.minTypingDelay,
          ANTI_BAN_CONFIG.maxTypingDelay
        );
        await this.sleep(typingDelay);
        
        // Enviar mensaje
        await chat.sendMessage(queuedMessage.message);
        
        // Registrar en BD
        const session = await prisma.whatsAppSession.findUnique({
          where: { tenantId }
        });
        
        if (session) {
          await prisma.whatsAppMessageLog.create({
            data: {
              sessionId: session.id,
              direction: 'OUT',
              phone: queuedMessage.phone,
              message: queuedMessage.message,
              appointmentId: queuedMessage.appointmentId,
              isReminder: queuedMessage.isReminder,
              status: 'sent'
            }
          });
          
          // Actualizar contadores
          const newCount = session.dailyMessageCount + 1;
          await prisma.whatsAppSession.update({
            where: { tenantId },
            data: {
              totalMessagesSent: { increment: 1 },
              dailyMessageCount: newCount,
              lastMessageAt: new Date(),
              dailyLimitReached: newCount >= ANTI_BAN_CONFIG.dailyMessageLimit
            }
          });
        }
        
        instance.burstCount++;
        instance.lastActivity = new Date();
        
        console.log(`[WhatsApp ${tenantId}] Mensaje enviado a ${queuedMessage.phone}`);
        queuedMessage.resolve(true);
        
        // Delay antes del siguiente mensaje
        if (instance.messageQueue.length > 0) {
          const delay = this.getRandomDelay(
            ANTI_BAN_CONFIG.minDelay,
            ANTI_BAN_CONFIG.maxDelay
          );
          console.log(`[WhatsApp ${tenantId}] Esperando ${delay}ms antes del siguiente mensaje...`);
          await this.sleep(delay);
        }
        
      } catch (error) {
        console.error(`[WhatsApp ${tenantId}] Error enviando mensaje:`, error);
        queuedMessage.reject(error);
      }
    }
    
    instance.isProcessingQueue = false;
  }
  
  /**
   * Programar desconexión automática
   */
  private async scheduleAutoDisconnect(tenantId: string): Promise<void> {
    const session = await prisma.whatsAppSession.findUnique({
      where: { tenantId }
    });
    
    if (!session?.autoConnectEnabled || !session?.disconnectAt) return;
    
    const [hours, minutes] = session.disconnectAt.split(':').map(Number);
    const now = new Date();
    let disconnectTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0
    );
    
    // Si ya pasó la hora, programar para mañana
    if (disconnectTime <= now) {
      disconnectTime.setDate(disconnectTime.getDate() + 1);
    }
    
    const timeUntilDisconnect = disconnectTime.getTime() - now.getTime();
    
    console.log(`[WhatsApp ${tenantId}] Desconexión programada en ${Math.round(timeUntilDisconnect / 60000)} minutos`);
    
    // Limpiar timer anterior
    const existingTimer = this.reconnectTimers.get(tenantId);
    if (existingTimer) clearTimeout(existingTimer);
    
    const timer = setTimeout(async () => {
      console.log(`[WhatsApp ${tenantId}] Ejecutando desconexión automática`);
      await this.disconnectClient(tenantId, true);
    }, timeUntilDisconnect);
    
    this.reconnectTimers.set(tenantId, timer);
  }
  
  /**
   * Intentar reconexión automática
   */
  private async tryAutoReconnect(tenantId: string): Promise<boolean> {
    const session = await prisma.whatsAppSession.findUnique({
      where: { tenantId }
    });
    
    if (!session?.autoConnectEnabled) return false;
    
    // Verificar si estamos en horario de operación
    if (!this.isOperatingHours()) {
      console.log(`[WhatsApp ${tenantId}] No se reconecta fuera de horario`);
      return false;
    }
    
    // Verificar hora de conexión
    if (session.connectAt) {
      const [hours] = session.connectAt.split(':').map(Number);
      const currentHour = new Date().getHours();
      
      if (currentHour < hours) {
        console.log(`[WhatsApp ${tenantId}] Aún no es hora de conectar`);
        return false;
      }
    }
    
    console.log(`[WhatsApp ${tenantId}] Intentando reconexión automática...`);
    
    try {
      await this.initializeClient(tenantId);
      return true;
    } catch (error) {
      console.error(`[WhatsApp ${tenantId}] Error en reconexión:`, error);
      return false;
    }
  }
  
  /**
   * Desconectar cliente
   */
  async disconnectClient(tenantId: string, isSleeping: boolean = false): Promise<void> {
    const instance = this.instances.get(tenantId);
    if (!instance) return;
    
    try {
      await instance.client.destroy();
    } catch (error) {
      console.error(`[WhatsApp ${tenantId}] Error destruyendo cliente:`, error);
    }
    
    this.instances.delete(tenantId);
    
    await prisma.whatsAppSession.update({
      where: { tenantId },
      data: {
        status: isSleeping ? 'SLEEPING' : 'DISCONNECTED',
        disconnectedAt: new Date()
      }
    });
    
    console.log(`[WhatsApp ${tenantId}] Desconectado ${isSleeping ? '(sleeping)' : ''}`);
    
    // Programar reconexión si está en modo sleeping
    if (isSleeping) {
      await this.scheduleAutoReconnect(tenantId);
    }
  }
  
  /**
   * Programar reconexión automática
   */
  private async scheduleAutoReconnect(tenantId: string): Promise<void> {
    const session = await prisma.whatsAppSession.findUnique({
      where: { tenantId }
    });
    
    if (!session?.autoConnectEnabled || !session?.connectAt) return;
    
    const [hours, minutes] = session.connectAt.split(':').map(Number);
    const now = new Date();
    let connectTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0
    );
    
    // Si ya pasó la hora, programar para mañana
    if (connectTime <= now) {
      connectTime.setDate(connectTime.getDate() + 1);
    }
    
    const timeUntilConnect = connectTime.getTime() - now.getTime();
    
    console.log(`[WhatsApp ${tenantId}] Reconexión programada en ${Math.round(timeUntilConnect / 60000)} minutos`);
    
    const timer = setTimeout(async () => {
      console.log(`[WhatsApp ${tenantId}] Ejecutando reconexión automática`);
      await this.initializeClient(tenantId);
    }, timeUntilConnect);
    
    this.reconnectTimers.set(tenantId, timer);
  }
  
  /**
   * Destruir cliente completamente
   */
  async destroyClient(tenantId: string): Promise<void> {
    const instance = this.instances.get(tenantId);
    if (instance) {
      try {
        await instance.client.destroy();
      } catch (error) {
        console.error(`[WhatsApp ${tenantId}] Error destruyendo:`, error);
      }
      this.instances.delete(tenantId);
    }
    
    // Limpiar timer
    const timer = this.reconnectTimers.get(tenantId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(tenantId);
    }
  }
  
  /**
   * Obtener estado de la sesión
   */
  async getStatus(tenantId: string): Promise<{
    status: WhatsAppStatus;
    phone?: string;
    qrCode?: string;
    dailyMessageCount: number;
    dailyLimitReached: boolean;
    isOperatingHours: boolean;
  }> {
    const session = await prisma.whatsAppSession.findUnique({
      where: { tenantId }
    });
    
    const instance = this.instances.get(tenantId);
    
    return {
      status: session?.status || 'DISCONNECTED',
      phone: session?.phone || undefined,
      qrCode: instance?.qrCode || undefined,
      dailyMessageCount: session?.dailyMessageCount || 0,
      dailyLimitReached: session?.dailyLimitReached || false,
      isOperatingHours: this.isOperatingHours()
    };
  }
  
  /**
   * Obtener QR code actual
   */
  getQRCode(tenantId: string): string | null {
    const instance = this.instances.get(tenantId);
    return instance?.qrCode || null;
  }
  
  /**
   * Actualizar configuración
   */
  async updateConfig(tenantId: string, config: {
    autoConnectEnabled?: boolean;
    connectAt?: string;
    disconnectAt?: string;
    reminderEnabled?: boolean;
    reminder24hEnabled?: boolean;
    reminder1hEnabled?: boolean;
    reminderMessage24h?: string;
    reminderMessage1h?: string;
    autoReplyEnabled?: boolean;
    autoReplyMessage?: string;
  }): Promise<void> {
    await prisma.whatsAppSession.update({
      where: { tenantId },
      data: config
    });
    
    // Re-programar timers si cambió la configuración de auto-connect
    if (config.autoConnectEnabled !== undefined || config.connectAt || config.disconnectAt) {
      const instance = this.instances.get(tenantId);
      if (instance?.status === 'CONNECTED') {
        await this.scheduleAutoDisconnect(tenantId);
      }
    }
  }
  
  /**
   * Resetear contador diario (llamar a medianoche)
   */
  async resetDailyCounters(): Promise<void> {
    await prisma.whatsAppSession.updateMany({
      data: {
        dailyMessageCount: 0,
        dailyLimitReached: false
      }
    });
    console.log('[WhatsApp] Contadores diarios reseteados');
  }
  
  /**
   * Obtener sesión de BD
   */
  async getSession(tenantId: string) {
    return prisma.whatsAppSession.findUnique({
      where: { tenantId }
    });
  }
  
  /**
   * Obtener logs de mensajes
   */
  async getMessageLogs(tenantId: string, options?: {
    limit?: number;
    offset?: number;
    direction?: 'IN' | 'OUT';
  }) {
    const session = await prisma.whatsAppSession.findUnique({
      where: { tenantId }
    });
    
    if (!session) return [];
    
    return prisma.whatsAppMessageLog.findMany({
      where: {
        sessionId: session.id,
        ...(options?.direction && { direction: options.direction })
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0
    });
  }
}

// Singleton
export const whatsappService = new WhatsAppService();
