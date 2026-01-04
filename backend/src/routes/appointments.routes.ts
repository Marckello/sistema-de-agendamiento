import { Router } from 'express';
import * as appointmentsController from '../controllers/appointments.controller.js';
import { authenticate, requireModifyPermission } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de citas
router.get('/', appointmentsController.getAppointments);
router.get('/calendar', appointmentsController.getCalendarAppointments);
router.get('/availability', appointmentsController.checkAvailabilityHandler);
router.get('/stats', appointmentsController.getStats);
router.get('/:id', appointmentsController.getAppointment);

// Rutas que requieren permisos de modificación (Admin o Super Admin)
router.post('/', requireModifyPermission, appointmentsController.create);
router.put('/:id', appointmentsController.update); // Empleados pueden actualizar notas
router.delete('/:id', requireModifyPermission, appointmentsController.deleteAppointment);
router.post('/:id/cancel', requireModifyPermission, appointmentsController.cancel);
router.post('/:id/resend-reminder', appointmentsController.resendReminder); // Todos pueden reenviar

export default router;
