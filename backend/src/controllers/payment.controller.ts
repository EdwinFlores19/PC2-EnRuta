/**
 * src/controllers/payment.controller.ts — Controlador de Pagos (TypeScript)
 */

import { Request, Response } from 'express';
import { asyncHandler, buildResponse } from '../utils/index';
import * as paymentService from '../services/payment.service';
import { NotFoundError } from '../utils/AppError';

/**
 * Crea una billetera para un usuario.
 * POST /api/v1/payments/wallet
 */
export const createWallet = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.body.userId || (req as any).user?.id;
  
  if (!userId) {
    return res.status(400).json({
      status: 'error',
      message: 'El identificador de usuario ("userId") es obligatorio.',
    });
  }

  const wallet = await paymentService.createWallet(userId);
  res.status(201).json(
    buildResponse(wallet, 'Billetera digital habilitada con éxito.')
  );
});

/**
 * Obtiene la billetera del usuario autenticado (o crea una por defecto).
 * GET /api/v1/payments/wallet/my
 */
export const getMyWallet = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({
      status: 'error',
      message: 'Usuario no autenticado o token inválido.',
    });
  }

  let wallet = await paymentService.getWalletByUserId(userId);

  if (!wallet) {
    // Proactividad SRE: Si el usuario no tiene billetera, creársela automáticamente en caliente
    wallet = await paymentService.createWallet(userId);
  }

  const walletDetails = await paymentService.getWalletDetails(wallet.id);
  res.status(200).json(
    buildResponse(walletDetails, 'Billetera digital del usuario obtenida correctamente.')
  );
});

/**
 * Obtiene los detalles e historial transaccional de una billetera por ID.
 * GET /api/v1/payments/wallet/:id
 */
export const getWalletById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const walletDetails = await paymentService.getWalletDetails(id);
  res.status(200).json(
    buildResponse(walletDetails, 'Detalles de la billetera obtenidos correctamente.')
  );
});

/**
 * Procesa cobro Tap-to-Pay (NFC Contactless).
 * POST /api/v1/payments/tap-to-pay
 */
export const processTapToPay = asyncHandler(async (req: Request, res: Response) => {
  const { walletId, amount, token } = req.body;

  const transaction = await paymentService.processTapToPay(walletId, Number(amount), token);
  res.status(200).json(
    buildResponse(transaction, 'Pago NFC Tap-to-Pay procesado y liquidado con éxito.')
  );
});

/**
 * Inicializa cobro Yape/Plin mediante QR Dinámico.
 * POST /api/v1/payments/yape-plin/qr
 */
export const initiateYapePlinQR = asyncHandler(async (req: Request, res: Response) => {
  const { walletId, amount, paymentMethod } = req.body;

  if (paymentMethod !== 'YAPE' && paymentMethod !== 'PLIN') {
    return res.status(400).json({
      status: 'error',
      message: 'Método de pago inválido. Debe ser "YAPE" o "PLIN".',
    });
  }

  const transaction = await paymentService.initiateYapePlinQR(walletId, Number(amount), paymentMethod);
  res.status(201).json(
    buildResponse(transaction, 'Código QR dinámico emitido correctamente.')
  );
});

/**
 * Webhook seguro para confirmación asíncrona de pagos Yape/Plin.
 * POST /api/v1/payments/webhooks/yape-plin
 */
export const yapePlinWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { providerTransactionId, status, metadata } = req.body;

  if (!providerTransactionId || !status) {
    return res.status(400).json({
      status: 'error',
      message: 'Campos "providerTransactionId" y "status" son obligatorios.',
    });
  }

  if (status !== 'COMPLETED' && status !== 'FAILED') {
    return res.status(400).json({
      status: 'error',
      message: 'El estado debe ser "COMPLETED" o "FAILED".',
    });
  }

  const transaction = await paymentService.processYapePlinWebhook(
    providerTransactionId,
    status,
    metadata
  );

  res.status(200).json(
    buildResponse(transaction, 'Notificación de Webhook procesada e integrada con éxito.')
  );
});
