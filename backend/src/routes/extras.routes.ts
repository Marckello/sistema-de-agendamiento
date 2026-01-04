import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getExtras,
  getActiveExtras,
  getExtraById,
  createExtra,
  updateExtra,
  deleteExtra,
  reorderExtras,
} from '../controllers/extras.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas públicas para empleados (leer)
router.get('/', getExtras);
router.get('/active', getActiveExtras);
router.get('/:id', getExtraById);

// Rutas que requieren rol ADMIN o SUPER_ADMIN
router.post('/', requireRole('ADMIN', 'SUPER_ADMIN'), createExtra);
router.put('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), updateExtra);
router.delete('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), deleteExtra);
router.post('/reorder', requireRole('ADMIN', 'SUPER_ADMIN'), reorderExtras);

export default router;
