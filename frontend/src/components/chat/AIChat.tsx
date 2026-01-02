import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  CheckIcon,
  XCircleIcon,
  MicrophoneIcon,
  PhotoIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import { chatService, ChatMessage, ChatAction } from '@/services/chat';

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<ChatAction | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Verificar si el usuario tiene acceso al chat
  const { data: hasAccess, isLoading: checkingAccess } = useQuery({
    queryKey: ['chat-access'],
    queryFn: chatService.checkAccess,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus en input al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Si no tiene acceso, no mostrar el chat
  if (checkingAccess || !hasAccess) {
    return null;
  }

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setPendingAction(null);

    try {
      const response = await chatService.sendMessage(userMessage.content, messages);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Si hay una acción pendiente, guardarla
      if (response.action && response.action.action !== 'query') {
        setPendingAction(response.action);
      }
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ Error al procesar tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    setIsLoading(true);
    try {
      const result = await chatService.executeAction(pendingAction);

      const resultMessage: ChatMessage = {
        role: 'assistant',
        content: result,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, resultMessage]);
      setPendingAction(null);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ Error al ejecutar la acción.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAction = () => {
    setPendingAction(null);
    const cancelMessage: ChatMessage = {
      role: 'assistant',
      content: '✓ Acción cancelada. ¿En qué más puedo ayudarte?',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Iniciar grabación de audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // Enviar audio al backend
        await handleSendAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ No se pudo acceder al micrófono. Verifica los permisos del navegador.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Detener grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Enviar audio
  const handleSendAudio = async (audioBlob: Blob) => {
    const userMessage: ChatMessage = {
      role: 'user',
      content: '🎤 Mensaje de voz enviado',
      timestamp: new Date(),
      type: 'audio',
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setPendingAction(null);

    try {
      const response = await chatService.sendAudio(audioBlob, messages);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (response.action && response.action.action !== 'query') {
        setPendingAction(response.action);
      }
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ Error al procesar el audio. Por favor intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar selección de imagen
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ Por favor selecciona un archivo de imagen válido.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Crear preview de la imagen
    const imageUrl = URL.createObjectURL(file);

    const userMessage: ChatMessage = {
      role: 'user',
      content: '📷 Imagen enviada',
      timestamp: new Date(),
      type: 'image',
      mediaUrl: imageUrl,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setPendingAction(null);

    try {
      const response = await chatService.sendImage(file, 'Analiza esta imagen', messages);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (response.action && response.action.action !== 'query') {
        setPendingAction(response.action);
      }
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ Error al procesar la imagen. Por favor intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Formatear tiempo de grabación
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[550px] bg-dark-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-dark-800 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-accent-500 to-purple-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-white" />
              <span className="font-semibold text-white">Asistente IA</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-8">
                <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-accent-400" />
                <p className="font-medium text-white">¡Hola! Soy tu asistente de citas</p>
                <p className="text-sm mt-2">
                  Puedo ayudarte a consultar, crear, cancelar o reagendar citas.
                </p>
                <div className="mt-4 space-y-2 text-xs">
                  <p className="text-gray-500">Prueba preguntando:</p>
                  <button
                    onClick={() => setMessage('Quiero agendar una cita')}
                    className="block w-full text-left px-3 py-2 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors text-gray-300"
                  >
                    "Quiero agendar una cita"
                  </button>
                  <button
                    onClick={() => setMessage('¿Cuáles son las citas de hoy?')}
                    className="block w-full text-left px-3 py-2 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors text-gray-300"
                  >
                    "¿Cuáles son las citas de hoy?"
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-accent-500 to-purple-600 text-white'
                      : 'bg-dark-800 text-gray-100'
                  }`}
                >
                  {msg.type === 'image' && msg.mediaUrl && (
                    <img 
                      src={msg.mediaUrl} 
                      alt="Imagen enviada" 
                      className="rounded-lg mb-2 max-w-full max-h-48 object-cover"
                    />
                  )}
                  {msg.type === 'audio' && (
                    <div className="flex items-center gap-2 mb-1">
                      <MicrophoneIcon className="w-4 h-4" />
                      <span className="text-xs opacity-80">Audio transcrito</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-dark-800 px-4 py-3 rounded-2xl">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Pending Action Confirmation */}
          {pendingAction && (
            <div className="px-4 py-3 bg-amber-500/10 border-t border-amber-500/30">
              <p className="text-sm text-amber-400 mb-2">
                ¿Confirmar esta acción?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmAction}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-primary-500 text-dark-950 rounded-lg text-sm font-medium hover:bg-primary-400 transition-colors disabled:opacity-50"
                >
                  <CheckIcon className="w-4 h-4" />
                  Confirmar
                </button>
                <button
                  onClick={handleCancelAction}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  <XCircleIcon className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-dark-800">
            {/* Recording indicator */}
            {isRecording && (
              <div className="flex items-center justify-center gap-3 mb-3 py-2 bg-red-500/10 rounded-lg border border-red-500/30">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 font-medium">{formatTime(recordingTime)}</span>
                <button
                  onClick={stopRecording}
                  className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                >
                  <StopIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex gap-2 items-center">
              {/* Image upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isRecording}
                className="p-2 text-gray-500 hover:text-accent-400 hover:bg-dark-800 rounded-full transition-colors disabled:opacity-50"
                title="Enviar imagen"
              >
                <PhotoIcon className="w-5 h-5" />
              </button>

              {/* Audio record button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={`p-2 rounded-full transition-colors ${
                  isRecording 
                    ? 'text-red-500 bg-red-500/20' 
                    : 'text-gray-500 hover:text-accent-400 hover:bg-dark-800'
                } disabled:opacity-50`}
                title={isRecording ? 'Detener grabación' : 'Grabar audio'}
              >
                <MicrophoneIcon className="w-5 h-5" />
              </button>

              {/* Text input */}
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                disabled={isLoading || isRecording}
                className="flex-1 px-4 py-2 bg-dark-800 border border-dark-700 rounded-full text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/50 disabled:opacity-50"
              />

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!message.trim() || isLoading || isRecording}
                className="p-2 bg-gradient-to-r from-accent-500 to-purple-600 rounded-full text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-accent-500 to-purple-600 rounded-full shadow-lg shadow-accent-500/30 flex items-center justify-center text-white hover:scale-105 hover:shadow-accent-500/50 transition-all z-50"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
        )}
      </button>
    </>
  );
}
