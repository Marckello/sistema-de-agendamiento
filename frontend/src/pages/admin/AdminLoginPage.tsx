import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import api from '@/services/api';
import { toast } from 'react-hot-toast';
import Turnstile from '@/components/Turnstile';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

interface AdminLoginFormData {
  email: string;
  password: string;
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>();

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken(null);
    toast.error('Error de verificación. Por favor recarga la página.');
  }, []);

  const onSubmit = async (data: AdminLoginFormData) => {
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      toast.error('Por favor completa la verificación de seguridad');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login/admin', {
        ...data,
        turnstileToken,
      });
      
      const { admin, tokens } = response.data.data;
      
      // Guardar tokens
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      
      // Guardar info de platform admin
      localStorage.setItem('isPlatformAdmin', 'true');
      
      toast.success(`¡Bienvenido, ${admin.firstName}!`);
      navigate('/admin');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Credenciales inválidas';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-xl bg-purple-500 flex items-center justify-center">
            <ShieldCheckIcon className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Panel de Administración
          </h2>
          <p className="text-gray-400">
            Acceso exclusivo para administradores de la plataforma
          </p>
        </div>

        <div className="bg-dark-800 rounded-2xl p-8 border border-dark-700 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email', {
                  required: 'El correo es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Correo electrónico inválido',
                  },
                })}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="admin@citaspro.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password', {
                    required: 'La contraseña es requerida',
                  })}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Cloudflare Turnstile */}
            {TURNSTILE_SITE_KEY && (
              <Turnstile
                siteKey={TURNSTILE_SITE_KEY}
                onVerify={handleTurnstileVerify}
                onError={handleTurnstileError}
                onExpire={() => setTurnstileToken(null)}
              />
            )}

            <button
              type="submit"
              disabled={isLoading || (TURNSTILE_SITE_KEY && !turnstileToken)}
              className="w-full py-3.5 text-base font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Verificando...
                </span>
              ) : (
                'Acceder al Panel'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Este acceso es exclusivo para administradores de CitasPro.
        </p>
      </div>
    </div>
  );
}
