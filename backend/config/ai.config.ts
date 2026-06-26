/**
 * config/ai.config.ts — Configuración del SDK de Google Gen AI y Prompt Engineering (TypeScript)
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import logger from '../src/utils/logger';

// Cargar variables de entorno del backend
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const isVertex = !!process.env.GEMINI_API_VERTEX;
const apiKey = isVertex ? process.env.GEMINI_API_VERTEX : process.env.GEMINI_API_KEY;

if (!apiKey) {
  logger.error('❌ CONFIGURACIÓN CRÍTICA: GEMINI_API_KEY o GEMINI_API_VERTEX no están definidas en backend/.env');
} else {
  logger.info(`🤖 Inicializando GoogleGenAI en modo [${isVertex ? 'VERTEX_AI / AGENT_PLATFORM' : 'GEMINI_DEVELOPER_API'}]`);
}

// Inicialización del cliente de Google Gen AI
export const ai = new GoogleGenAI({
  apiKey: apiKey,
  vertexai: isVertex,
});

// Modelo de IA a utilizar (por defecto gemini-3.5-flash según requerimiento)
export const defaultModelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

/**
 * CONFIGURACIÓN DE PROMPT ENGINEERING (NÚCLEO DE DIRECTRICES)
 * Aquí reside la "personalidad", restricciones y reglas de comportamiento de la IA.
 * Este prompt puede ser actualizado dinámicamente según el caso de negocio del examen.
 */
export const AI_PROMPT_CONFIG = {
  // Parámetros de control del modelo
  config: {
    temperature: 0.3, // Respuestas deterministas y basadas en datos, menor alucinación
    maxOutputTokens: 2048,
  },
  
  // Prompt del Sistema (System Instruction)
  systemInstruction: `
    Eres un asistente virtual de IA experto en ingeniería de software e integrado de forma nativa en el sistema transaccional del caso de negocio de nuestro examen.
    
    Tus directrices de comportamiento inmutables son:
    1. Saluda cordialmente de manera breve y profesional cuando sea pertinente.
    2. Responde SIEMPRE en español de forma directa, técnica, precisa y bien formateada usando Markdown limpio (listas, tablas si es necesario, negritas para términos importantes).
    3. Si el usuario te hace preguntas técnicas sobre el software, responde basándote en la arquitectura del monorepositorio: Node.js, Express, Prisma ORM, PostgreSQL (Supabase) y React + Vite.
    4. Si te piden datos que no manejas o acciones fuera de tu alcance, responde: "Lo siento, esa funcionalidad o información no está disponible en este momento."
    5. NUNCA inventes información ficticia que ponga en duda la consistencia o veracidad del sistema.
    
    [PROMPT PERSONALIZADO]: Este bloque será inyectado o reemplazado con las directrices específicas del caso de negocio una vez se defina el examen.
  `.trim()
};
