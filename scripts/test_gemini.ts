/**
 * scripts/test_gemini.ts — Script Autónomo de Prueba de Conectividad con la API de Gemini / Vertex (TypeScript)
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno del backend
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const isVertex = !!process.env.GEMINI_API_VERTEX;
const apiKey = isVertex ? process.env.GEMINI_API_VERTEX : process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

async function testGemini() {
  console.log('🤖 DIAGNÓSTICO DE IA EN CALIENTE...');
  console.log('======================================================');
  console.log(`- Tipo de Inferencia: ${isVertex ? 'VERTEX AI / AGENT_PLATFORM (Empresarial)' : 'GEMINI DEVELOPER API (Pública)'}`);
  console.log(`- Modelo configurado: ${modelName}`);
  console.log(`- API Key configurada: ${apiKey ? 'SI (Detectada)' : 'NO (Faltante)'}`);

  if (!apiKey) {
    console.error('❌ ERROR CRÍTICO: GEMINI_API_KEY o GEMINI_API_VERTEX no encontradas en backend/.env');
    process.exit(1);
  }

  try {
    console.log('🔌 Inicializando cliente GoogleGenAI...');
    const ai = new GoogleGenAI({
      apiKey,
      vertexai: isVertex,
    });

    console.log('📡 Enviando petición de prueba "Hola, ¿estás despierto?"...');
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: 'Hola, ¿estás despierto? Responde de forma muy amigable, corta y confirma si eres la IA del sistema.',
    });

    console.log('\n======================================================');
    console.log('🟢 CONEXIÓN DE IA OPERATIVA Y EN VERDE');
    console.log('======================================================');
    console.log(`Respuesta de ${modelName}:`);
    console.log(`"${response.text || 'Sin texto'}"`);
    console.log('======================================================');
    process.exit(0);
  } catch (error: any) {
    console.error('\n======================================================');
    console.error('🔴 FALLO DE CONEXIÓN CON GOOGLE CLOUD');
    console.error('======================================================');
    console.error(`Causa raíz del error: ${error.message}`);
    console.error('Puntos de control recomendados:');
    console.error('  1. Verifica que tu GEMINI_API_VERTEX en backend/.env sea válida.');
    console.error('  2. Asegúrate de tener habilitada la API "Agent Platform" (Vertex AI) en Google Cloud.');
    console.error('  3. Valida que el modelo configurado esté disponible en tu plan.');
    console.error('======================================================');
    process.exit(1);
  }
}

testGemini();
