/**
 * src/routes/service.routes.ts — Rutas para el Motor de Asignación por Proximidad y Flujo Vial (TypeScript)
 */

import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as serviceController from '../controllers/service.controller';

const router = Router();

/**
 * @route   GET /api/v1/services/workers/nearby
 * @desc    Buscar asistentes viales disponibles dentro de un radio específico
 * @access  Privado (Cualquier usuario autenticado)
 */
router.get('/workers/nearby',
  authenticate,
  query('latitude').notEmpty().withMessage('La latitud es obligatoria.'),
  query('longitude').notEmpty().withMessage('La longitud es obligatoria.'),
  query('radius').optional().isInt({ min: 10, max: 20000 }).withMessage('El radio debe ser un número entre 10 y 20000 metros.'),
  validate,
  serviceController.findNearbyWorkers
);

/**
 * @route   GET /api/v1/services/intersections
 * @desc    Obtener lista de intersecciones y estado de sus semáforos
 * @access  Privado (Cualquier usuario autenticado)
 */
router.get('/intersections',
  authenticate,
  serviceController.listIntersections
);

/**
 * @route   PATCH /api/v1/services/intersections/:id/light
 * @desc    Actualizar color de semáforo (simulaciones / IoT)
 * @access  Privado (Admin/Operadores)
 */
router.patch('/intersections/:id/light',
  authenticate,
  body('lightColor').notEmpty().isIn(['RED', 'YELLOW', 'GREEN']).withMessage('El color del semáforo debe ser RED, YELLOW o GREEN.'),
  validate,
  serviceController.updateTrafficLight
);

/**
 * @route   POST /api/v1/services/request
 * @desc    Crear una solicitud de asistencia por un peatón
 * @access  Privado (Rol USER)
 */
router.post('/request',
  authenticate,
  body('intersectionId').isUUID().withMessage('El ID de intersección debe ser un UUID válido.'),
  body('startLatitude').isFloat().withMessage('La latitud de inicio debe ser un número decimal.'),
  body('startLongitude').isFloat().withMessage('La longitud de inicio debe ser un número decimal.'),
  validate,
  serviceController.createServiceRequest
);

/**
 * @route   GET /api/v1/services/requests
 * @desc    Lista general de todas las solicitudes de asistencia (auditoría / operadores)
 * @access  Privado (Rol ADMIN)
 */
router.get('/requests',
  authenticate,
  serviceController.listServiceRequests
);

/**
 * @route   GET /api/v1/services/request/:id
 * @desc    Ver detalles completos de una solicitud específica
 * @access  Privado (Peatón o trabajador asociado)
 */
router.get('/request/:id',
  authenticate,
  serviceController.getServiceRequest
);

/**
 * @route   POST /api/v1/services/request/:id/assign
 * @desc    Permite a un asistente vial disponible aceptar un pedido
 * @access  Privado (Rol WORKER)
 */
router.post('/request/:id/assign',
  authenticate,
  serviceController.assignWorker
);

/**
 * @route   PATCH /api/v1/services/request/:id/status
 * @desc    Transición de estados del viaje (En Camino, En Ejecución, Finalizado, Cancelado)
 * @access  Privado (Peatón o asistente vial asociado)
 */
router.patch('/request/:id/status',
  authenticate,
  body('status').notEmpty().isIn(['EN_CAMINO', 'EN_EJECUCION', 'FINALIZADO', 'CANCELADO']).withMessage('El nuevo estado proporcionado no es válido.'),
  validate,
  serviceController.transitionStatus
);

export default router;
