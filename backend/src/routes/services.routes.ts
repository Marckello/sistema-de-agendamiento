import { Router } from 'express';
import * as servicesController from '../controllers/services.controller.js';
import { authenticate, requireModifyPermission, requireDeletePermission } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// === CATEGORÍAS ===
router.get('/categories', servicesController.getCategories);
router.post('/categories', requireModifyPermission, servicesController.createCategory);
router.put('/categories/:id', requireModifyPermission, servicesController.updateCategory);
router.delete('/categories/:id', requireDeletePermission, servicesController.deleteCategory);

// === SERVICIOS ===
router.get('/', servicesController.getServices);
router.get('/:id', servicesController.getService);
router.post('/', requireModifyPermission, servicesController.create);
router.put('/:id', requireModifyPermission, servicesController.update);
router.delete('/:id', requireDeletePermission, servicesController.remove);

export default router;
