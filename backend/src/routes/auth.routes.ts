/**
 * src/routes/auth.routes.ts — Rutas de Autenticación y Cuentas de Prueba (TypeScript)
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

const passwordStrong = body('password')
  .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-+#^()\[\]{}])[A-Za-z\d@$!%*?&_\-+#^()\[\]{}]{8,}$/)
  .withMessage('La contraseña debe incluir mayúscula, minúscula, número y carácter especial.');

const emailSanitized = body('email')
  .trim()
  .isEmail().withMessage('Debe proporcionar un correo electrónico válido.')
  .normalizeEmail();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Iniciar sesión y obtener el token JWT de acceso
 * @access  Público
 */
router.post('/login',
  emailSanitized,
  body('password').trim().notEmpty().withMessage('La contraseña es obligatoria.'),
  validate,
  authController.login
);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Crear una nueva cuenta de usuario en Supabase (PostgreSQL)
 * @access  Público
 */
router.post('/register',
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio.').escape(),
  emailSanitized,
  passwordStrong,
  body('role').optional().trim().isIn(['USER', 'WORKER', 'EMPLOYER']).withMessage('Rol no válido.'),
  validate,
  authController.register
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
