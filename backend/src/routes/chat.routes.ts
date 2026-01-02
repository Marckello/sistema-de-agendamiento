import { Router } from 'express';
import multer from 'multer';
import * as chatController from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Configurar multer para archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Todas las rutas de chat requieren autenticación
router.use(authenticate);

// POST /api/chat - Enviar mensaje de texto
router.post('/', chatController.sendMessage);

// POST /api/chat/audio - Enviar mensaje de audio
router.post('/audio', upload.single('audio'), chatController.sendAudio);

// POST /api/chat/image - Enviar imagen para análisis
router.post('/image', upload.single('image'), chatController.sendImage);

// POST /api/chat/execute - Ejecutar acción confirmada
router.post('/execute', chatController.executeAction);

// GET /api/chat/access - Verificar acceso
router.get('/access', chatController.checkAccess);

export default router;
