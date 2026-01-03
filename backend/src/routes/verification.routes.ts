import { Router } from 'express';
import * as verificationController from '../controllers/verification.controller.js';

const router = Router();

// Paso 1: Iniciar registro y enviar código al email
router.post('/initiate', verificationController.initiateRegistration);

// Paso 2: Verificar código de email
router.post('/verify-email', verificationController.verifyEmailCode);

// Paso 3: Guardar ID de verificación de Firebase (después de enviar SMS)
router.post('/save-phone-verification', verificationController.savePhoneVerificationId);

// Paso 4: Completar registro con verificación de teléfono
router.post('/complete-with-phone', verificationController.verifyPhoneAndComplete);

// Completar registro solo con email (sin teléfono)
router.post('/complete-email-only', verificationController.completeRegistrationEmailOnly);

// Reenviar código de email
router.post('/resend-email', verificationController.resendEmailCode);

export default router;
