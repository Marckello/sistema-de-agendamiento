import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { EyeIcon, EyeSlashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Turnstile from '@/components/Turnstile';
import { toast } from 'react-hot-toast';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken(null);
    toast.error('Error de verificación. Por favor recarga la página.');
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      toast.error('Por favor completa la verificación de seguridad');
      return;
    }

    setIsLoading(true);
    try {
      await login({ ...data, turnstileToken: turnstileToken || undefined });
    } catch (error) {
      // Error is handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center">
          <SparklesIcon className="w-7 h-7 text-dark-950" />
        </div>
        <span className="text-2xl font-bold text-white">CitasPro</span>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">
          <span className="gradient-text">Bienvenido de vuelta</span>
        </h2>
        <p className="mt-2 text-gray-500">
          Ingresa a tu cuenta para continuar
        </p>
      </div>

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
            placeholder="tu@email.com"
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
                minLength: {
                  value: 6,
                  message: 'La contraseña debe tener al menos 6 caracteres',
                },
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ToggleSwitch
              checked={rememberMe}
              onChange={setRememberMe}
              size="sm"
            />
            <span className="text-sm text-gray-400">Recordarme</span>
          </div>

          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
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
          className="w-full btn-primary py-3.5 text-base"
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
              Iniciando sesión...
            </span>
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dark-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-dark-950 text-gray-600">
              ¿No tienes una cuenta?
            </span>
          </div>
        </div>

        <Link
          to="/register"
          className="mt-4 w-full btn-secondary py-3 text-center block"
        >
          Crear cuenta gratis
        </Link>
      </div>
    </div>
  );
}
