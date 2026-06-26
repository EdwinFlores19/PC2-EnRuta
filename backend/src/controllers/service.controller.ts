/**
 * src/controllers/service.controller.ts — Controlador Express para el Sistema de Asignación por Proximidad (TypeScript)
 */

import { Request, Response } from 'express';
import { asyncHandler, buildResponse, buildPaginatedResponse } from '../utils/index';
import { ServiceService } from '../services/service.service';
import { RequestStatus, TrafficLightColor } from '@prisma/client';

/**
 * Buscar trabajadores disponibles cercanos a unas coordenadas específicas
 * GET /api/v1/services/workers/nearby
 */
export const findNearbyWorkers = asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude, radius } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      status: 'error',
      message: 'Los parámetros "latitude" y "longitude" son requeridos.',
    });
  }

  const lat = parseFloat(latitude as string);
  const lng = parseFloat(longitude as string);
  const rad = radius ? parseInt(radius as string, 10) : 1000;

  if (isNaN(lat) || isLngInvalid(lng)) {
    return res.status(400).json({
      status: 'error',
      message: 'Los parámetros geográficos "latitude" o "longitude" no son números válidos.',
    });
  }

  const workers = await ServiceService.findNearbyWorkers(lat, lng, rad);

  res.status(200).json(
    buildResponse(workers, 'Trabajadores cercanos obtenidos con éxito.')
  );
});

/**
 * Crear una nueva solicitud de servicio de ayuda vial
 * POST /api/v1/services/request
 */
export const createServiceRequest = asyncHandler(async (req: Request, res: Response) => {
  const { intersectionId, startLatitude, startLongitude } = req.body;
  const pedestrianId = req.user?.id;

  if (!pedestrianId) {
    return res.status(401).json({
      status: 'error',
      message: 'No autenticado. Se requiere sesión activa de peatón.',
    });
  }

  if (!intersectionId || !startLatitude || !startLongitude) {
    return res.status(400).json({
      status: 'error',
      message: 'Los campos "intersectionId", "startLatitude" y "startLongitude" son obligatorios.',
    });
  }

  const lat = parseFloat(startLatitude);
  const lng = parseFloat(startLongitude);

  const request = await ServiceService.createServiceRequest(
    pedestrianId,
    intersectionId,
    lat,
    lng
  );

  res.status(201).json(
    buildResponse(request, 'Solicitud de asistencia vial creada exitosamente y buscando asistentes viales.')
  );
});

/**
 * Asignar un trabajador vial a una solicitud de servicio
 * POST /api/v1/services/request/:id/assign
 */
export const assignWorker = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const workerUserId = req.user?.id;

  if (!workerUserId) {
    return res.status(401).json({
      status: 'error',
      message: 'No autorizado. Se requiere sesión activa de asistente vial.',
    });
  }

  const request = await ServiceService.assignWorker(id, workerUserId);

  res.status(200).json(
    buildResponse(request, 'Asistente vial asignado correctamente. En camino.')
  );
});

/**
 * Realizar una transición en el flujo de estados del viaje
 * PATCH /api/v1/services/request/:id/status
 */
export const transitionStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!userId || !userRole) {
    return res.status(401).json({
      status: 'error',
      message: 'Autenticación requerida para realizar transiciones del servicio.',
    });
  }

  if (!status || !Object.values(RequestStatus).includes(status as RequestStatus)) {
    return res.status(400).json({
      status: 'error',
      message: `El estado proporcionado no es válido. Valores permitidos: ${Object.values(RequestStatus).join(', ')}`,
    });
  }

  const updatedRequest = await ServiceService.transitionStatus(
    id,
    status as RequestStatus,
    userId,
    userRole
  );

  let message = `El estado del servicio ha cambiado exitosamente a ${status}.`;
  if (status === 'EN_EJECUCION') {
    message = '¡Cruce asistido iniciado con éxito con el semáforo vehicular verificado en ROJO!';
  }

  res.status(200).json(
    buildResponse(updatedRequest, message)
  );
});

/**
 * Actualizar manualmente el estado del semáforo de una intersección (Fines de simulación o IoT)
 * PATCH /api/v1/services/intersections/:id/light
 */
export const updateTrafficLight = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { lightColor } = req.body;

  if (!lightColor || !Object.values(TrafficLightColor).includes(lightColor as TrafficLightColor)) {
    return res.status(400).json({
      status: 'error',
      message: `El color del semáforo no es válido. Valores permitidos: ${Object.values(TrafficLightColor).join(', ')}`,
    });
  }

  const updatedIntersection = await ServiceService.updateTrafficLight(
    id,
    lightColor as TrafficLightColor
  );

  res.status(200).json(
    buildResponse(
      updatedIntersection,
      `El semáforo de la intersección ha cambiado a color: ${lightColor}.`
    )
  );
});

/**
 * Obtener los detalles completos de una solicitud de servicio específica
 * GET /api/v1/services/request/:id
 */
export const getServiceRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const request = await ServiceService.getServiceRequest(id);

  res.status(200).json(
    buildResponse(request, 'Detalles de la solicitud de asistencia vial obtenidos con éxito.')
  );
});

/**
 * Listar todas las intersecciones disponibles en el sistema
 * GET /api/v1/services/intersections
 */
export const listIntersections = asyncHandler(async (req: Request, res: Response) => {
  const intersections = await ServiceService.listIntersections();

  res.status(200).json(
    buildResponse(intersections, 'Listado de intersecciones obtenido exitosamente.')
  );
});

/**
 * Listar todas las solicitudes del sistema (Control de Consola de Tráfico / Admin)
 * GET /api/v1/services/requests
 */
export const listServiceRequests = asyncHandler(async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

  const { total, items } = await ServiceService.listServiceRequests(page, limit);

  res.status(200).json(
    buildPaginatedResponse(items, total, page, limit, 'Listado general de solicitudes viales obtenido con éxito.')
  );
});

// Helpers
function isLngInvalid(lng: number): boolean {
  return isNaN(lng) || lng < -180 || lng > 180;
}
