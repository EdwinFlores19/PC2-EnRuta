/**
 * service.test.ts — Suite de pruebas de integración para el motor de asignación vial
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { RequestStatus, TrafficLightColor } from '@prisma/client';

// 1. Mock de Prisma
const mockPrisma: any = {
  $connect: jest.fn() as any,
  $disconnect: jest.fn() as any,
  $on: jest.fn() as any,
  $queryRaw: jest.fn() as any,
  $transaction: jest.fn((cb: any) => cb(mockPrisma)) as any,
  user: {
    findUnique: jest.fn() as any,
  },
  workerProfile: {
    update: jest.fn() as any,
  },
  intersection: {
    findUnique: jest.fn() as any,
    update: jest.fn() as any,
  },
  serviceRequest: {
    findUnique: jest.fn() as any,
    findFirst: jest.fn() as any,
    create: jest.fn() as any,
    update: jest.fn() as any,
    count: jest.fn() as any,
    findMany: jest.fn() as any,
  },
};

jest.mock('../config/database', () => ({
  prisma: mockPrisma,
  connectDatabase: jest.fn() as any,
  disconnectDatabase: jest.fn() as any,
}));

import { ServiceService } from '../src/services/service.service';
import { AppError } from '../src/utils/AppError';

describe('ServiceService — Motor de Asignación y Semáforos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findNearbyWorkers', () => {
    it('debería ejecutar el query de Haversine y retornar trabajadores cercanos', async () => {
      const mockWorkers = [
        { id: '1', userId: 'w1', workerName: 'Carlos Mendoza', distance: 45 },
        { id: '2', userId: 'w2', workerName: 'Luis Gómez', distance: 120 },
      ];
      mockPrisma.$queryRaw.mockResolvedValueOnce(mockWorkers);

      const result = await ServiceService.findNearbyWorkers(-12.0945, -77.0335, 1000);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].workerName).toBe('Carlos Mendoza');
      expect(result[0].distance).toBe(45);
    });
  });

  describe('createServiceRequest', () => {
    it('debería crear una solicitud correctamente', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'p1', name: 'Peatón Carlos' });
      mockPrisma.intersection.findUnique.mockResolvedValueOnce({ id: 'int1', name: 'Esquina A' });
      mockPrisma.serviceRequest.findFirst.mockResolvedValueOnce(null); // Sin solicitudes activas
      mockPrisma.serviceRequest.create.mockResolvedValueOnce({
        id: 'req1',
        pedestrianId: 'p1',
        intersectionId: 'int1',
        status: RequestStatus.BUSCANDO,
      });

      const result = await ServiceService.createServiceRequest('p1', 'int1', -12.0945, -77.0335);

      expect(result.status).toBe(RequestStatus.BUSCANDO);
      expect(mockPrisma.serviceRequest.create).toHaveBeenCalled();
    });

    it('debería lanzar conflicto si el peatón ya tiene una solicitud activa', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'p1', name: 'Peatón Carlos' });
      mockPrisma.intersection.findUnique.mockResolvedValueOnce({ id: 'int1', name: 'Esquina A' });
      mockPrisma.serviceRequest.findFirst.mockResolvedValueOnce({ id: 'req_active', status: RequestStatus.ASIGNADO });

      await expect(
        ServiceService.createServiceRequest('p1', 'int1', -12.0945, -77.0335)
      ).rejects.toThrow(AppError);
    });
  });

  describe('transitionStatus — Restricción de Semáforo', () => {
    it('debería permitir cambiar a EN_EJECUCION solo si el semáforo está en ROJO', async () => {
      // Mock de la solicitud en camino con semáforo en ROJO
      mockPrisma.serviceRequest.findUnique.mockResolvedValueOnce({
        id: 'req1',
        pedestrianId: 'p1',
        workerId: 'w1',
        status: RequestStatus.EN_CAMINO,
        intersection: { id: 'int1', lightColor: TrafficLightColor.RED },
      });

      mockPrisma.serviceRequest.update.mockResolvedValueOnce({
        id: 'req1',
        status: RequestStatus.EN_EJECUCION,
        lightColorSnapshot: TrafficLightColor.RED,
      });

      const result = await ServiceService.transitionStatus('req1', RequestStatus.EN_EJECUCION, 'w1', 'WORKER');

      expect(result.status).toBe(RequestStatus.EN_EJECUCION);
      expect(result.lightColorSnapshot).toBe(TrafficLightColor.RED);
    });

    it('debería bloquear la transición a EN_EJECUCION si el semáforo está en VERDE', async () => {
      // Mock de la solicitud en camino con semáforo en VERDE
      mockPrisma.serviceRequest.findUnique.mockResolvedValueOnce({
        id: 'req1',
        pedestrianId: 'p1',
        workerId: 'w1',
        status: RequestStatus.EN_CAMINO,
        intersection: { id: 'int1', lightColor: TrafficLightColor.GREEN },
      });

      await expect(
        ServiceService.transitionStatus('req1', RequestStatus.EN_EJECUCION, 'w1', 'WORKER')
      ).rejects.toThrow(AppError);

      expect(mockPrisma.serviceRequest.update).not.toHaveBeenCalled();
    });
  });

  describe('triggerSOS', () => {
    it('debería cambiar el estado a EN_PELIGRO y emitir un log crítico', async () => {
      mockPrisma.serviceRequest.findUnique.mockResolvedValueOnce({
        id: 'req1',
        pedestrianId: 'p1',
        workerId: 'w1',
        status: RequestStatus.EN_CAMINO,
        intersection: { id: 'int1', name: 'Intersección SRE' },
      });

      mockPrisma.serviceRequest.update.mockResolvedValueOnce({
        id: 'req1',
        pedestrianId: 'p1',
        workerId: 'w1',
        status: RequestStatus.EN_PELIGRO,
        intersection: { id: 'int1', name: 'Intersección SRE' },
        worker: { name: 'Carlos Mendoza' },
      });

      const result = await ServiceService.triggerSOS('req1', -12.0945, -77.0335, 'w1');

      expect(result.status).toBe(RequestStatus.EN_PELIGRO);
      expect(mockPrisma.serviceRequest.update).toHaveBeenCalledWith({
        where: { id: 'req1' },
        data: { status: RequestStatus.EN_PELIGRO },
        include: expect.any(Object),
      });
    });

    it('debería denegar el SOS si el usuario solicitante no está asignado al servicio', async () => {
      mockPrisma.serviceRequest.findUnique.mockResolvedValueOnce({
        id: 'req1',
        pedestrianId: 'p1',
        workerId: 'w1',
        status: RequestStatus.EN_CAMINO,
      });

      await expect(
        ServiceService.triggerSOS('req1', -12.0945, -77.0335, 'unauthorized_user_id')
      ).rejects.toThrow(AppError);
    });
  });

  describe('syncOfflineOperations', () => {
    it('debería procesar transacciones batch de forma exitosa y atómica', async () => {
      mockPrisma.serviceRequest.findUnique.mockResolvedValueOnce({
        id: 'req_offline_1',
        pedestrianId: 'p1',
        workerId: 'w1',
        status: RequestStatus.EN_EJECUCION,
      });

      const operations = [
        {
          type: 'PATCH_STATUS',
          payload: { id: 'req_offline_1', status: RequestStatus.FINALIZADO },
        },
      ];

      const result = await ServiceService.syncOfflineOperations(operations, 'w1', 'WORKER');

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);
      expect(mockPrisma.serviceRequest.update).toHaveBeenCalled();
    });

    it('debería fallar la transacción entera (rollback) si una operación del lote es inválida', async () => {
      mockPrisma.serviceRequest.findUnique.mockResolvedValueOnce({
        id: 'req_offline_1',
        pedestrianId: 'p1',
        workerId: 'w1',
        status: RequestStatus.EN_EJECUCION,
      });

      const operations = [
        {
          type: 'PATCH_STATUS',
          payload: { id: 'req_offline_1', status: RequestStatus.FINALIZADO },
        },
        {
          type: 'UNSUPPORTED_OP_TYPE',
          payload: {},
        },
      ];

      await expect(
        ServiceService.syncOfflineOperations(operations, 'w1', 'WORKER')
      ).rejects.toThrow(AppError);
    });
  });
});
