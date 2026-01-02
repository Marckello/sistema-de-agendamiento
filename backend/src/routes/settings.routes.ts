import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Configuración general (solo Super Admin)
router.get('/', settingsController.getSettings);
router.put('/', requireRole(UserRole.SUPER_ADMIN), settingsController.updateSettings);

// Horarios (Admin y Super Admin) - ambas rutas soportadas
router.get('/schedules', settingsController.getSchedules);
router.get('/work-schedule', settingsController.getBusinessSchedule); // Horario del negocio
router.put('/schedules', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), settingsController.updateSchedule);
router.put('/work-schedule', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), settingsController.updateBusinessSchedule);
router.put('/schedules/batch', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), settingsController.updateSchedulesBatch);

// Días festivos
router.get('/holidays', settingsController.getHolidays);
router.post('/holidays', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), settingsController.createHoliday);
router.put('/holidays/:id', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), settingsController.updateHoliday);
router.delete('/holidays/:id', requireRole(UserRole.SUPER_ADMIN), settingsController.deleteHoliday);

// Plantillas de notificación (Super Admin)
router.get('/notifications/templates', settingsController.getNotificationTemplates);
router.put('/notifications/templates/:id', requireRole(UserRole.SUPER_ADMIN), settingsController.updateNotificationTemplate);

// Webhooks (Super Admin)
router.get('/webhooks', requireRole(UserRole.SUPER_ADMIN), settingsController.getWebhookConfig);
router.put('/webhooks', requireRole(UserRole.SUPER_ADMIN), settingsController.updateWebhookConfig);
router.get('/webhooks/logs', requireRole(UserRole.SUPER_ADMIN), settingsController.getWebhookLogs);
router.post('/webhooks/test', requireRole(UserRole.SUPER_ADMIN), settingsController.testWebhook);

export default router;
