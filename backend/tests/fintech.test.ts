/**
 * tests/fintech.test.ts — Pruebas Unitarias para el Módulo de Pagos e Idempotencia (TypeScript)
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Prisma } from '@prisma/client';

// Mock de Prisma Client
const mockPrisma: any = {
  $connect: jest.fn() as any,
  $disconnect: jest.fn() as any,
  $on: jest.fn() as any,
  $queryRaw: jest.fn() as any,
  wallet: {
    findFirst: jest.fn() as any,
    findUnique: jest.fn() as any,
    create: jest.fn() as any,
    update: jest.fn() as any,
  },
  user: {
    findUnique: jest.fn() as any,
    create: jest.fn() as any,
  },
  transaction: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    update: jest.fn() as any,
  },
  $transaction: jest.fn() as any,
};

// Mockear la base de datos
jest.mock('../config/database', () => ({
  prisma: mockPrisma,
  connectDatabase: jest.fn() as any,
  disconnectDatabase: jest.fn() as any,
}));

import * as paymentService from '../src/services/payment.service';

describe('Ecosistema de Pagos y Split Payments (Fintech)', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cálculo de Split Payments e Integridad Atómica (NFC)', () => {
    it('Debe calcular correctamente la comisión del 5% y el monto neto para el comercio', async () => {
      const mockMerchantWallet = {
        id: 'merchant-wallet-uuid',
        userId: 'worker-user-uuid',
        balance: new Prisma.Decimal(10.00),
        currency: 'PEN',
        type: 'MERCHANT',
        isActive: true,
      };

      const mockPlatformWallet = {
        id: 'platform-wallet-uuid',
        userId: 'platform-user-uuid',
        balance: new Prisma.Decimal(0.00),
        currency: 'PEN',
        type: 'PLATFORM',
        isActive: true,
      };

      // Mockear búsquedas de billeteras
      mockPrisma.wallet.findFirst.mockResolvedValueOnce(mockMerchantWallet); // Merchant
      mockPrisma.wallet.findFirst.mockResolvedValueOnce(mockPlatformWallet); // Platform (primero busca existente)

      // Simular $transaction ejecutando la función callback de inmediato con un tx mockeado
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          wallet: {
            update: (jest.fn() as any).mockResolvedValue({}),
          },
          transaction: {
            create: jest.fn().mockImplementation((args: any) => ({
              id: 'tx-uuid-123',
              ...args.data,
            })),
          },
        };
        return await callback(txMock);
      });

      const amount = 100.00; // S/. 100
      const token = 'tok_nfc_visa_test';

      const transaction = await paymentService.processTapToPay(
        mockMerchantWallet.id,
        amount,
        token
      );

      // Verificaciones
      expect(transaction).toBeDefined();
      expect(transaction.amount.toString()).toBe('100');
      // Comisión de plataforma es 5%: S/. 5.00
      expect(transaction.feeAmount.toString()).toBe('5');
      // Monto neto es 95%: S/. 95.00
      expect(transaction.netAmount.toString()).toBe('95');
      expect(transaction.status).toBe('COMPLETED');
      expect(transaction.paymentMethod).toBe('NFC_TAP_TO_PAY');
    });
  });

  describe('Idempotencia del Webhook de Pagos Yape / Plin', () => {
    it('Debe ignorar o procesar sin duplicar saldos una notificación repetida de Webhook exitoso', async () => {
      const providerTxId = 'tx_qr_yape_abc123';
      
      const mockExistingTransaction = {
        id: 'tx-uuid-456',
        walletId: 'merchant-wallet-uuid',
        amount: new Prisma.Decimal(50.00),
        netAmount: new Prisma.Decimal(47.50), // 95%
        feeAmount: new Prisma.Decimal(2.50),  // 5%
        feePercentage: new Prisma.Decimal(5.00),
        paymentMethod: 'YAPE',
        status: 'COMPLETED', // Ya se procesó en el pasado
        providerTransactionId: providerTxId,
        metadata: { paymentMethod: 'YAPE' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 1. Simular que la transacción ya se encuentra COMPLETED
      mockPrisma.transaction.findUnique.mockResolvedValue(mockExistingTransaction);

      // Ejecutar el webhook para la misma transacción
      const result = await paymentService.processYapePlinWebhook(
        providerTxId,
        'COMPLETED',
        { paymentMethod: 'YAPE' }
      );

      // Verificaciones de Idempotencia:
      expect(result).toBeDefined();
      expect(result?.status).toBe('COMPLETED');
      // No debe volver a llamar a $transaction para modificar saldos
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('Debe procesar el Webhook y actualizar saldos la primera vez que se reciba como PENDING', async () => {
      const providerTxId = 'tx_qr_yape_new';
      
      const mockPendingTransaction = {
        id: 'tx-uuid-789',
        walletId: 'merchant-wallet-uuid',
        amount: new Prisma.Decimal(50.00),
        netAmount: new Prisma.Decimal(47.50),
        feeAmount: new Prisma.Decimal(2.50),
        feePercentage: new Prisma.Decimal(5.00),
        paymentMethod: 'YAPE',
        status: 'PENDING', // PENDIENTE: debe procesarse
        providerTransactionId: providerTxId,
        metadata: { paymentMethod: 'YAPE' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPlatformWallet = {
        id: 'platform-wallet-uuid',
        userId: 'platform-user-uuid',
        balance: new Prisma.Decimal(0.00),
        currency: 'PEN',
        type: 'PLATFORM',
        isActive: true,
      };

      // Mockear llamadas
      mockPrisma.transaction.findUnique.mockResolvedValue(mockPendingTransaction);
      mockPrisma.wallet.findFirst.mockResolvedValue(mockPlatformWallet);

      // Simular $transaction
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          wallet: {
            update: (jest.fn() as any).mockResolvedValue({}),
          },
          transaction: {
            update: (jest.fn() as any).mockImplementation((args: any) => ({
              ...mockPendingTransaction,
              status: args.data.status,
              metadata: args.data.metadata,
            })),
          },
        };
        return await callback(txMock);
      });

      // Ejecutar webhook de primera vez
      const result = await paymentService.processYapePlinWebhook(
        providerTxId,
        'COMPLETED',
        { phone: '993812831' }
      );

      // Verificaciones:
      expect(result).toBeDefined();
      expect(result?.status).toBe('COMPLETED');
      // Sí debe ejecutar transacciones sobre las billeteras
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
