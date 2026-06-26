/**
 * src/services/service.service.ts — Servicio de Negocio para el Motor de Asignación por Proximidad (TypeScript)
 */

import { prisma } from '../../config/database';
import { AppError } from '../utils/AppError';
import { RequestStatus, TrafficLightColor } from '@prisma/client';

export interface NearbyWorker {
  id: string;
  userId: string;
  workerName: string;
  email: string;
  latitude: number;
  longitude: number;
  distance: number;
}

/**
 * Servicio para gestionar la lógica de proximidad, semáforos y solicitudes de servicio vial
 */
export class ServiceService {
  /**
   * Encuentra los trabajadores disponibles en un radio específico usando Haversine optimizado
   */
  static async findNearbyWorkers(
    latitude: number,
    longitude: number,
    radiusInMeters: number = 1000
  ): Promise<NearbyWorker[]> {
    // Delta aproximado para pre-filtro de caja de contención (Bounding Box)
    // 1 grado latitud ~ 111,000m
    const latDelta = radiusInMeters / 111000;
    // 1 grado longitud ~ 111,000m * cos(lat)
    const cosLat = Math.cos((latitude * Math.PI) / 180);
    const lngDelta = radiusInMeters / (111000 * cosLat);

    const minLat = latitude - latDelta;
    const maxLat = latitude + latDelta;
    const minLng = longitude - lngDelta;
    const maxLng = longitude + lngDelta;

    // Haversine query optimizado con bounding box para usar índices B-Tree en lat/lng
    return prisma.$queryRaw<NearbyWorker[]>`
      SELECT 
        wp.id, 
        wp."userId", 
        u.name AS "workerName",
        u.email,
        wp.latitude, 
        wp.longitude,
        (6371000 * acos(
          cos(radians(${latitude})) * cos(radians(wp.latitude)) * 
          cos(radians(wp.longitude) - radians(${longitude})) + 
          sin(radians(${latitude})) * sin(radians(wp.latitude))
        )) AS distance
      FROM worker_profiles wp
      JOIN users u ON wp."userId" = u.id
      WHERE wp."isAvailable" = true
        AND u."isActive" = true
        AND wp.latitude BETWEEN ${minLat} AND ${maxLat}
        AND wp.longitude BETWEEN ${minLng} AND ${maxLng}
      GROUP BY wp.id, u.name, u.email
      HAVING (
        6371000 * acos(
          cos(radians(${latitude})) * cos(radians(wp.latitude)) * 
          cos(radians(wp.longitude) - radians(${longitude})) + 
          sin(radians(${latitude})) * sin(radians(wp.latitude))
        )
      ) <= ${radiusInMeters}
      ORDER BY distance ASC;
    `;
  }

  /**
   * Crea una nueva solicitud de asistencia vial para un peatón
   */
  static async createServiceRequest(
    pedestrianId: string,
    intersectionId: string,
    startLatitude: number,
    startLongitude: number
  ) {
    const pedestrian = await prisma.user.findUnique({ where: { id: pedestrianId } });
    if (!pedestrian) throw new AppError('El peatón especificado no existe.', 404);

    const intersection = await prisma.intersection.findUnique({ where: { id: intersectionId } });
    if (!intersection) throw new AppError('La intersección especificada no existe.', 404);

    // Verificar si ya tiene una solicitud activa (no finalizada ni cancelada)
    const activeRequest = await prisma.serviceRequest.findFirst({
      where: {
        pedestrianId,
        status: {
          notIn: [RequestStatus.FINALIZADO, RequestStatus.CANCELADO],
        },
        isDeleted: false,
      },
    });

    if (activeRequest) {
      throw new AppError('Ya tienes una solicitud de asistencia activa en curso.', 409);
    }

    return prisma.serviceRequest.create({
      data: {
        pedestrianId,
        intersectionId,
        startLatitude,
        startLongitude,
        status: RequestStatus.BUSCANDO,
      },
      include: {
        pedestrian: { select: { id: true, name: true, email: true } },
        intersection: true,
      },
    });
  }

