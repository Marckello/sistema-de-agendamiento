import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  tenantName: string;
  tenantSubdomain: string;
  phone?: string;
}

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await registerUser({
        // Datos del negocio
        name: data.tenantName,
        slug: data.tenantSubdomain,
        email: data.email, // Email del negocio
        phone: data.phone,
        // Datos del admin
        adminEmail: data.email,
        adminPassword: data.password,
        adminFirstName: data.firstName,
        adminLastName: data.lastName,
        adminPhone: data.phone,
      });
    } catch (error) {
      // Error is handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 30);
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Crear Cuenta
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Regístrate para comenzar a gestionar tus citas
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="label">
              Nombre
            </label>
            <input
              id="firstName"
              type="text"
              {...register('firstName', {
                required: 'El nombre es requerido',
              })}
              className={`input ${errors.firstName ? 'input-error' : ''}`}
              placeholder="Juan"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="label">
              Apellido
            </label>
            <input
              id="lastName"
              type="text"
              {...register('lastName', {
                required: 'El apellido es requerido',
              })}
              className={`input ${errors.lastName ? 'input-error' : ''}`}
              placeholder="Pérez"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
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
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="label">
            Teléfono (opcional)
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            className="input"
            placeholder="+1 234 567 8900"
          />
        </div>

        <div>
          <label htmlFor="tenantName" className="label">
            Nombre de tu negocio
          </label>
          <input
            id="tenantName"
            type="text"
            {...register('tenantName', {
              required: 'El nombre del negocio es requerido',
              onChange: (e) => {
                const subdomain = generateSubdomain(e.target.value);
                setValue('tenantSubdomain', subdomain, { shouldValidate: true });
              },
            })}
            className={`input ${errors.tenantName ? 'input-error' : ''}`}
            placeholder="Mi Clínica"
          />
          {errors.tenantName && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.tenantName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="tenantSubdomain" className="label">
            Subdominio
          </label>
          <div className="flex items-center">
            <input
              id="tenantSubdomain"
              type="text"
              {...register('tenantSubdomain', {
                required: 'El subdominio es requerido',
                pattern: {
                  value: /^[a-z0-9]+$/,
                  message: 'Solo letras minúsculas y números',
                },
                minLength: {
                  value: 3,
                  message: 'Mínimo 3 caracteres',
                },
              })}
              className={`input rounded-r-none ${errors.tenantSubdomain ? 'input-error' : ''}`}
              placeholder="miclinica"
            />
            <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm rounded-r-md">
              .serrano.marketing
            </span>
          </div>
          {errors.tenantSubdomain && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.tenantSubdomain.message}
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
              autoComplete="new-password"
              {...register('password', {
                required: 'La contraseña es requerida',
                minLength: {
                  value: 8,
                  message: 'La contraseña debe tener al menos 8 caracteres',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Debe incluir mayúscula, minúscula y número',
                },
              })}
              className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('confirmPassword', {
                required: 'Confirma tu contraseña',
                validate: (value) =>
                  value === password || 'Las contraseñas no coinciden',
              })}
              className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex items-start">
          <input
            id="terms"
            type="checkbox"
            required
            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
          />
          <label
            htmlFor="terms"
            className="ml-2 text-sm text-gray-600 dark:text-gray-400"
          >
            Acepto los{' '}
            <a href="#" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
              términos y condiciones
            </a>{' '}
            y la{' '}
            <a href="#" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
              política de privacidad
            </a>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary py-3"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              Creando cuenta...
            </span>
          ) : (
            'Crear Cuenta'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        ¿Ya tienes una cuenta?{' '}
        <Link
          to="/login"
          className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
