import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockPrisma: any = {
  $connect: jest.fn() as any,
  $disconnect: jest.fn() as any,
  $on: jest.fn() as any,
  user: {
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    create: jest.fn() as any,
    update: jest.fn() as any,
    count: jest.fn() as any,
  },
  identityVerification: {
    findUnique: jest.fn() as any,
    upsert: jest.fn() as any,
    count: jest.fn() as any,
  },
  formalizationProfile: {
    findUnique: jest.fn() as any,
    upsert: jest.fn() as any,
    count: jest.fn() as any,
  },
  educationalProgress: {
    findMany: jest.fn() as any,
    upsert: jest.fn() as any,
  },
  course: {
    findMany: jest.fn() as any,
    findUnique: jest.fn() as any,
  },
  wallet: {
    findUnique: jest.fn() as any,
    upsert: jest.fn() as any,
  },
  sUNATAuditLog: {
    findMany: jest.fn() as any,
  }
};

jest.mock('../config/database', () => ({
  prisma: mockPrisma,
  connectDatabase: jest.fn() as any,
  disconnectDatabase: jest.fn() as any,
}));

// Mock auth middleware to bypass auth during test
jest.mock('../src/middlewares/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@example.com', role: 'USER', isActive: true };
    next();
  },
  authorize: (...roles: string[]) => (req: any, res: any, next: any) => {
    next();
  },
}));

import request from 'supertest';
import app from '../server';

describe('Formalization Module (LegalTech & B2G)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/formalization/kyc', () => {
    it('debería bloquear absolutamente a menores de 14 años y retornar canales de apoyo (MIMP/DEMUNA)', async () => {
      // Configurar fecha de nacimiento de menor (10 años atrás)
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      const birthDateStr = tenYearsAgo.toISOString().split('T')[0];

      mockPrisma.identityVerification.findUnique.mockResolvedValue(null);
      mockPrisma.identityVerification.upsert.mockResolvedValue({ status: 'BLOCKED_UNDERAGE' });
      mockPrisma.formalizationProfile.upsert.mockResolvedValue({ score: 0, semaphoreColor: 'RED' });

      const res = await request(app)
        .post('/api/v1/formalization/kyc')
        .send({
          documentType: 'DNI',
          documentNumber: '71234567',
          birthDate: birthDateStr
        });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('blocked');
      expect(res.body.canalesAyuda).toHaveProperty('ministerioMujer');
      expect(res.body.canalesAyuda).toHaveProperty('demuna');
      expect(res.body.message).toContain('prohíbe el registro de menores de 14 años');
    });

    it('debería dejar registro de adolescente de 14 a 17 años en PENDIENTE DE APROBACIÓN para subir documento de MINTRA', async () => {
      // Configurar fecha de nacimiento de adolescente (15 años atrás)
      const fifteenYearsAgo = new Date();
      fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
      const birthDateStr = fifteenYearsAgo.toISOString().split('T')[0];

      mockPrisma.identityVerification.findUnique.mockResolvedValue(null);
      mockPrisma.identityVerification.upsert.mockResolvedValue({ status: 'PENDING_APPROVAL' });
      mockPrisma.formalizationProfile.upsert.mockResolvedValue({ score: 0, semaphoreColor: 'RED' });

      const res = await request(app)
        .post('/api/v1/formalization/kyc')
        .send({
          documentType: 'DNI',
          documentNumber: '77654321',
          birthDate: birthDateStr
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.requiresAuthorization).toBe(true);
      expect(res.body.data.verification.status).toBe('PENDING_APPROVAL');
    });

    it('debería aprobar inmediatamente a adultos de 18 años o más y calcular su puntaje', async () => {
      // Configurar fecha de nacimiento de adulto (25 años atrás)
      const adultAge = new Date();
      adultAge.setFullYear(adultAge.getFullYear() - 25);
      const birthDateStr = adultAge.toISOString().split('T')[0];

      mockPrisma.identityVerification.findUnique.mockResolvedValue(null);
      mockPrisma.identityVerification.upsert.mockResolvedValue({ status: 'APPROVED', selfieUrl: 'https://test.com/selfie.jpg' });
      mockPrisma.wallet.upsert.mockResolvedValue({});
      mockPrisma.educationalProgress.findMany.mockResolvedValue([]);
      mockPrisma.wallet.findUnique.mockResolvedValue(null); // Sin wallet previa para pilar financiero
      mockPrisma.formalizationProfile.upsert.mockResolvedValue({ score: 24, semaphoreColor: 'RED' });

      const res = await request(app)
        .post('/api/v1/formalization/kyc')
        .send({
          documentType: 'DNI',
          documentNumber: '12345678',
          birthDate: birthDateStr,
          selfieUrl: 'https://test.com/selfie.jpg'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.verification.status).toBe('APPROVED');
      expect(res.body.data.gamification).toHaveProperty('score');
      expect(res.body.data.gamification).toHaveProperty('semaphoreColor');
    });
  });

  describe('POST /api/v1/formalization/ruc', () => {
    it('debería fallar si el RUC no tiene 11 dígitos', async () => {
      const res = await request(app)
        .post('/api/v1/formalization/ruc')
        .send({ rucNumber: '123' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('debería validar con éxito un RUC válido de 11 dígitos y retornar datos de SUNAT', async () => {
      mockPrisma.identityVerification.findUnique.mockResolvedValue({ status: 'APPROVED', selfieUrl: 'https://test.com/selfie.jpg' });
      mockPrisma.educationalProgress.findMany.mockResolvedValue([]);
      mockPrisma.wallet.findUnique.mockResolvedValue(null);
      mockPrisma.formalizationProfile.upsert.mockResolvedValue({
        rucNumber: '10712345678',
        isRucValidated: true,
        score: 30,
        semaphoreColor: 'RED'
      });

      const res = await request(app)
        .post('/api/v1/formalization/ruc')
        .send({ rucNumber: '10712345678' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.sunatData.estado).toBe('ACTIVO');
      expect(res.body.data.sunatData.condicion).toBe('HABIDO');
      expect(res.body.data.formalizationProfile.isRucValidated).toBe(true);
    });
  });

  describe('GET /api/v1/formalization/metrics', () => {
    it('debería retornar métricas agregadas del distrito para administradores municipales', async () => {
      mockPrisma.formalizationProfile.count
        .mockResolvedValueOnce(10)  // Total profiles
        .mockResolvedValueOnce(5)   // RED
        .mockResolvedValueOnce(3)   // YELLOW
        .mockResolvedValueOnce(2)   // GREEN
        .mockResolvedValueOnce(2)   // RUC validated count
        .mockResolvedValueOnce(1);  // B2B hired count

      mockPrisma.identityVerification.count
        .mockResolvedValueOnce(0)   // Underage blocked
        .mockResolvedValueOnce(1);  // Underage pending

      const res = await request(app)
        .get('/api/v1/formalization/metrics');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('KPIs');
      expect(res.body.data).toHaveProperty('distribucionSemaforo');
      expect(res.body.data.KPIs.tasaTransicionSocial).toBe(50.00); // (3+2)/10 * 100
    });
  });
});