  /**
   * Permite a un trabajador vial aceptar una solicitud de servicio (Asignación)
   */
  static async assignWorker(requestId: string, workerUserId: string) {
    const worker = await prisma.user.findUnique({
      where: { id: workerUserId },
      include: { workerProfile: true },
    });

    if (!worker || worker.role !== 'WORKER') {
      throw new AppError('El usuario especificado no es un trabajador vial registrado.', 403);
    }

    if (!worker.workerProfile || !worker.workerProfile.isAvailable) {
      throw new AppError('El trabajador no tiene un perfil activo o no está disponible.', 400);
    }

    return prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.findUnique({
        where: { id: requestId },
      });

      if (!request || request.isDeleted) throw new AppError('La solicitud de servicio no existe.', 404);
      if (request.status !== RequestStatus.BUSCANDO) {
        throw new AppError('Esta solicitud ya ha sido tomada por otro asistente o ya no está disponible.', 400);
      }

      // 1. Asignar el trabajador a la solicitud
      const updatedRequest = await tx.serviceRequest.update({
        where: { id: requestId },
        data: {
          workerId: workerUserId,
          status: RequestStatus.ASIGNADO,
          assignedAt: new Date(),
        },
        include: {
          pedestrian: { select: { id: true, name: true, email: true } },
          worker: { select: { id: true, name: true, email: true } },
          intersection: true,
        },
      });

      // 2. Marcar al trabajador como no disponible
      await tx.workerProfile.update({
        where: { userId: workerUserId },
        data: { isAvailable: false },
      });

      return updatedRequest;
    });
  }

  /**
   * Avanza el flujo de estados del viaje (En Camino, En Ejecución, Finalizado, Cancelado)
   */
  static async transitionStatus(
    requestId: string,
    newStatus: RequestStatus,
    userId: string,
    userRole: string
  ) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.findUnique({
        where: { id: requestId },
        include: { intersection: true },
      });

      if (!request || request.isDeleted) throw new AppError('La solicitud de servicio no existe.', 404);

      const isPedestrian = request.pedestrianId === userId;
      const isWorker = request.workerId === userId;
      const isAdmin = userRole === 'ADMIN';

      if (!isPedestrian && !isWorker && !isAdmin) {
        throw new AppError('No tienes permisos para modificar este servicio.', 403);
      }

      // Validar transiciones de estado
      const currentStatus = request.status;

      if (newStatus === RequestStatus.CANCELADO) {
        // Se puede cancelar en cualquier estado previo a la ejecución o finalización
        if (currentStatus === RequestStatus.EN_EJECUCION || currentStatus === RequestStatus.FINALIZADO) {
          throw new AppError('No se puede cancelar un servicio que ya está en ejecución o finalizado.', 400);
        }

        // Si ya tenía un trabajador asignado, liberarlo
        if (request.workerId) {
          await tx.workerProfile.update({
            where: { userId: request.workerId },
            data: { isAvailable: true },
          });
        }

        return tx.serviceRequest.update({
          where: { id: requestId },
          data: {
            status: RequestStatus.CANCELADO,
            cancelledAt: new Date(),
          },
        });
      }

      // Validación de flujo de estado secuencial
      if (newStatus === RequestStatus.EN_CAMINO) {
        if (currentStatus !== RequestStatus.ASIGNADO) {
          throw new AppError('Solo se puede transicionar a En Camino desde el estado Asignado.', 400);
        }

        return tx.serviceRequest.update({
          where: { id: requestId },
          data: {
            status: RequestStatus.EN_CAMINO,
            startedAt: new Date(),
          },
        });
      }

      if (newStatus === RequestStatus.EN_EJECUCION) {
        if (currentStatus !== RequestStatus.EN_CAMINO) {
          throw new AppError('Solo se puede transicionar a En Ejecución desde el estado En Camino.', 400);
        }

        // REGLA DE SEGURIDAD CRÍTICA: El semáforo DEBE estar en rojo para iniciar el cruce asistido
        if (request.intersection.lightColor !== TrafficLightColor.RED) {
          throw new AppError(
            'REGLA DE SEGURIDAD VIAL: No se puede iniciar el cruce asistido si el semáforo vehicular de la intersección no está en ROJO.',
            422
          );
        }

        return tx.serviceRequest.update({
          where: { id: requestId },
          data: {
            status: RequestStatus.EN_EJECUCION,
            executedAt: new Date(),
            lightColorSnapshot: TrafficLightColor.RED, // Registrar el semáforo rojo auditado
          },
        });
      }

      if (newStatus === RequestStatus.FINALIZADO) {
        if (currentStatus !== RequestStatus.EN_EJECUCION) {
          throw new AppError('Solo se puede transicionar a Finalizado desde el estado En Ejecución.', 400);
        }

        // Liberar al trabajador para que esté disponible para nuevos cruces
        if (request.workerId) {
          await tx.workerProfile.update({
            where: { userId: request.workerId },
            data: { isAvailable: true },
          });
        }

        return tx.serviceRequest.update({
          where: { id: requestId },
          data: {
            status: RequestStatus.FINALIZADO,
            completedAt: new Date(),
          },
        });
      }

      throw new AppError('Transición de estado no soportada.', 400);
    });
  }

  /**
   * Actualiza el color de luz del semáforo en una intersección (fines de simulación o IoT)
   */
  static async updateTrafficLight(intersectionId: string, lightColor: TrafficLightColor) {
    const intersection = await prisma.intersection.findUnique({ where: { id: intersectionId } });
    if (!intersection) throw new AppError('La intersección especificada no existe.', 404);

    return prisma.intersection.update({
      where: { id: intersectionId },
      data: { lightColor },
    });
  }

  /**
   * Obtiene los detalles de una solicitud
   */
  static async getServiceRequest(id: string) {
    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        pedestrian: { select: { id: true, name: true, email: true } },
        worker: { select: { id: true, name: true, email: true } },
        intersection: true,
      },
    });

    if (!request || request.isDeleted) throw new AppError('Solicitud no encontrada.', 404);
    return request;
  }

  /**
   * Obtiene todas las intersecciones
   */
  static async listIntersections() {
    return prisma.intersection.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Lista todas las solicitudes de asistencia (con paginación simple)
   */
  static async listServiceRequests(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.serviceRequest.count({ where: { isDeleted: false } }),
      prisma.serviceRequest.findMany({
        where: { isDeleted: false },
        skip,
        take: limit,
        include: {
          pedestrian: { select: { id: true, name: true, email: true } },
          worker: { select: { id: true, name: true, email: true } },
          intersection: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, items };
  }
}
