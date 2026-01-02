import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Rutas públicas
router.post('/login', authController.login);
router.post('/login/admin', authController.loginAdmin);
router.post('/register', authController.register);
router.post('/refresh', authController.refresh);
router.get('/check-slug/:slug', authController.checkSlug);

// Rutas protegidas
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, authController.changePassword);

export default router;
