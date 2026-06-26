/**
 * src/controllers/ai.controller.ts — Controlador para el Módulo de IA (TypeScript)
 */

import { Request, Response } from 'express';
import { asyncHandler, buildResponse } from '../utils/index';
import * as aiService from '../services/ai.service';

/**
 * Endpoint para generación de contenido puntual (Single Turn).
 * POST /api/v1/ai/generate
 */
export const generate = asyncHandler(async (req: Request, res: Response) => {
  const { prompt, systemInstruction } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({
      status: 'error',
      message: 'El campo "prompt" es obligatorio y debe ser un texto.',
    });
  }

  const responseText = await aiService.generateText(prompt, systemInstruction);

  res.status(200).json(
    buildResponse({ text: responseText }, 'Generación de IA exitosa.')
  );
});

/**
 * Endpoint para chat conversacional interactivo con historial (Multi-Turn).
 * POST /api/v1/ai/chat
 */
export const chat = asyncHandler(async (req: Request, res: Response) => {
  const { message, history = [], systemInstruction } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      status: 'error',
      message: 'El campo "message" es obligatorio y debe ser un texto.',
    });
  }

  if (!Array.isArray(history)) {
    return res.status(400).json({
      status: 'error',
      message: 'El historial de chat ("history") debe ser un arreglo.',
    });
  }

  const result = await aiService.generateChat(history, message, systemInstruction);

  res.status(200).json(
    buildResponse(result, 'Conversación de IA generada con éxito.')
  );
});

/**
 * Endpoint de prueba de conexión e integración rápida en caliente.
 * GET /api/v1/ai/test
 */
export const testConnection = asyncHandler(async (req: Request, res: Response) => {
  try {
    const testPrompt = 'Responde únicamente en una sola línea diciendo "Gemini está 100% operativo en este servidor."';
    const responseText = await aiService.generateText(testPrompt);
    
    res.status(200).json(
      buildResponse({
        connection: 'successful',
        response: responseText,
        model: process.env.GEMINI_MODEL || 'gemini-3.5-flash'
      }, 'La conexión de IA con Google Cloud está activa y operativa.')
    );
  } catch (error: any) {
    res.status(502).json({
      status: 'error',
      message: `No se pudo conectar con el servicio de IA de Google Cloud: ${error.message}`
    });
  }
});
