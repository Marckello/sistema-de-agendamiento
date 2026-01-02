import { Router } from 'express';
import * as usersController from '../controllers/users.controller.js';
import { authenticate, requireModifyPermission, requireRole } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Actualizar perfil propio (cualquier usuario)
router.put('/profile', usersController.updateProfile);

// Obtener empleados (para selects)
router.get('/employees', usersController.getEmployees);

// Rutas de gestión de usuarios (requieren permisos)
router.get('/', requireModifyPermission, usersController.getUsers);
router.get('/:id', requireModifyPermission, usersController.getUser);
router.post('/', requireModifyPermission, usersController.create);
router.put('/:id', requireModifyPermission, usersController.update);
router.patch('/:id/toggle-active', requireRole(UserRole.SUPER_ADMIN), usersController.toggleActive);

export default router;
