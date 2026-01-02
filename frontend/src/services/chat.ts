import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  type?: 'text' | 'audio' | 'image';
  mediaUrl?: string;
}

export interface ChatAction {
  action: 'create' | 'cancel' | 'reschedule' | 'query' | 'create_client';
  params: any;
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

  // Enviar audio para transcripción y procesamiento
  sendAudio: async (audioBlob: Blob, conversationHistory: ChatMessage[] = []): Promise<ChatResponse> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    formData.append('conversationHistory', JSON.stringify(conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))));

    const response = await api.post('/chat/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Enviar imagen para análisis
  sendImage: async (imageFile: File, prompt: string, conversationHistory: ChatMessage[] = []): Promise<ChatResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('prompt', prompt);
    formData.append('conversationHistory', JSON.stringify(conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))));

    const response = await api.post('/chat/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
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
