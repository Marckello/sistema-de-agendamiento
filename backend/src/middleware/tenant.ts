import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';

// Middleware para extraer tenant del subdominio o header
export async function extractTenant(req: Request, res: Response, next: NextFunction) {
  try {
    // Intentar obtener el slug del tenant de varias fuentes
    let tenantSlug: string | undefined;
    
    // 1. Header personalizado (para desarrollo o apps móviles)
    tenantSlug = req.headers['x-tenant-slug'] as string;
    
    // 2. Del subdominio (para producción)
    if (!tenantSlug) {
      const host = req.headers.host || '';
      const parts = host.split('.');
      
      // Si tiene más de 2 partes (subdomain.domain.com), usar la primera como slug
      if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'api') {
        tenantSlug = parts[0];
      }
    }
    
    // 3. Query param (para desarrollo)
    if (!tenantSlug && req.query.tenant) {
      tenantSlug = req.query.tenant as string;
    }
    
    // 4. Si ya está autenticado, usar el tenant del usuario
    if (!tenantSlug && req.user?.tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.user.tenantId },
        select: { id: true, slug: true, planId: true },
      });
      
      if (tenant) {
        req.tenant = tenant;
        return next();
      }
    }
    
    // Si encontramos un slug, buscar el tenant
    if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true, slug: true, planId: true, isActive: true },
      });
      
      if (tenant && tenant.isActive) {
        req.tenant = {
          id: tenant.id,
          slug: tenant.slug,
          planId: tenant.planId,
        };
      }
    }
    
    next();
  } catch (error) {
    console.error('Extract tenant middleware error:', error);
    next();
  }
}

// Middleware que requiere tenant (para rutas que lo necesitan obligatoriamente)
export function requireTenant(req: Request, res: Response, next: NextFunction) {
  if (!req.tenant) {
    return res.status(400).json({
      success: false,
      message: 'Tenant no especificado o no válido',
    });
  }
  
  next();
}
