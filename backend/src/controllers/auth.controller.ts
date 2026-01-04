import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { 
  loginUser, 
  loginPlatformAdmin, 
  registerTenant, 
  refreshAccessToken, 
  invalidateAllTokens,
  hashPassword,
  verifyPassword 
} from '../services/auth.service.js';
import { loginSchema, registerTenantSchema, refreshTokenSchema, changePasswordSchema } from '../utils/validators.js';
import prisma from '../config/database.js';
import { verifyTurnstileToken } from '../services/turnstile.service.js';
import config from '../config/index.js';

// Login de usuario de tenant
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { turnstileToken, ...loginData } = req.body;
  const data = loginSchema.parse(loginData);
  
  // Verificar Turnstile si está configurado
  if (config.turnstile?.secretKey) {
    if (!turnstileToken) {
      return res.status(400).json({
        success: false,
        message: 'Verificación de seguridad requerida',
      });
    }
    
    const clientIp = req.ip || req.socket.remoteAddress;
    const isValidToken = await verifyTurnstileToken(turnstileToken, clientIp);
    
    if (!isValidToken) {
      return res.status(403).json({
        success: false,
        message: 'Verificación de seguridad fallida. Por favor intenta de nuevo.',
      });
    }
  }
  
  const result = await loginUser(data.email, data.password, data.tenantSlug);
  
  if (!result) {
    return res.status(401).json({
      success: false,
      message: 'Credenciales inválidas',
    });
  }
  
  // Obtener tenant info
  const tenant = await prisma.tenant.findUnique({
    where: { id: result.user.tenantId },
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
    },
  });
  
  res.json({
    success: true,
    data: {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        avatar: result.user.avatar,
        theme: result.user.theme,
      },
      tenant,
      tokens: result.tokens,
    },
  });
});

// Login de Platform Admin
export const loginAdmin = asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  
  const result = await loginPlatformAdmin(data.email, data.password);
  
  if (!result) {
    return res.status(401).json({
      success: false,
      message: 'Credenciales inválidas',
    });
  }
  
  res.json({
    success: true,
    data: {
      admin: {
        id: result.admin.id,
        email: result.admin.email,
        firstName: result.admin.firstName,
        lastName: result.admin.lastName,
      },
      tokens: result.tokens,
    },
  });
});

// Registro de nuevo tenant
export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerTenantSchema.parse(req.body);
  
  // Verificar que el slug no existe
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: data.slug },
  });
  
  if (existingTenant) {
    return res.status(409).json({
      success: false,
      message: 'El slug ya está en uso',
    });
  }
  
  // Verificar que el email de admin no existe en ese tenant
  const existingUser = await prisma.user.findFirst({
    where: { email: data.adminEmail },
  });
  
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'El email ya está registrado',
    });
  }
  
  const result = await registerTenant(data);
  
  // Obtener tenant info
  const tenant = await prisma.tenant.findUnique({
    where: { id: result.user.tenantId },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });
  
  res.status(201).json({
    success: true,
    message: 'Cuenta creada exitosamente',
    data: {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      tenant,
      tokens: result.tokens,
    },
  });
});

// Refrescar token
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const data = refreshTokenSchema.parse(req.body);
  
  const tokens = await refreshAccessToken(data.refreshToken);
  
  if (!tokens) {
    return res.status(401).json({
      success: false,
      message: 'Token de refresco inválido o expirado',
    });
  }
  
  res.json({
    success: true,
    data: { tokens },
  });
});

// Logout (invalidar tokens)
export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await invalidateAllTokens(req.user.id);
  }
  
  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente',
  });
});

// Obtener usuario actual
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      title: true,
      specialty: true,
      bio: true,
      color: true,
      emailNotifications: true,
      pushNotifications: true,
      theme: true,
      lastLogin: true,
      createdAt: true,
    },
  });
  
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.user!.tenantId },
    include: {
      plan: {
        select: {
          name: true,
          displayName: true,
          maxEmployees: true,
          maxClients: true,
          maxAppointments: true,
          maxServices: true,
          hasPublicBooking: true,
          hasEmailReminders: true,
          hasSmsReminders: true,
          hasWebhooks: true,
          hasReports: true,
          hasCustomBranding: true,
        },
      },
    },
  });
  
  res.json({
    success: true,
    data: {
      user,
      tenant: {
        id: tenant?.id,
        slug: tenant?.slug,
        name: tenant?.name,
        email: tenant?.email,
        phone: tenant?.phone,
        logo: tenant?.logo,
        timezone: tenant?.timezone,
        currency: tenant?.currency,
        dateFormat: tenant?.dateFormat,
        timeFormat: tenant?.timeFormat,
        primaryColor: tenant?.primaryColor,
        secondaryColor: tenant?.secondaryColor,
        plan: tenant?.plan,
        subscriptionStatus: tenant?.subscriptionStatus,
      },
    },
  });
});

// Cambiar contraseña
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const data = changePasswordSchema.parse(req.body);
  
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
  });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado',
    });
  }
  
  const isValid = await verifyPassword(data.currentPassword, user.password);
  
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Contraseña actual incorrecta',
    });
  }
  
  const hashedPassword = await hashPassword(data.newPassword);
  
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { password: hashedPassword },
  });
  
  // Invalidar todos los tokens
  await invalidateAllTokens(req.user!.id);
  
  res.json({
    success: true,
    message: 'Contraseña actualizada exitosamente',
  });
});

// Verificar disponibilidad de slug
export const checkSlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true },
  });
  
  res.json({
    success: true,
    data: {
      available: !tenant,
    },
  });
});
