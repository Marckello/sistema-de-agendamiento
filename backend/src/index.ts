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

// Rate limiting MÍNIMO - Solo como última línea de defensa
// La seguridad principal está en: Cloudflare WAF + Turnstile + JWT + Email Verification
const emergencyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 1000, // 1000 requests por minuto - muy permisivo
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
  // Saltar para usuarios autenticados - Cloudflare ya los protege
  skip: (req) => !!req.headers.authorization,
});

// Solo aplicar a rutas públicas sin autenticación
app.use('/api/public', emergencyLimiter);

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
