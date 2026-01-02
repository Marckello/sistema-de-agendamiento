import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatAction {
  action: 'create' | 'cancel' | 'reschedule' | 'query';
  details: any;
  confirmation?: string;
}

export interface ChatResponse {
  response: string;
  action?: ChatAction;
}

export const chatService = {
  // Enviar mensaje al chat
  sendMessage: async (message: string, conversationHistory: ChatMessage[] = []): Promise<ChatResponse> => {
    const response = await api.post('/chat', {
      message,
      conversationHistory: conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });
    return response.data.data;
  },

  // Ejecutar una acción confirmada
  executeAction: async (action: ChatAction): Promise<string> => {
    const response = await api.post('/chat/execute', { action });
    return response.data.data.result;
  },

  // Verificar acceso al chat
  checkAccess: async (): Promise<boolean> => {
    try {
      const response = await api.get('/chat/access');
      return response.data.data.canUseAI;
    } catch {
      return false;
    }
  },
};

export default chatService;
