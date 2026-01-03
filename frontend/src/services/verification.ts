import api from './api';

export interface InitiateRegistrationData {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  adminPhone?: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  data?: {
    email?: string;
    requiresPhoneVerification?: boolean;
    emailVerified?: boolean;
    needsPhoneVerification?: boolean;
    phone?: string;
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
    tokens?: {
      accessToken: string;
      refreshToken: string;
    };
  };
  remainingAttempts?: number;
}

// Paso 1: Iniciar registro y enviar código al email
export const initiateRegistration = async (data: InitiateRegistrationData): Promise<VerificationResponse> => {
  const response = await api.post('/verification/initiate', data);
  return response.data;
};

// Paso 2: Verificar código de email
export const verifyEmailCode = async (email: string, code: string): Promise<VerificationResponse> => {
  const response = await api.post('/verification/verify-email', { email, code });
  return response.data;
};

// Paso 3: Guardar ID de verificación de Firebase
export const savePhoneVerificationId = async (email: string, verificationId: string): Promise<VerificationResponse> => {
  const response = await api.post('/verification/save-phone-verification', { email, verificationId });
  return response.data;
};

// Paso 4: Completar registro con verificación de teléfono
export const completeWithPhone = async (email: string, phoneVerified: boolean): Promise<VerificationResponse> => {
  const response = await api.post('/verification/complete-with-phone', { email, phoneVerified });
  return response.data;
};

// Completar registro solo con email
export const completeEmailOnly = async (email: string): Promise<VerificationResponse> => {
  const response = await api.post('/verification/complete-email-only', { email });
  return response.data;
};

// Reenviar código de email
export const resendEmailCode = async (email: string): Promise<VerificationResponse> => {
  const response = await api.post('/verification/resend-email', { email });
  return response.data;
};

export const verificationService = {
  initiateRegistration,
  verifyEmailCode,
  savePhoneVerificationId,
  completeWithPhone,
  completeEmailOnly,
  resendEmailCode,
};

export default verificationService;
