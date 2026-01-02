import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getPlatformStats,
  listTenants,
  getTenantDetail,
  updateTenant,
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getUsageMetrics,
  getActivityLogs,
} from '../controllers/admin.controller.js';

const router = Router();

// Todas las rutas requieren autenticación y rol SUPER_ADMIN
router.use(authenticate);
router.use(requireRole('SUPER_ADMIN'));

// Dashboard
router.get('/stats', getPlatformStats);

// Tenants
router.get('/tenants', listTenants);
router.get('/tenants/:id', getTenantDetail);
router.patch('/tenants/:id', updateTenant);

// Plans
router.get('/plans', listPlans);
router.post('/plans', createPlan);
router.patch('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);

// Analytics
router.get('/metrics', getUsageMetrics);
router.get('/activity', getActivityLogs);

export default router;
