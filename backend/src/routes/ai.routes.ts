/**
 * src/routes/ai.routes.ts — Rutas para el Módulo de Inteligencia Artificial (TypeScript)
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as aiController from '../controllers/ai.controller';

const router = Router();

/**
 * @route   GET /api/v1/ai/test
 * @desc    Probar conectividad directa de la API con Google Cloud Gemini en caliente
 * @access  Público (para diagnóstico rápido SRE)
 */
router.get('/test', aiController.testConnection);

/**
 * @route   POST /api/v1/ai/generate
 * @desc    Generación puntual de texto basado en un prompt
 * @access  Privado (requiere autenticación JWT)
 */
router.post('/generate',
  authenticate,
  body('prompt').trim().notEmpty().withMessage('El prompt es requerido para la generación.'),
  validate,
  aiController.generate
);

/**
 * @route   POST /api/v1/ai/chat
 * @desc    Conversación conversacional interactiva con historial
 * @access  Privado (requiere autenticación JWT)
 */
router.post('/chat',
  authenticate,
  body('message').trim().notEmpty().withMessage('El mensaje es requerido para chatear.'),
  body('history').optional().isArray().withMessage('El historial debe ser un arreglo de mensajes.'),
  validate,
  aiController.chat
);

export default router;
