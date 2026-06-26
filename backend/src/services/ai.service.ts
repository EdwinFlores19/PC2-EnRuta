/**
 * src/services/ai.service.ts — Servicio de Lógica de Negocio para IA (TypeScript)
 */

import { ai, defaultModelName, AI_PROMPT_CONFIG } from '../../config/ai.config';
import logger from '../utils/logger';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

/**
 * Genera una respuesta de texto única (Single Turn) a partir de un prompt.
 * 
 * @param prompt Prompt enviado por el usuario.
 * @param customSystemInstruction Instrucción opcional del sistema para anular el prompt por defecto.
 * @returns La respuesta de texto generada por el modelo de IA.
 */
export const generateText = async (prompt: string, customSystemInstruction?: string): Promise<string> => {
  try {
    logger.info(`🤖 Iniciando generación de contenido con modelo: ${defaultModelName}`);
    
    const response = await ai.models.generateContent({
      model: defaultModelName,
      contents: prompt,
      config: {
        systemInstruction: customSystemInstruction || AI_PROMPT_CONFIG.systemInstruction,
        temperature: AI_PROMPT_CONFIG.config.temperature,
        maxOutputTokens: AI_PROMPT_CONFIG.config.maxOutputTokens,
      },
    });

    const text = response.text || '';
    logger.info('✅ Contenido generado con éxito por la IA.');
    return text;
  } catch (error: any) {
    logger.error(`❌ Error en ai.service.generateText: ${error.message}`);
    throw error;
  }
};

/**
 * Genera una respuesta a un chat de múltiples rondas (Multi-Turn Chat) manteniendo el historial.
 * 
 * @param history Historial de mensajes anteriores de la sesión.
 * @param newMessage Nuevo mensaje del usuario.
 * @param customSystemInstruction Instrucción opcional del sistema para el chat.
 * @returns Objeto con la respuesta y el historial conversacional actualizado.
 */
export const generateChat = async (
  history: ChatMessage[],
  newMessage: string,
  customSystemInstruction?: string
): Promise<{ text: string; updatedHistory: ChatMessage[] }> => {
  try {
    logger.info(`💬 Iniciando conversación multi-ronda con modelo: ${defaultModelName}`);

    // Mapear historial al formato esperado por el SDK de Google Gen AI
    const formattedHistory = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const chatSession = ai.chats.create({
      model: defaultModelName,
      history: formattedHistory,
      config: {
        systemInstruction: customSystemInstruction || AI_PROMPT_CONFIG.systemInstruction,
        temperature: AI_PROMPT_CONFIG.config.temperature,
      },
    });

    const response = await chatSession.sendMessage({ message: newMessage });
    const responseText = response.text || '';

    // Devolver respuesta junto con el historial conversacional sincronizado
    const updatedHistory: ChatMessage[] = [
      ...history,
      { role: 'user', text: newMessage },
      { role: 'model', text: responseText },
    ];

    logger.info('✅ Respuesta de chat generada y sincronizada correctamente.');
    return {
      text: responseText,
      updatedHistory,
    };
  } catch (error: any) {
    logger.error(`❌ Error en ai.service.generateChat: ${error.message}`);
    throw error;
  }
};
