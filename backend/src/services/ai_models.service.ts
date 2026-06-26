/**
 * src/services/ai_models.service.ts — Servicio de Lógica de Negocio de IA Especializada (TypeScript)
 */

import { ai, defaultModelName } from '../../config/ai.config';
import { prisma } from '../../config/database';
import logger from '../utils/logger';
import { SYSTEM_PROMPT_CANDIDATE_COACH, SYSTEM_PROMPT_EMPLOYER_MATCHER } from './ai_prompts';

export interface ParsedCV {
  formalTitle: string;
  summary: string;
  location: string;
  skills: Array<{ name: string; category: string }>;
  experiences: Array<{
    rawInformalText: string;
    formalRole: string;
    duration: string;
    formalResponsibilities: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
}

/**
 * 1. MOTOR DE CVs: Parsea texto informal y lo guarda estructuradamente en la BD
 */
export const parseCV = async (userId: string, rawText: string): Promise<any> => {
  try {
    logger.info(`📝 Iniciando parseo de CV informal para el usuario ${userId}`);

    // Prompt de extracción estructurada
    const parsingPrompt = `
      Analiza el siguiente texto que describe la experiencia laboral informal de un candidato en el Perú.
      Debes extraer su información, traducir modismos informales a términos profesionales formales del mercado de trabajo, y retornar un objeto JSON estructurado según las especificaciones indicadas.

      TEXTO DE ENTRADA EN BRUTO:
      """
      ${rawText}
      """

      INSTRUCCIÓN DE RETORNO:
      Devuelve ÚNICAMENTE un objeto JSON que coincida exactamente con la siguiente estructura de TypeScript (sin comentarios, sin texto alrededor, sin envolver en marcadores markdown de bloque de código):

      interface ParsedCV {
        formalTitle: string; // Título formal sugerido para el mercado (ej: "Auxiliar de Almacén y Reparto", "Técnico de Detallado Vehicular")
        summary: string; // Resumen profesional limpio (máximo 3 líneas)
        location: string; // Distrito o zona detectada en el texto (si no hay, coloca "Lima Metropolitana")
        skills: Array<{ name: string; category: "Operativo" | "Ventas" | "Atención al Cliente" | "Logística" | "Administrativo" }>;
        experiences: Array<{
          rawInformalText: string; // El texto crudo de la experiencia informal
          formalRole: string; // Cargo equivalente formal
          duration: string; // Duración (ej: "1 año", "6 meses", "No especifica")
          formalResponsibilities: string[]; // Responsabilidades del rol redactadas formalmente (máximo 3 tareas)
        }>;
        education: Array<{
          institution: string;
          degree: string;
          year: string;
        }>;
      }
    `;

    // Llamada a Gemini 3.5 Flash
    const response = await ai.models.generateContent({
      model: defaultModelName,
      contents: parsingPrompt,
      config: {
        temperature: 0.1, // Baja temperatura para extracción de datos precisa
        responseMimeType: 'application/json', // Garantiza salida JSON
      },
    });

    const responseText = response.text || '';
    
    // Limpieza de caracteres o bloques markdown si el modelo no los quitó
    let cleanedJsonText = responseText.trim();
    if (cleanedJsonText.startsWith('```json')) {
      cleanedJsonText = cleanedJsonText.substring(7, cleanedJsonText.length - 3).trim();
    } else if (cleanedJsonText.startsWith('```')) {
      cleanedJsonText = cleanedJsonText.substring(3, cleanedJsonText.length - 3).trim();
    }

    const parsedData: ParsedCV = JSON.parse(cleanedJsonText);
    logger.info(`✅ Gemini procesó el perfil. Iniciando transacción de base de datos...`);

    // Guardar datos en la base de datos de forma transaccional (ACID)
    const resultProfile = await prisma.$transaction(async (tx) => {
      // 1. Asegurar que las habilidades existan en la tabla general 'skills' y obtener sus IDs
      const skillConnections: string[] = [];
      
      for (const sk of parsedData.skills) {
        // Buscar o crear la habilidad maestra
        const dbSkill = await tx.skill.upsert({
          where: { name: sk.name },
          update: {},
          create: {
            name: sk.name,
            category: sk.category,
          },
        });
        skillConnections.push(dbSkill.id);
      }

      // 2. Crear o actualizar el perfil del candidato
      const updatedProfile = await tx.candidateProfile.upsert({
        where: { userId },
        update: {
          rawText,
          formalTitle: parsedData.formalTitle,
          summary: parsedData.summary,
          location: parsedData.location,
          experienceJson: JSON.stringify(parsedData.experiences),
          educationJson: JSON.stringify(parsedData.education || []),
        },
        create: {
          userId,
          rawText,
          formalTitle: parsedData.formalTitle,
          summary: parsedData.summary,
          location: parsedData.location,
          experienceJson: JSON.stringify(parsedData.experiences),
          educationJson: JSON.stringify(parsedData.education || []),
        },
      });

      // 3. Limpiar relaciones de habilidades previas
      await tx.candidateSkill.deleteMany({
        where: { candidateProfileId: updatedProfile.id },
      });

      // 4. Crear las nuevas relaciones de habilidades
      for (const skillId of skillConnections) {
        await tx.candidateSkill.create({
          data: {
            candidateProfileId: updatedProfile.id,
            skillId: skillId,
          },
        });
      }

      return updatedProfile;
    });

    logger.info(`🎉 Perfil del candidato ${userId} actualizado con éxito en Supabase.`);
    return {
      profileId: resultProfile.id,
      formalTitle: resultProfile.formalTitle,
      summary: resultProfile.summary,
      location: resultProfile.location,
      parsedData,
    };
  } catch (error: any) {
    logger.error(`❌ Error en ai_models.service.parseCV: ${error.message}`);
    throw error;
  }
};

/**
 * 2. CHATBOT FINANCIERO: Conversación persistente para trabajadores
 */
export const handleCandidateCoachChat = async (userId: string, message: string): Promise<any> => {
  try {
    logger.info(`💬 Coach Financiero atendiendo al usuario ${userId}`);

    // 1. Obtener o crear la sesión de chat
    let session = await prisma.chatSession.findFirst({
      where: { userId, type: 'CANDIDATE_COACH' },
    });

    if (!session) {
      session = await prisma.chatSession.create({
        data: { userId, type: 'CANDIDATE_COACH' },
      });
    }

    // 2. Obtener historial reciente (últimos 10 mensajes)
    const dbMessages = await prisma.chatMessage.findMany({
      where: { chatSessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    // Mapear historial al formato del SDK
    const formattedHistory = dbMessages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // 3. Guardar el nuevo mensaje del usuario en la base de datos
    await prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        role: 'user',
        text: message,
      },
    });

    // 4. Inicializar chat en Gemini con el historial y el prompt del sistema
    const chatSession = ai.chats.create({
      model: defaultModelName,
      history: formattedHistory,
      config: {
        systemInstruction: SYSTEM_PROMPT_CANDIDATE_COACH,
        temperature: 0.5, // Un poco más creativo pero enfocado
      },
    });

    // 5. Enviar mensaje al LLM
    const response = await chatSession.sendMessage({ message });
    const responseText = response.text || '';

    // 6. Guardar la respuesta del modelo en la base de datos
    await prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        role: 'model',
        text: responseText,
      },
    });

    // 7. Recuperar el historial completo actualizado
    const updatedMessages = await prisma.chatMessage.findMany({
      where: { chatSessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      sessionId: session.id,
      text: responseText,
      history: updatedMessages.map((m) => ({ role: m.role, text: m.text, createdAt: m.createdAt })),
    };
  } catch (error: any) {
    logger.error(`❌ Error en ai_models.service.handleCandidateCoachChat: ${error.message}`);
    throw error;
  }
};

