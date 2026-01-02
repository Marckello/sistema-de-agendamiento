import { Router } from 'express';
import * as clientsController from '../controllers/clients.controller.js';
import { authenticate, requireModifyPermission, requireDeletePermission } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de lectura
router.get('/', clientsController.getClients);
router.get('/search', clientsController.search);
router.get('/tags', clientsController.getTags);
router.get('/stats', clientsController.getStats);
router.get('/:id', clientsController.getClient);
router.get('/:id/appointments', clientsController.getAppointmentHistory);

// Rutas de modificación
router.post('/', requireModifyPermission, clientsController.create);
router.put('/:id', requireModifyPermission, clientsController.update);

// Solo Super Admin puede eliminar
router.delete('/:id', requireDeletePermission, clientsController.remove);

export default router;
