import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../config/database.js';
import { UserRole } from '@prisma/client';

// Extender Request para incluir user y tenant
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        tenantId: string;
      };
      tenant?: {
        id: string;
        slug: string;
        planId: string;
      };
      platformAdmin?: {
        id: string;
        email: string;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId: string;
  type: 'access' | 'refresh';
}

interface PlatformAdminPayload {
  adminId: string;
  email: string;
  isPlatformAdmin: true;
}

// Middleware de autenticación para usuarios de tenant
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acceso requerido' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
      
      if (decoded.type !== 'access') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token inválido' 
        });
      }
      
      // Verificar que el usuario existe y está activo
      const user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          isActive: true,
        },
        include: {
          tenant: {
            select: {
              id: true,
              slug: true,
              planId: true,
              isActive: true,
            },
          },
        },
      });
      
      if (!user || !user.tenant.isActive) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuario o cuenta no válida' 
        });
      }
      
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      };
      
      req.tenant = {
        id: user.tenant.id,
        slug: user.tenant.slug,
        planId: user.tenant.planId,
      };
      
      next();
    } catch (jwtError) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado o inválido' 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error de autenticación' 
    });
  }
}

// Middleware de autenticación para Platform Admin
export async function authenticatePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acceso requerido' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as PlatformAdminPayload;
      
      if (!decoded.isPlatformAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Acceso no autorizado' 
        });
      }
      
      const admin = await prisma.platformAdmin.findFirst({
        where: {
          id: decoded.adminId,
          isActive: true,
        },
      });
      
      if (!admin) {
        return res.status(401).json({ 
          success: false, 
          message: 'Administrador no válido' 
        });
      }
      
      req.platformAdmin = {
        id: admin.id,
        email: admin.email,
      };
      
      next();
    } catch (jwtError) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado o inválido' 
      });
    }
  } catch (error) {
    console.error('Platform admin auth error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error de autenticación' 
    });
  }
}

// Middleware para verificar roles
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autenticado' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos para realizar esta acción' 
      });
    }
    
    next();
  };
}

// Middleware para verificar que puede modificar (Admin o Super Admin)
export function requireModifyPermission(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'No autenticado' 
    });
  }
  
  if (req.user.role === UserRole.EMPLOYEE) {
    return res.status(403).json({ 
      success: false, 
      message: 'No tienes permisos para realizar esta acción' 
    });
  }
  
  next();
}

// Middleware para verificar que puede eliminar (Solo Super Admin)
export function requireDeletePermission(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'No autenticado' 
    });
  }
  
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ 
      success: false, 
      message: 'Solo el Super Admin puede eliminar registros' 
    });
  }
  
  next();
}

// Middleware opcional de autenticación (para rutas públicas que pueden tener usuario)
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        isActive: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
            planId: true,
          },
        },
      },
    });
    
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      };
      
      req.tenant = {
        id: user.tenant.id,
        slug: user.tenant.slug,
        planId: user.tenant.planId,
      };
    }
  } catch (error) {
    // Token inválido, continuar sin usuario
  }
  
  next();
}
