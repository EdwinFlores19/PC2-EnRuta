/**
 * src/services/payment.service.ts — Servicio de Pagos y Split Payments (TypeScript)
 */

import { prisma } from '../../config/database';
import { Wallet, Transaction, WalletType, PaymentMethod, TransactionStatus, Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { ConflictError, NotFoundError } from '../utils/AppError';

const PLATFORM_FEE_PERCENTAGE = 5.00; // 5% de comisión por mantenimiento de la plataforma

/**
 * Obtiene o crea la Billetera Central de la Plataforma para acumular comisiones.
 */
async function getOrCreatePlatformWallet(): Promise<Wallet> {
  // 1. Intentar buscar billetera de tipo PLATFORM
  const existingPlatformWallet = await prisma.wallet.findFirst({
    where: { type: 'PLATFORM', isDeleted: false },
  });

  if (existingPlatformWallet) {
    return existingPlatformWallet;
  }

  // 2. Si no existe, buscar o crear un usuario del sistema para la Plataforma
  const systemEmail = 'platform@vialpos.com';
  let platformUser = await prisma.user.findUnique({
    where: { email: systemEmail },
  });

  if (!platformUser) {
    logger.info('Creando usuario del sistema para la plataforma...');
    platformUser = await prisma.user.create({
      data: {
        email: systemEmail,
        password: '$2b$10$SystemUserPasswordPlaceholderDontUseThisDirectly', // dummy bcrypt hash
        name: 'Plataforma VialPOS',
        role: 'ADMIN',
        isActive: true,
      },
    });
  }

  // 3. Crear la billetera PLATFORM para este usuario
  logger.info('Creando billetera central de comisiones de tipo PLATFORM...');
  const newPlatformWallet = await prisma.wallet.create({
    data: {
      userId: platformUser.id,
      type: 'PLATFORM',
      balance: new Prisma.Decimal(0.00),
      currency: 'PEN',
      isActive: true,
    },
  });

  return newPlatformWallet;
}

/**
 * Crea una billetera de tipo MERCHANT para un usuario (trabajador) si no existe.
 */
export async function createWallet(userId: string): Promise<Wallet> {
  const existingWallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (existingWallet) {
    if (existingWallet.isDeleted) {
      // Restaurar si estaba borrada lógicamente
      return await prisma.wallet.update({
        where: { id: existingWallet.id },
        data: { isDeleted: false, isActive: true },
      });
    }
    return existingWallet;
  }

  const userExists = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userExists) {
    throw new NotFoundError('El usuario especificado no existe.');
  }

  return await prisma.wallet.create({
    data: {
      userId,
      type: 'MERCHANT',
      balance: new Prisma.Decimal(0.00),
      currency: 'PEN',
      isActive: true,
    },
  });
}

/**
 * Obtiene la billetera de un usuario.
 */
export async function getWalletByUserId(userId: string): Promise<Wallet | null> {
  return await prisma.wallet.findUnique({
    where: { userId, isDeleted: false },
  });
}

/**
 * Obtiene el balance e historial de transacciones de una billetera.
 */
