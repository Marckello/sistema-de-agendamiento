import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller.js';

const router = Router();

// Todas las rutas son públicas (para que los clientes puedan agendar)

// Información del negocio
router.get('/:slug', bookingController.getTenantInfo);

// Servicios disponibles
router.get('/:slug/services', bookingController.getPublicServices);
router.get('/:slug/services/:serviceId/employees', bookingController.getEmployeesForService);

// Disponibilidad
router.get('/:slug/availability', bookingController.getAvailability);
router.get('/:slug/availability/range', bookingController.getAvailabilityRange);

// Crear reserva
router.post('/:slug/book', bookingController.createBooking);

// Estado de cita
router.get('/:slug/appointments/:appointmentId', bookingController.getBookingStatus);
router.post('/:slug/appointments/:appointmentId/cancel', bookingController.cancelBooking);

export default router;
