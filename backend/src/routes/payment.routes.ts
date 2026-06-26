/**
 * src/routes/payment.routes.ts — Rutas de Pagos, POS NFC y Billeteras Digitales (TypeScript)
 */

import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

/**
 * @route   POST /api/v1/payments/wallet
 * @desc    Crear una nueva billetera digital
 * @access  Privado (Autenticado)
 */
router.post('/wallet',
  authenticate,
  body('userId').optional().isUUID().withMessage('El ID de usuario debe ser un UUID válido.'),
  validate,
  paymentController.createWallet
);

/**
 * @route   GET /api/v1/payments/wallet/my
 * @desc    Obtener la billetera del usuario autenticado
 * @access  Privado (Autenticado)
 */
router.get('/wallet/my',
  authenticate,
  paymentController.getMyWallet
);

/**
 * @route   GET /api/v1/payments/wallet/:id
 * @desc    Obtener detalles de una billetera por ID
 * @access  Privado (Autenticado)
 */
router.get('/wallet/:id',
  authenticate,
  param('id').isUUID().withMessage('El ID de billetera debe ser un UUID válido.'),
  validate,
  paymentController.getWalletById
);

/**
 * @route   POST /api/v1/payments/tap-to-pay
 * @desc    Procesar pago por NFC Tap-to-Pay en el celular
 * @access  Privado (Autenticado)
 */
router.post('/tap-to-pay',
  authenticate,
  body('walletId').isUUID().withMessage('El ID de billetera debe ser un UUID válido.'),
  body('amount').isNumeric().withMessage('El monto debe ser numérico.').custom(val => Number(val) > 0).withMessage('El monto debe ser mayor a cero.'),
  body('token').trim().notEmpty().withMessage('El token de pago seguro NFC es obligatorio.'),
  validate,
  paymentController.processTapToPay
);

/**
 * @route   POST /api/v1/payments/yape-plin/qr
 * @desc    Emitir un QR dinámico para cobro mediante Yape o Plin
 * @access  Privado (Autenticado)
 */
router.post('/yape-plin/qr',
  authenticate,
  body('walletId').isUUID().withMessage('El ID de billetera debe ser un UUID válido.'),
  body('amount').isNumeric().withMessage('El monto debe ser numérico.').custom(val => Number(val) > 0).withMessage('El monto debe ser mayor a cero.'),
  body('paymentMethod').isIn(['YAPE', 'PLIN']).withMessage('El método de pago debe ser "YAPE" o "PLIN".'),
  validate,
  paymentController.initiateYapePlinQR
);

/**
 * @route   POST /api/v1/payments/webhooks/yape-plin
 * @desc    Webhook seguro para recibir confirmaciones de Yape/Plin
 * @access  Público (Para el proveedor de pagos)
 */
router.post('/webhooks/yape-plin',
  body('providerTransactionId').trim().notEmpty().withMessage('El providerTransactionId es requerido.'),
  body('status').isIn(['COMPLETED', 'FAILED']).withMessage('El estado debe ser COMPLETED o FAILED.'),
  validate,
  paymentController.yapePlinWebhook
);

export default router;
