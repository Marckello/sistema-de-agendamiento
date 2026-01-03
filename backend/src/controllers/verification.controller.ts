import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import prisma from '../config/database.js';
import { sendEmail } from '../services/email.service.js';
import crypto from 'crypto';

// Generar código de 6 dígitos
function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Iniciar proceso de registro - Paso 1: Enviar código al email
export const initiateRegistration = asyncHandler(async (req: Request, res: Response) => {
  const { 
    name, 
    slug, 
    email, 
    phone,
    adminEmail,
    adminPassword,
    adminFirstName,
    adminLastName,
    adminPhone 
  } = req.body;

  // Validar que el slug no esté en uso
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (existingTenant) {
    return res.status(409).json({
      success: false,
      message: 'El subdominio ya está en uso',
    });
  }

  // Validar que el email no esté en uso
  const existingUser = await prisma.user.findFirst({
    where: { email: adminEmail },
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'El email ya está registrado',
    });
  }

  // Generar código de verificación de email
  const emailCode = generateCode();
  const emailCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  // Guardar o actualizar el registro de verificación
  const registrationData = JSON.stringify({
    name,
    slug,
    email,
    phone,
    adminEmail,
    adminPassword,
    adminFirstName,
    adminLastName,
    adminPhone,
  });

  await prisma.verificationCode.upsert({
    where: { email: adminEmail },
    update: {
      emailCode,
      emailCodeExpiresAt,
      emailVerified: false,
      phoneVerified: false,
      emailAttempts: 0,
      phoneAttempts: 0,
      registrationData,
      phone: adminPhone || phone,
    },
    create: {
      email: adminEmail,
      phone: adminPhone || phone,
      emailCode,
      emailCodeExpiresAt,
      registrationData,
    },
  });

  // Enviar email con el código
  try {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">¡Bienvenido a CitasPro!</h1>
          <p>Hola <strong>${adminFirstName}</strong>,</p>
          <p>Tu código de verificación es:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${emailCode}</span>
          </div>
          <p>Este código expira en <strong>15 minutos</strong>.</p>
          <p>Si no solicitaste este código, ignora este correo.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">Este es un correo automático de CitasPro. Por favor no responder.</p>
        </div>
      `;
    await sendEmail(
      adminEmail,
      `Tu código de verificación para CitasPro: ${emailCode}`,
      `Tu código de verificación es: ${emailCode}`,
      htmlContent
    );
  } catch (error) {
    console.error('Error sending verification email:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al enviar el correo de verificación',
    });
  }

  res.json({
    success: true,
    message: 'Código de verificación enviado al correo',
    data: {
      email: adminEmail,
      requiresPhoneVerification: !!(adminPhone || phone),
    },
  });
});

// Verificar código de email - Paso 2
export const verifyEmailCode = asyncHandler(async (req: Request, res: Response) => {
  const { email, code } = req.body;

  const verification = await prisma.verificationCode.findUnique({
    where: { email },
  });

  if (!verification) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró un proceso de registro para este email',
    });
  }

  // Verificar intentos
  if (verification.emailAttempts >= 5) {
    return res.status(429).json({
      success: false,
      message: 'Demasiados intentos. Solicita un nuevo código.',
    });
  }

  // Verificar expiración
  if (verification.emailCodeExpiresAt && verification.emailCodeExpiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'El código ha expirado. Solicita uno nuevo.',
    });
  }

  // Verificar código
  if (verification.emailCode !== code) {
    await prisma.verificationCode.update({
      where: { email },
      data: { emailAttempts: { increment: 1 } },
    });

    return res.status(400).json({
      success: false,
      message: 'Código incorrecto',
      remainingAttempts: 5 - (verification.emailAttempts + 1),
    });
  }

  // Marcar email como verificado
  await prisma.verificationCode.update({
    where: { email },
    data: { 
      emailVerified: true,
      emailCode: null, // Limpiar código usado
    },
  });

  // Si hay teléfono, necesita verificación de teléfono
  const needsPhoneVerification = !!verification.phone;

  res.json({
    success: true,
    message: 'Email verificado correctamente',
    data: {
      emailVerified: true,
      needsPhoneVerification,
      phone: verification.phone ? `****${verification.phone.slice(-4)}` : null,
    },
  });
});

// Guardar el ID de verificación de Firebase - Paso 3
export const savePhoneVerificationId = asyncHandler(async (req: Request, res: Response) => {
  const { email, verificationId } = req.body;

  const verification = await prisma.verificationCode.findUnique({
    where: { email },
  });

  if (!verification) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró un proceso de registro para este email',
    });
  }

  if (!verification.emailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Primero debes verificar tu email',
    });
  }

  // Guardar el ID de verificación de Firebase
  await prisma.verificationCode.update({
    where: { email },
    data: { 
      firebaseVerificationId: verificationId,
      phoneCodeExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
    },
  });

  res.json({
    success: true,
    message: 'Código SMS enviado',
  });
});

// Verificar teléfono y completar registro - Paso 4
export const verifyPhoneAndComplete = asyncHandler(async (req: Request, res: Response) => {
  const { email, phoneVerified } = req.body;

  const verification = await prisma.verificationCode.findUnique({
    where: { email },
  });

  if (!verification) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró un proceso de registro',
    });
  }

  if (!verification.emailVerified) {
    return res.status(400).json({
      success: false,
      message: 'El email no ha sido verificado',
    });
  }

  // Si el teléfono fue verificado por Firebase
  if (phoneVerified) {
    await prisma.verificationCode.update({
      where: { email },
      data: { phoneVerified: true },
    });
  }

  // Obtener datos de registro
  const registrationData = JSON.parse(verification.registrationData || '{}');

  // Importar función de registro
  const { registerTenant } = await import('../services/auth.service.js');

  // Completar el registro
  const result = await registerTenant(registrationData);

  // Marcar el tenant como verificado
  await prisma.tenant.update({
    where: { id: result.user.tenantId },
    data: {
      emailVerified: true,
      phoneVerified: phoneVerified || false,
    },
  });

  // Limpiar registro de verificación
  await prisma.verificationCode.delete({
    where: { email },
  });

  res.json({
    success: true,
    message: 'Registro completado exitosamente',
    data: {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      tokens: result.tokens,
    },
  });
});

// Reenviar código de email
export const resendEmailCode = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const verification = await prisma.verificationCode.findUnique({
    where: { email },
  });

  if (!verification) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró un proceso de registro para este email',
    });
  }

  // Generar nuevo código
  const emailCode = generateCode();
  const emailCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.verificationCode.update({
    where: { email },
    data: {
      emailCode,
      emailCodeExpiresAt,
      emailAttempts: 0,
    },
  });

  // Parsear datos para obtener el nombre
  const registrationData = JSON.parse(verification.registrationData || '{}');

  // Enviar email
  try {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Código de Verificación</h1>
          <p>Hola <strong>${registrationData.adminFirstName || ''}</strong>,</p>
          <p>Tu nuevo código de verificación es:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${emailCode}</span>
          </div>
          <p>Este código expira en <strong>15 minutos</strong>.</p>
        </div>
      `;
    await sendEmail(
      email,
      `Tu nuevo código de verificación para CitasPro: ${emailCode}`,
      `Tu nuevo código de verificación es: ${emailCode}`,
      htmlContent
    );
  } catch (error) {
    console.error('Error sending verification email:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al enviar el correo',
    });
  }

  res.json({
    success: true,
    message: 'Nuevo código enviado',
  });
});

// Completar registro sin verificación de teléfono (si no proporcionó teléfono)
export const completeRegistrationEmailOnly = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const verification = await prisma.verificationCode.findUnique({
    where: { email },
  });

  if (!verification) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró un proceso de registro',
    });
  }

  if (!verification.emailVerified) {
    return res.status(400).json({
      success: false,
      message: 'El email no ha sido verificado',
    });
  }

  // Obtener datos de registro
  const registrationData = JSON.parse(verification.registrationData || '{}');

  // Importar función de registro
  const { registerTenant } = await import('../services/auth.service.js');

  // Completar el registro
  const result = await registerTenant(registrationData);

  // Marcar el tenant como verificado (solo email)
  await prisma.tenant.update({
    where: { id: result.user.tenantId },
    data: {
      emailVerified: true,
      phoneVerified: false,
    },
  });

  // Limpiar registro de verificación
  await prisma.verificationCode.delete({
    where: { email },
  });

  res.json({
    success: true,
    message: 'Registro completado exitosamente',
    data: {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      tokens: result.tokens,
    },
  });
});
