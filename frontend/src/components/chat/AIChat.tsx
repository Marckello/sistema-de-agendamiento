import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  CheckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { chatService, ChatMessage, ChatAction } from '@/services/chat';

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<ChatAction | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3 flex items-center justify-between">
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
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                <p className="font-medium">¡Hola! Soy tu asistente de citas</p>
                <p className="text-sm mt-2">
                  Puedo ayudarte a consultar, crear, cancelar o reagendar citas.
                </p>
                <div className="mt-4 space-y-2 text-xs">
                  <p className="text-gray-400">Prueba preguntando:</p>
                  <button
                    onClick={() => setMessage('¿Cuáles son las citas de hoy?')}
                    className="block w-full text-left px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    "¿Cuáles son las citas de hoy?"
                  </button>
                  <button
                    onClick={() => setMessage('¿Cuántas citas tengo esta semana?')}
                    className="block w-full text-left px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    "¿Cuántas citas tengo esta semana?"
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
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Pending Action Confirmation */}
          {pendingAction && (
            <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                ¿Confirmar esta acción?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmAction}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <CheckIcon className="w-4 h-4" />
                  Confirmar
                </button>
                <button
                  onClick={handleCancelAction}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <XCircleIcon className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-white hover:opacity-90 transition-opacity disabled:opacity-50"
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform z-50"
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
