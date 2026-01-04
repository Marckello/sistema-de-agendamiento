import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/config/firebase';
import verificationService from '@/services/verification';
import { useAuth } from '@/context/AuthContext';

// Declarar tipo global para window
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
    confirmationResult: ConfirmationResult | null;
  }
}

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  tenantName: string;
  tenantSubdomain: string;
  phone?: string;
  countryCode?: string;
}

// Lista de países con códigos telefónicos
const COUNTRY_CODES = [
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'México' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'Estados Unidos' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'España' },
  { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: '+51', country: 'PE', flag: '🇵🇪', name: 'Perú' },
  { code: '+58', country: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+593', country: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+502', country: 'GT', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+503', country: 'SV', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+504', country: 'HN', flag: '🇭🇳', name: 'Honduras' },
  { code: '+505', country: 'NI', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+506', country: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+507', country: 'PA', flag: '🇵🇦', name: 'Panamá' },
];

type RegistrationStep = 'form' | 'verify-email' | 'verify-phone' | 'complete';

export default function RegisterPage() {
  const navigate = useNavigate();
  useAuth(); // Verificar que el contexto esté disponible
  const [step, setStep] = useState<RegistrationStep>('form');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [registrationPhone, setRegistrationPhone] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+52'); // México por defecto
  const [emailCode, setEmailCode] = useState(['', '', '', '', '', '']);
  const [phoneCode, setPhoneCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [, setNeedsPhoneVerification] = useState(false);
  
  const emailInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  // Countdown timer para reenviar código
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Configurar reCAPTCHA para verificación de teléfono
  const setupRecaptcha = useCallback(() => {
    if (!recaptchaContainerRef.current) return;
    
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier = null;
      }
      
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          window.recaptchaVerifier = null;
        }
      });
    } catch (error) {
      console.error('Error setting up reCAPTCHA:', error);
    }
  }, []);

  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 30);
  };

  // Paso 1: Enviar formulario de registro
  const onSubmitForm = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Formatear teléfono completo con código de país
      const fullPhone = data.phone ? `${selectedCountryCode}${data.phone.replace(/\D/g, '')}` : '';
      
      const response = await verificationService.initiateRegistration({
        name: data.tenantName,
        slug: data.tenantSubdomain,
        email: data.email,
        phone: fullPhone,
        adminEmail: data.email,
        adminPassword: data.password,
        adminFirstName: data.firstName,
        adminLastName: data.lastName,
        adminPhone: fullPhone,
      });

      if (response.success) {
        setRegistrationEmail(data.email);
        setRegistrationPhone(fullPhone);
        setNeedsPhoneVerification(response.data?.requiresPhoneVerification || false);
        setStep('verify-email');
        setCountdown(60);
        toast.success('Código de verificación enviado a tu correo');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al iniciar registro');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar input de código (email o phone)
  const handleCodeInput = (
    index: number,
    value: string,
    codeArray: string[],
    setCodeArray: React.Dispatch<React.SetStateAction<string[]>>,
    inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (value.length > 1) {
      // Si se pega un código completo
      const pastedCode = value.slice(0, 6).split('');
      const newCode = [...codeArray];
      pastedCode.forEach((char, i) => {
        if (i < 6) newCode[i] = char;
      });
      setCodeArray(newCode);
      inputRefs.current[5]?.focus();
      return;
    }

    const newCode = [...codeArray];
    newCode[index] = value;
    setCodeArray(newCode);

    // Mover al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    codeArray: string[],
    _setCodeArray: React.Dispatch<React.SetStateAction<string[]>>,
    inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === 'Backspace' && !codeArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Paso 2: Verificar código de email
  const handleVerifyEmail = async () => {
    const code = emailCode.join('');
    if (code.length !== 6) {
      toast.error('Ingresa el código completo');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verificationService.verifyEmailCode(registrationEmail, code);

      if (response.success) {
        toast.success('Email verificado correctamente');
        
        if (response.data?.needsPhoneVerification && registrationPhone) {
          setStep('verify-phone');
          // Configurar reCAPTCHA y enviar SMS
          setTimeout(() => {
            setupRecaptcha();
            sendPhoneVerification();
          }, 500);
        } else {
          // Completar registro sin verificación de teléfono
          await completeRegistration(false);
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Código incorrecto';
      const remaining = error.response?.data?.remainingAttempts;
      toast.error(remaining !== undefined ? `${message}. Intentos restantes: ${remaining}` : message);
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar SMS de verificación con Firebase
  const sendPhoneVerification = async () => {
    if (!registrationPhone) return;

    try {
      // El número ya viene formateado con código de país desde el formulario
      const phoneNumber = registrationPhone;
      
      // Validar formato E.164 (debe empezar con + y tener entre 10-15 dígitos)
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      if (!phoneNumber.startsWith('+') || digitsOnly.length < 10 || digitsOnly.length > 15) {
        toast.error('Número de teléfono inválido. Verifica el formato.');
        return;
      }
      
      console.log('Phone number for SMS:', phoneNumber);

      if (!window.recaptchaVerifier) {
        setupRecaptcha();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const appVerifier = window.recaptchaVerifier!;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;

      // Guardar el ID de verificación en el backend
      await verificationService.savePhoneVerificationId(registrationEmail, confirmationResult.verificationId);
      
      toast.success('Código SMS enviado');
      setCountdown(60);
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      toast.error('Error al enviar SMS: ' + (error.message || 'Intenta de nuevo'));
      // Permitir continuar sin verificación de teléfono
      setNeedsPhoneVerification(false);
    }
  };

  // Paso 3: Verificar código de teléfono
  const handleVerifyPhone = async () => {
    const code = phoneCode.join('');
    if (code.length !== 6) {
      toast.error('Ingresa el código completo');
      return;
    }

    setIsLoading(true);
    try {
      // Verificar con Firebase
      if (window.confirmationResult) {
        await window.confirmationResult.confirm(code);
        toast.success('Teléfono verificado');
        await completeRegistration(true);
      } else {
        toast.error('Error de verificación. Intenta de nuevo.');
      }
    } catch (error: any) {
      console.error('Error verifying phone:', error);
      toast.error('Código incorrecto');
    } finally {
      setIsLoading(false);
    }
  };

  // Completar registro
  const completeRegistration = async (phoneVerified: boolean) => {
    setIsLoading(true);
    try {
      let response;
      if (phoneVerified) {
        response = await verificationService.completeWithPhone(registrationEmail, true);
      } else {
        response = await verificationService.completeEmailOnly(registrationEmail);
      }

      if (response.success && response.data) {
        setStep('complete');
        toast.success('¡Cuenta creada exitosamente!');
        
        // Guardar tokens y redirigir
        if (response.data.tokens) {
          localStorage.setItem('accessToken', response.data.tokens.accessToken);
          localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
          
          // Esperar un momento y redirigir
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al completar registro');
    } finally {
      setIsLoading(false);
    }
  };

  // Reenviar código de email
  const resendEmailCode = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    try {
      await verificationService.resendEmailCode(registrationEmail);
      setCountdown(60);
      setEmailCode(['', '', '', '', '', '']);
      toast.success('Nuevo código enviado');
    } catch (error: any) {
      toast.error('Error al reenviar código');
    } finally {
      setIsLoading(false);
    }
  };

  // Omitir verificación de teléfono
  const skipPhoneVerification = async () => {
    await completeRegistration(false);
  };

  // Renderizar código de entrada
  const renderCodeInput = (
    codeArray: string[],
    setCodeArray: React.Dispatch<React.SetStateAction<string[]>>,
    inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    _onComplete?: () => void
  ) => (
    <div className="flex justify-center gap-2 mb-6">
      {codeArray.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digit}
          onChange={(e) => handleCodeInput(index, e.target.value.replace(/\D/g, ''), codeArray, setCodeArray, inputRefs)}
          onKeyDown={(e) => handleCodeKeyDown(index, e, codeArray, setCodeArray, inputRefs)}
          className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
        />
      ))}
    </div>
  );

  // Paso: Formulario de registro
  if (step === 'form') {
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

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
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
              Teléfono <span className="text-gray-400">(para verificación SMS)</span>
            </label>
            <div className="flex">
              <select
                value={selectedCountryCode}
                onChange={(e) => setSelectedCountryCode(e.target.value)}
                className="input rounded-r-none border-r-0 w-28 flex-shrink-0"
              >
                {COUNTRY_CODES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>
              <input
                id="phone"
                type="tel"
                {...register('phone', {
                  pattern: {
                    value: /^\d{10}$/,
                    message: 'Ingresa exactamente 10 dígitos'
                  }
                })}
                className="input rounded-l-none flex-1"
                placeholder="5512345678"
                maxLength={10}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.phone.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Solo 10 dígitos, sin espacios ni guiones
            </p>
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
                Enviando código...
              </span>
            ) : (
              'Continuar'
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

  // Paso: Verificar email
  if (step === 'verify-email') {
    return (
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-6">
          <EnvelopeIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Verifica tu correo
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Ingresa el código de 6 dígitos que enviamos a<br />
          <span className="font-medium text-gray-900 dark:text-white">{registrationEmail}</span>
        </p>

        {renderCodeInput(emailCode, setEmailCode, emailInputRefs, handleVerifyEmail)}

        <button
          onClick={handleVerifyEmail}
          disabled={isLoading || emailCode.join('').length !== 6}
          className="w-full btn-primary py-3 mb-4"
        >
          {isLoading ? 'Verificando...' : 'Verificar Email'}
        </button>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          ¿No recibiste el código?{' '}
          {countdown > 0 ? (
            <span>Reenviar en {countdown}s</span>
          ) : (
            <button
              onClick={resendEmailCode}
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium"
            >
              Reenviar código
            </button>
          )}
        </div>

        <button
          onClick={() => setStep('form')}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Volver al formulario
        </button>
      </div>
    );
  }

  // Paso: Verificar teléfono
  if (step === 'verify-phone') {
    return (
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
          <PhoneIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Verifica tu teléfono
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Ingresa el código de 6 dígitos que enviamos a<br />
          <span className="font-medium text-gray-900 dark:text-white">
            ****{registrationPhone.slice(-4)}
          </span>
        </p>

        {renderCodeInput(phoneCode, setPhoneCode, phoneInputRefs, handleVerifyPhone)}

        <button
          onClick={handleVerifyPhone}
          disabled={isLoading || phoneCode.join('').length !== 6}
          className="w-full btn-primary py-3 mb-4"
        >
          {isLoading ? 'Verificando...' : 'Verificar Teléfono'}
        </button>

        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          ¿No recibiste el código?{' '}
          {countdown > 0 ? (
            <span>Reenviar en {countdown}s</span>
          ) : (
            <button
              onClick={sendPhoneVerification}
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium"
            >
              Reenviar SMS
            </button>
          )}
        </div>

        <button
          onClick={skipPhoneVerification}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Omitir verificación de teléfono →
        </button>

        {/* Contenedor invisible para reCAPTCHA */}
        <div ref={recaptchaContainerRef} id="recaptcha-container"></div>
      </div>
    );
  }

  // Paso: Completado
  if (step === 'complete') {
    return (
      <div className="text-center">
        <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
          <CheckCircleIcon className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ¡Registro completado!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Tu cuenta ha sido creada exitosamente.<br />
          Serás redirigido al inicio de sesión...
        </p>

        <div className="animate-pulse">
          <div className="w-8 h-8 mx-auto border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <Link
          to="/login"
          className="mt-6 inline-block text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return null;
}
