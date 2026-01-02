import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Dashboard
router.get('/', dashboardController.getDashboard);
router.get('/stats', dashboardController.getDetailedStats);
router.get('/top-clients', dashboardController.getTopClients);
router.get('/activity', dashboardController.getRecentActivity);

export default router;
