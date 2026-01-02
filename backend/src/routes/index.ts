import { Router } from 'express';
import authRoutes from './auth.routes.js';
import appointmentsRoutes from './appointments.routes.js';
import clientsRoutes from './clients.routes.js';
import servicesRoutes from './services.routes.js';
import usersRoutes from './users.routes.js';
import settingsRoutes from './settings.routes.js';
import bookingRoutes from './booking.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import publicRoutes from './public.routes.js';
import chatRoutes from './chat.routes.js';
import whatsappRoutes from './whatsapp.routes.js';
import { extractTenant } from '../middleware/tenant.js';

const router = Router();

// Rutas públicas (sin autenticación, antes del middleware de tenant)
router.use('/public', publicRoutes);

// Middleware para extraer tenant
router.use(extractTenant);

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas públicas de booking (sin autenticación)
router.use('/book', bookingRoutes);

// Rutas protegidas del sistema
router.use('/appointments', appointmentsRoutes);
router.use('/clients', clientsRoutes);
router.use('/services', servicesRoutes);
router.use('/users', usersRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/chat', chatRoutes);
router.use('/whatsapp', whatsappRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