/**
 * 3. CHATBOT DE RECOMENDACIÓN (RAG): Recomienda candidatos en base a la base de datos
 */
export const handleEmployerMatcherChat = async (userId: string, message: string): Promise<any> => {
  try {
    logger.info(`💼 Chat de Reclutamiento atendiendo al empleador ${userId}`);

    // 1. Obtener o crear la sesión de chat para el empleador
    let session = await prisma.chatSession.findFirst({
      where: { userId, type: 'EMPLOYER_MATCHER' },
    });

    if (!session) {
      session = await prisma.chatSession.create({
        data: { userId, type: 'EMPLOYER_MATCHER' },
      });
    }

    // 2. Obtener el historial reciente (últimos 6 mensajes para no sobrecargar el contexto de RAG)
    const dbMessages = await prisma.chatMessage.findMany({
      where: { chatSessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 6,
    });

    // 3. RAG: Recuperar candidatos reales de la base de datos
    // Para simplificar y optimizar, recuperamos candidatos con sus perfiles y habilidades.
    const candidates = await prisma.candidateProfile.findMany({
      take: 12,
      include: {
        user: { select: { name: true, email: true } },
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    // Formatear la lista de candidatos como un contexto inyectable en texto
    const formattedCandidatesContext = candidates.map((c, i) => {
      const skillList = c.skills.map((cs) => cs.skill.name).join(', ');
      
      // Parsear experiencias JSON
      let experiencesText = '';
      try {
        const exps = typeof c.experienceJson === 'string' ? JSON.parse(c.experienceJson) : c.experienceJson;
        if (Array.isArray(exps)) {
          experiencesText = exps.map((e: any) => `- Cargo: ${e.formalRole} (${e.duration}). Tareas informales originales: "${e.rawInformalText}". Responsabilidades formales: ${e.formalResponsibilities?.join(', ') || ''}`).join('\n');
        }
      } catch (err) {
        experiencesText = 'Sin detalle de experiencia estructurada.';
      }

      return `
--- CANDIDATO #${i + 1} ---
ID: ${c.id}
Nombre completo: ${c.user.name}
Ubicación: ${c.location}
Título formal: ${c.formalTitle}
Resumen profesional: ${c.summary}
Habilidades clave: [${skillList}]
Experiencias detalladas:
${experiencesText}
      `;
    }).join('\n');

    // 4. Guardar el nuevo mensaje del empleador en la base de datos
    await prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        role: 'user',
        text: message,
      },
    });

    // 5. Mapear historial al formato del SDK
    const formattedHistory = dbMessages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // Prompt enriquecido con RAG (Candidatos de la BD)
    const finalSystemPrompt = `
      ${SYSTEM_PROMPT_EMPLOYER_MATCHER}

      =========================================
      BASE DE DATOS EN TIEMPO REAL (RAG CANDIDATOS):
      A continuación, tienes acceso directo a los candidatos registrados actualmente en la base de datos. Evalúalos para responder a la solicitud del empleador.
      
      ${formattedCandidatesContext}
      =========================================
    `;

    // 6. Inicializar sesión de chat en Gemini
    const chatSession = ai.chats.create({
      model: defaultModelName,
      history: formattedHistory,
      config: {
        systemInstruction: finalSystemPrompt,
        temperature: 0.4, // Mantenerlo enfocado en los datos de la base de datos
      },
    });

    // 7. Enviar mensaje del empleador a Gemini
    const response = await chatSession.sendMessage({ message });
    const responseText = response.text || '';

    // 8. Guardar la respuesta del modelo en la base de datos
    await prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        role: 'model',
        text: responseText,
      },
    });

    // 9. Retornar respuesta y el historial actualizado
    const updatedMessages = await prisma.chatMessage.findMany({
      where: { chatSessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      sessionId: session.id,
      text: responseText,
      history: updatedMessages.map((m) => ({ role: m.role, text: m.text, createdAt: m.createdAt })),
    };
  } catch (error: any) {
    logger.error(`❌ Error en ai_models.service.handleEmployerMatcherChat: ${error.message}`);
    throw error;
  }
};
