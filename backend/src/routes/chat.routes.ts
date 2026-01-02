import { Router } from 'express';
import * as chatController from '../controllers/chat.controller.js';

const router = Router();

// POST /api/chat - Enviar mensaje
router.post('/', chatController.sendMessage);

// POST /api/chat/execute - Ejecutar acción confirmada
router.post('/execute', chatController.executeAction);

// GET /api/chat/access - Verificar acceso
router.get('/access', chatController.checkAccess);

export default router;
