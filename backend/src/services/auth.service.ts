import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import prisma from '../config/database.js';
import { User, UserRole, PlatformAdmin } from '@prisma/client';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Generar par de tokens
export async function generateTokenPair(user: User): Promise<TokenPair> {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      type: 'access',
    },
    config.jwt.accessSecret,
    { expiresIn: 86400 } // 24 hours in seconds
  );
  
  const refreshTokenValue = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 días
  
  // Guardar refresh token en la base de datos
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenValue,
      expiresAt,
    },
  });
  
  const refreshToken = jwt.sign(
    {
      userId: user.id,
      token: refreshTokenValue,
      type: 'refresh',
    },
    config.jwt.refreshSecret,
    { expiresIn: 604800 } // 7 days in seconds
  );
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 86400, // 24 horas en segundos
  };
}

// Generar tokens para Platform Admin
export function generatePlatformAdminToken(admin: PlatformAdmin): TokenPair {
  const accessToken = jwt.sign(
    {
      adminId: admin.id,
      email: admin.email,
      isPlatformAdmin: true,
    },
    config.jwt.accessSecret,
    { expiresIn: 86400 } // 24 hours
  );
  
  const refreshToken = jwt.sign(
    {
      adminId: admin.id,
      isPlatformAdmin: true,
      type: 'refresh',
    },
    config.jwt.refreshSecret,
    { expiresIn: 604800 } // 7 days
  );
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 86400,
  };
}

// Refrescar access token
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
      userId: string;
      token: string;
      type: string;
    };
    
    if (decoded.type !== 'refresh') {
      return null;
    }
    
    // Buscar el refresh token en la base de datos
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: decoded.token },
      include: { user: true },
    });
    
    if (!storedToken || storedToken.expiresAt < new Date()) {
      // Token no existe o expirado
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      return null;
    }
    
    // Eliminar el token usado (rotation)
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    
    // Generar nuevos tokens
    return generateTokenPair(storedToken.user);
  } catch (error) {
    return null;
  }
}

// Invalidar todos los refresh tokens de un usuario
export async function invalidateAllTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

// Hashear contraseña
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verificar contraseña
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Login de usuario de tenant
export async function loginUser(email: string, password: string, tenantSlug?: string): Promise<{ user: User; tokens: TokenPair } | null> {
  let user: User | null = null;
  
  if (tenantSlug) {
    // Buscar por tenant específico
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    
    if (!tenant) {
      return null;
    }
    
    user = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    });
  } else {
    // Buscar en todos los tenants (primera coincidencia)
    user = await prisma.user.findFirst({
      where: { email },
    });
  }
  
  if (!user || !user.isActive) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.password);
  
  if (!isValid) {
    return null;
  }
  
  // Actualizar último login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });
  
  const tokens = await generateTokenPair(user);
  
  return { user, tokens };
}

// Login de Platform Admin
export async function loginPlatformAdmin(email: string, password: string): Promise<{ admin: PlatformAdmin; tokens: TokenPair } | null> {
  const admin = await prisma.platformAdmin.findUnique({
    where: { email },
  });
  
  if (!admin || !admin.isActive) {
    return null;
  }
  
  const isValid = await verifyPassword(password, admin.password);
  
  if (!isValid) {
    return null;
  }
  
  // Actualizar último login
  await prisma.platformAdmin.update({
    where: { id: admin.id },
    data: { lastLogin: new Date() },
  });
  
  const tokens = generatePlatformAdminToken(admin);
  
  return { admin, tokens };
}

// Registrar nuevo tenant
export async function registerTenant(data: {
  // Datos del negocio
  name: string;
  slug: string;
  email: string;
  phone?: string;
  // Datos del admin
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  adminPhone?: string;
}): Promise<{ user: User; tokens: TokenPair }> {
  // Verificar que el slug no existe
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: data.slug },
  });
  
  if (existingTenant) {
    throw new Error('El slug ya está en uso');
  }
  
  // Obtener plan gratuito
  const freePlan = await prisma.plan.findUnique({
    where: { name: 'free' },
  });
  
  if (!freePlan) {
    throw new Error('Plan gratuito no encontrado');
  }
  
  // Hashear contraseña
  const hashedPassword = await hashPassword(data.adminPassword);
  
  // Crear tenant y usuario admin en transacción
  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        slug: data.slug,
        name: data.name,
        email: data.email,
        phone: data.phone,
        planId: freePlan.id,
        subscriptionStatus: 'active',
      },
    });
    
    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: data.adminEmail,
        password: hashedPassword,
        firstName: data.adminFirstName,
        lastName: data.adminLastName,
        phone: data.adminPhone,
        role: UserRole.SUPER_ADMIN,
      },
    });
    
    // Crear horarios por defecto (Lunes a Viernes)
    const schedules = [];
    for (let day = 1; day <= 5; day++) {
      schedules.push({
        tenantId: tenant.id,
        userId: user.id,
        dayOfWeek: day,
        isWorking: true,
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '14:00',
        breakEnd: '15:00',
      });
    }
    
    await tx.workSchedule.createMany({ data: schedules });
    
    // Crear plantillas de notificación por defecto
    const templates = [
      {
        tenantId: tenant.id,
        type: 'APPOINTMENT_CREATED' as const,
        channel: 'EMAIL' as const,
        subject: 'Tu cita ha sido agendada - {{business_name}}',
        body: 'Hola {{client_name}}, tu cita para {{service_name}} ha sido agendada para el {{date}} a las {{time}}.',
      },
      {
        tenantId: tenant.id,
        type: 'APPOINTMENT_REMINDER_24H' as const,
        channel: 'EMAIL' as const,
        subject: 'Recordatorio: Tu cita es mañana - {{business_name}}',
        body: 'Hola {{client_name}}, te recordamos que tienes una cita mañana {{date}} a las {{time}}.',
      },
      {
        tenantId: tenant.id,
        type: 'APPOINTMENT_CANCELED' as const,
        channel: 'EMAIL' as const,
        subject: 'Tu cita ha sido cancelada - {{business_name}}',
        body: 'Hola {{client_name}}, lamentamos informarte que tu cita del {{date}} ha sido cancelada.',
      },
    ];
    
    await tx.notificationTemplate.createMany({ data: templates });
    
    return { tenant, user };
  });
  
  const tokens = await generateTokenPair(result.user);
  
  return { user: result.user, tokens };
}
