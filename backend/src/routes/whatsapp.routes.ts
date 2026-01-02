import { Router } from 'express';
import { whatsappController } from '../controllers/whatsapp.controller';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación y rol ADMIN o SUPER_ADMIN
router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'ADMIN'));

// Conexión y estado
router.post('/connect', (req, res) => whatsappController.connect(req, res));
router.get('/status', (req, res) => whatsappController.getStatus(req, res));
router.get('/qr', (req, res) => whatsappController.getQR(req, res));
router.post('/disconnect', (req, res) => whatsappController.disconnect(req, res));

// Configuración
router.get('/config', (req, res) => whatsappController.getConfig(req, res));
router.put('/config', (req, res) => whatsappController.updateConfig(req, res));

// Mensajes
router.post('/send-test', (req, res) => whatsappController.sendTestMessage(req, res));
router.post('/send-reminder/:appointmentId', (req, res) => whatsappController.sendReminder(req, res));
router.get('/logs', (req, res) => whatsappController.getMessageLogs(req, res));

export default router;
