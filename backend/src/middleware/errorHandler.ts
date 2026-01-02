import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// Clase de error personalizada
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Errores comunes
export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} no encontrado`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'No tienes permisos para esta acción') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  errors: Record<string, string[]>;
  
  constructor(errors: Record<string, string[]>) {
    super('Error de validación', 400);
    this.errors = errors;
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'El recurso ya existe') {
    super(message, 409);
  }
}

// Manejador de errores global
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);
  
  // Error de Zod (validación)
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(e.message);
    });
    
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors,
    });
  }
  
  // Error de validación personalizado
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }
  
  // Error personalizado de la app
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }
  
  // Errores de Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Violación de unique constraint
        const target = (err.meta?.target as string[])?.join(', ') || 'campo';
        return res.status(409).json({
          success: false,
          message: `Ya existe un registro con ese ${target}`,
        });
      
      case 'P2025':
        // Registro no encontrado
        return res.status(404).json({
          success: false,
          message: 'Registro no encontrado',
        });
      
      case 'P2003':
        // Foreign key constraint failed
        return res.status(400).json({
          success: false,
          message: 'Referencia inválida a otro registro',
        });
      
      default:
        return res.status(500).json({
          success: false,
          message: 'Error de base de datos',
        });
    }
  }
  
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación en datos',
    });
  }
  
  // Error genérico
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Error interno del servidor' 
    : err.message;
  
  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

// Wrapper para async handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
