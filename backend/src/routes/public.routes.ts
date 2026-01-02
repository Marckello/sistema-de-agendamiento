import { Router } from 'express';
import {
  getTenantBySubdomain,
  getPublicServices,
  getPublicEmployees,
  getAvailability,
  createPublicAppointment,
} from '../controllers/public.controller';

const router = Router();

// Get tenant info by subdomain
router.get('/tenant/:subdomain', getTenantBySubdomain);

// Get available services
router.get('/services', getPublicServices);

// Get employees for a service
router.get('/employees', getPublicEmployees);

// Get available time slots
router.get('/availability', getAvailability);

// Create appointment
router.post('/appointments', createPublicAppointment);

export default router;