export async function getWalletDetails(walletId: string) {
  const wallet = await prisma.wallet.findFirst({
    where: { id: walletId, isDeleted: false },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      transactions: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!wallet) {
    throw new NotFoundError('La billetera especificada no existe.');
  }

  return wallet;
}

/**
 * Procesa un pago inmediato Tap-to-Pay (NFC) en el teléfono del trabajador.
 */
export async function processTapToPay(
  walletId: string,
  amount: number,
  paymentMethodToken: string
): Promise<Transaction> {
  if (amount <= 0) {
    throw new ConflictError('El monto del pago debe ser mayor a cero.');
  }

  // 1. Validar billetera del comercio
  const merchantWallet = await prisma.wallet.findFirst({
    where: { id: walletId, type: 'MERCHANT', isDeleted: false },
  });

  if (!merchantWallet) {
    throw new NotFoundError('Billetera de comerciante no encontrada o inactiva.');
  }

  // 2. Obtener billetera de la plataforma
  const platformWallet = await getOrCreatePlatformWallet();

  // 3. Calcular Split Payments
  const grossAmount = new Prisma.Decimal(amount);
  const feePercentage = new Prisma.Decimal(PLATFORM_FEE_PERCENTAGE);
  const feeAmount = grossAmount.mul(feePercentage).div(100).toDecimalPlaces(2);
  const netAmount = grossAmount.sub(feeAmount);

  // Generar ID único de pasarela simulado
  const providerTxId = `ch_nfc_${Math.random().toString(36).substring(2, 15)}`;

  logger.info(`Iniciando procesamiento Tap-to-Pay por S/. ${amount}. Token: ${paymentMethodToken}. ProviderTxId: ${providerTxId}`);

  // 4. Ejecutar Transacción ACID
  const transaction = await prisma.$transaction(async (tx) => {
    // Acreditar el monto neto al comerciante
    await tx.wallet.update({
      where: { id: merchantWallet.id },
      data: { balance: { increment: netAmount } },
    });

    // Acreditar la comisión de mantenimiento a la plataforma
    await tx.wallet.update({
      where: { id: platformWallet.id },
      data: { balance: { increment: feeAmount } },
    });

    // Registrar la transacción
    return await tx.transaction.create({
      data: {
        walletId: merchantWallet.id,
        amount: grossAmount,
        netAmount,
        feeAmount,
        feePercentage,
        paymentMethod: 'NFC_TAP_TO_PAY',
        status: 'COMPLETED',
        providerTransactionId: providerTxId,
        metadata: {
          paymentMethodToken,
          gateway: 'Stripe_Terminal_TapToPay',
          processedAt: new Date().toISOString(),
        },
      },
    });
  });

  logger.info(`Transacción NFC exitosa. ID de Transacción: ${transaction.id}. Split: Merchant (+S/. ${netAmount}), Plataforma (+S/. ${feeAmount})`);
  return transaction;
}

/**
 * Inicializa un cobro mediante código QR dinámico de Yape o Plin.
 */
export async function initiateYapePlinQR(
  walletId: string,
  amount: number,
  paymentMethod: 'YAPE' | 'PLIN'
): Promise<Transaction> {
  if (amount <= 0) {
    throw new ConflictError('El monto del pago debe ser mayor a cero.');
  }

  const merchantWallet = await prisma.wallet.findFirst({
    where: { id: walletId, type: 'MERCHANT', isDeleted: false },
  });

  if (!merchantWallet) {
    throw new NotFoundError('Billetera de comerciante no encontrada o inactiva.');
  }

  const grossAmount = new Prisma.Decimal(amount);
  const feePercentage = new Prisma.Decimal(PLATFORM_FEE_PERCENTAGE);
  const feeAmount = grossAmount.mul(feePercentage).div(100).toDecimalPlaces(2);
  const netAmount = grossAmount.sub(feeAmount);

  // Referencia simulada de transacción Yape/Plin
  const providerTxId = `tx_qr_${paymentMethod.toLowerCase()}_${Math.random().toString(36).substring(2, 15)}`;

  // Simular la URL del QR dinámico que contiene el deep link de Yape/Plin
  const qrCodeUrl = `https://api.vialpos.com/qrcodes/${providerTxId}.png?amount=${amount}&currency=PEN&merchant=${encodeURIComponent(merchantWallet.id)}`;

  const transaction = await prisma.transaction.create({
    data: {
      walletId: merchantWallet.id,
      amount: grossAmount,
      netAmount,
      feeAmount,
      feePercentage,
      paymentMethod: paymentMethod as PaymentMethod,
      status: 'PENDING',
      providerTransactionId: providerTxId,
      qrCodeUrl,
      metadata: {
        paymentMethod,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // expira en 5 min
      },
    },
  });

  logger.info(`Cobro QR ${paymentMethod} inicializado por S/. ${amount}. ID Transacción: ${transaction.id}`);
  return transaction;
}

/**
 * Procesa el Webhook seguro de confirmación de Yape/Plin.
 */
export async function processYapePlinWebhook(
  providerTransactionId: string,
  status: 'COMPLETED' | 'FAILED',
  metadata: any = {}
): Promise<Transaction | null> {
  // 1. Buscar la transacción pendiente
  const existingTx = await prisma.transaction.findUnique({
    where: { providerTransactionId },
  });

  if (!existingTx) {
    throw new NotFoundError(`Transacción con ID de proveedor ${providerTransactionId} no encontrada.`);
  }

  // Idempotencia: Si ya está completada o fallida, no volver a procesar balances
  if (existingTx.status !== 'PENDING') {
    logger.info(`Webook repetido para transacción ${existingTx.id}. Estado actual: ${existingTx.status}. Omitiendo reprocesamiento.`);
    return existingTx;
  }

  if (status === 'FAILED') {
    return await prisma.transaction.update({
      where: { id: existingTx.id },
      data: {
        status: 'FAILED',
        metadata: {
          ...(existingTx.metadata as object),
          failedAt: new Date().toISOString(),
          errorDetails: metadata.errorDetails || 'El usuario canceló el pago',
        },
      },
    });
  }

  // 2. Obtener billetera de la plataforma
  const platformWallet = await getOrCreatePlatformWallet();

  // 3. Ejecutar transacción ACID de Split Payment
  logger.info(`Webhook de pago confirmado recibido para transacción QR ${existingTx.id}. Procesando transferencias de saldos...`);
  
  const completedTransaction = await prisma.$transaction(async (tx) => {
    // Incrementar balance del comerciante
    await tx.wallet.update({
      where: { id: existingTx.walletId },
      data: { balance: { increment: existingTx.netAmount } },
    });

    // Incrementar balance de comisión de plataforma
    await tx.wallet.update({
      where: { id: platformWallet.id },
      data: { balance: { increment: existingTx.feeAmount } },
    });

    // Actualizar estado de la transacción
    return await tx.transaction.update({
      where: { id: existingTx.id },
      data: {
        status: 'COMPLETED',
        metadata: {
          ...(existingTx.metadata as object),
          webhookPayload: metadata,
          confirmedAt: new Date().toISOString(),
        },
      },
    });
  });

  logger.info(`Transacción QR ${completedTransaction.id} de tipo ${completedTransaction.paymentMethod} procesada con éxito. Split: Merchant (+S/. ${completedTransaction.netAmount}), Plataforma (+S/. ${completedTransaction.feeAmount})`);
  return completedTransaction;
}
