/**
 * src/routes/formalization.routes.ts — Rutas de Transición Formal, KYC y Gobernanza (TypeScript)
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import * as formalizationController from '../controllers/formalization.controller';

const router = Router();

/**
 * @route   POST /api/v1/formalization/kyc
 * @desc    Registrar KYC y validación de identidad obligatoria
 * @access  Privado (Trabajador)
 */
router.post('/kyc',
  authenticate,
  formalizationController.registerKYC
);

/**
 * @route   POST /api/v1/formalization/ruc
 * @desc    Validar RUC ante SUNAT e iniciar Ruta A (Emprendedor)
 * @access  Privado (Trabajador)
 */
router.post('/ruc',
  authenticate,
  formalizationController.validateRUC
);

/**
 * @route   GET /api/v1/formalization/courses
 * @desc    Obtener lista de cursos y avance del trabajador
 * @access  Privado (Trabajador)
 */
router.get('/courses',
  authenticate,
  formalizationController.getCourses
);

/**
 * @route   POST /api/v1/formalization/courses/:courseId/progress
 * @desc    Actualizar avance de curso (Feature Gating Trigger)
 * @access  Privado (Trabajador)
 */
router.post('/courses/:courseId/progress',
  authenticate,
  formalizationController.updateCourseProgress
);

/**
 * @route   GET /api/v1/formalization/profile
 * @desc    Obtener perfil de formalización, semáforo social y pilar scoring
 * @access  Privado (Trabajador)
 */
router.get('/profile',
  authenticate,
  formalizationController.getMyFormalizationProfile
);

/**
 * @route   GET /api/v1/formalization/metrics
 * @desc    Métricas agregadas del distrito (Tasa de Transición Social, control de menores)
 * @access  Privado (Administradores Municipales / SUNAT)
 */
router.get('/metrics',
  authenticate,
  authorize('ADMIN', 'DISTRICT_ADMIN', 'MACRO_ADMIN'),
  formalizationController.getDistrictMetrics
);

/**
 * @route   GET /api/v1/formalization/taxes
 * @desc    Reporte de transparencia tributaria y auditoría fiscal macro
 * @access  Privado (SUNAT / Ministerio / Admin Global)
 */
router.get('/taxes',
  authenticate,
  authorize('ADMIN', 'MACRO_ADMIN'),
  formalizationController.getTaxAuditReport
);

export default router;
