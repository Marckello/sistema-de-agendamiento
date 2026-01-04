import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config, validateConfig } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import prisma from './config/database.js';
import { reminderScheduler } from './services/reminder.scheduler.js';

// Validar configuración
validateConfig();

const app = express();

// Seguridad
app.use(helmet());

// CORS
app.use(cors({
  origin: [
    config.frontendUrl,
    /\.citaspro\.com$/,
    /\.serrano\.marketing$/,
    'https://citas.serrano.marketing',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug', 'X-Tenant-Subdomain'],
}));

// Trust proxy for Cloudflare (to get real IP)
app.set('trust proxy', 1);

// Rate limiting - General (más permisivo)
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 300, // 300 requests por minuto
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intenta de nuevo más tarde',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Usar la IP real detrás de Cloudflare
  keyGenerator: (req) => {
    return req.headers['cf-connecting-ip'] as string || 
           req.headers['x-forwarded-for'] as string || 
           req.ip || 
           'unknown';
  },
  // Saltar rate limit para requests exitosos de usuarios autenticados
  skip: (req) => {
    // Si tiene token de autorización, ser más permisivo
    return !!req.headers.authorization;
  },
});

// Rate limiting - Estricto para auth (prevenir fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos de login por 15 minutos
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Espera 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['cf-connecting-ip'] as string || 
           req.headers['x-forwarded-for'] as string || 
           req.ip || 
           'unknown';
  },
});

// Rate limiting - Para usuarios autenticados (muy permisivo)
const authenticatedLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 500, // 500 requests por minuto para usuarios autenticados
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intenta de nuevo más tarde',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['cf-connecting-ip'] as string || 
           req.headers['x-forwarded-for'] as string || 
           req.ip || 
           'unknown';
  },
});

// Aplicar limitadores
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api', authenticatedLimiter); // Para rutas autenticadas
app.use('/api/public', generalLimiter); // Para rutas públicas

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rutas
app.use('/api', routes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    name: 'CitasPro API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/docs',
  });
});

// Manejo de errores
app.use(errorHandler);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// Iniciar servidor
const PORT = config.port;

async function start() {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Iniciar scheduler de recordatorios
    reminderScheduler.start();
    console.log('✅ Reminder scheduler started');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${config.env}`);
      console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

start();

export default app;
