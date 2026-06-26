/**
 * src/routes/auth.routes.ts — Rutas de Autenticación y Cuentas de Prueba (TypeScript)
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Iniciar sesión y obtener el token JWT de acceso
 * @access  Público
 */
router.post('/login',
  body('email').isEmail().withMessage('Debe proporcionar un correo electrónico válido.'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  validate,
  authController.login
);

/**
 * @route   GET /api/v1/auth/debug/users
 * @desc    Obtener lista de cuentas para pruebas rápidas
 * @access  Público (Exclusivo desarrollo / diagnóstico)
 */
router.get('/debug/users',
  authController.getDebugUsers
);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refrescar el token de acceso JWT de forma segura
 * @access  Público
 */
router.post('/refresh-token',
  authController.refreshToken
);

export default router;
