import { config } from '../config/index.js';

interface TurnstileResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

export async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
  const secretKey = config.turnstile?.secretKey;
  
  if (!secretKey) {
    // Si no hay secret key configurada, permitir (deshabilitado)
    console.warn('Turnstile secret key not configured, skipping verification');
    return true;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json() as TurnstileResponse;
    
    if (!data.success) {
      console.warn('Turnstile verification failed:', data['error-codes']);
    }

    return data.success;
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return false;
  }
}
