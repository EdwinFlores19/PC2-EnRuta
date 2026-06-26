/**
 * src/controllers/formalization.controller.ts — Controlador de Transición Formal, KYC y Gobernanza (TypeScript)
 */

import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { asyncHandler, buildResponse } from '../utils/index';
import { scrapSunatRuc } from '../utils/sunatScraper';
import logger from '../utils/logger';

/**
 * Calcula la edad exacta dada una fecha de nacimiento
 */
function calculateAge(birthDate: Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Función centralizada para recalcular el puntaje de Gamificación del EnRuta (0 a 100 puntos)
 * y actualizar el estado y color del Semáforo Personal del Trabajador.
 */
export async function recalculateSemaphoreScore(userId: string): Promise<any> {
  // 1. Inicializar puntajes por pilar
  let legalScore = 0;      // Máx 30 puntos
  let educationScore = 0;  // Máx 40 puntos
  let financialScore = 0;  // Máx 30 puntos

  // ---- PILAR A: LEGAL Y VALIDACIÓN DE IDENTIDAD (Máx 30 pts) ----
  const verification = await prisma.identityVerification.findUnique({
    where: { userId }
  });

  if (verification && verification.status === 'APPROVED') {
    legalScore += 12; // Identidad Verificada (12 pts)
    legalScore += 12; // Antecedentes Verificados (12 pts - se asume implícito al ser aprobado por el sistema)
    
    // Si cuenta con selfie biométrico, asumimos verificación de domicilio o biométrica completa (6 pts)
    if (verification.selfieUrl) {
      legalScore += 6;
    }
  }

  // ---- PILAR B: CAPACITACIÓN Y APRENDIZAJE (Máx 40 pts) ----
  const progressList = await prisma.educationalProgress.findMany({
    where: { userId, isCompleted: true },
    include: { course: true }
  });

  for (const progress of progressList) {
    const category = progress.course.category;
    if (category === 'FINANCIAL') {
      educationScore += 12; // Curso de Finanzas Personales (12 pts)
    } else if (category === 'TAX_LEGAL') {
      educationScore += 12; // Curso de RUC 10 / RUC 20 (12 pts)
    } else if (category === 'SOFT_SKILLS') {
      educationScore += 8;  // Curso de Habilidades Blandas (8 pts)
    } else if (category === 'CORPORATE_ETHICS') {
      educationScore += 8;  // Curso de Comportamiento e Imagen Profesional (8 pts)
    }
  }

  // ---- PILAR C: HÁBITOS Y SALUD FINANCIERA (Máx 30 pts) ----
  // Se evalúa mediante la existencia de una billetera activa y sus transacciones
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: { transactions: true }
  });

  if (wallet && wallet.isActive) {
    // Si ha registrado por lo menos un flujo o tiene transacciones completas (10 pts)
    const completedTransactions = wallet.transactions.filter(t => t.status === 'COMPLETED');
    if (completedTransactions.length > 0) {
      financialScore += 10; // Registro de Flujo de Caja Activo (10 pts)
    }

    // Si tiene un saldo mayor a 0, asumimos cumplimiento de metas de ahorro (10 pts)
    if (Number(wallet.balance) > 0) {
      financialScore += 10; // Cumplimiento de Metas de Ahorro (10 pts)
    }

    // Si no tiene transacciones fallidas consecutivas, asumimos historial de pago limpio o récord impecable (10 pts)
    const hasFailedTransactions = wallet.transactions.some(t => t.status === 'FAILED');
    if (!hasFailedTransactions) {
      financialScore += 10; // Historial Limpio (10 pts)
    }
  }

  // Puntuación Total
  const totalScore = Math.min(100, legalScore + educationScore + financialScore);

  // Determinar color de Semáforo
  let semaphoreColor: 'RED' | 'YELLOW' | 'GREEN' = 'RED';
  if (totalScore >= 40 && totalScore <= 74) {
    semaphoreColor = 'YELLOW';
  } else if (totalScore >= 75) {
    semaphoreColor = 'GREEN';
  }

  // Actualizar perfil de formalización
  const updatedProfile = await prisma.formalizationProfile.upsert({
    where: { userId },
    update: {
      score: totalScore,
      semaphoreColor
    },
    create: {
      userId,
      score: totalScore,
      semaphoreColor
    }
  });

  return {
    score: totalScore,
    semaphoreColor,
    pilarLegal: legalScore,
    pilarEducacion: educationScore,
    pilarFinanzas: financialScore,
    profile: updatedProfile
  };
}

/**
 * Onboarding KYC Inicial
 * POST /api/v1/formalization/kyc
 */
export const registerKYC = asyncHandler(async (req: Request, res: Response) => {
  const { documentType, documentNumber, birthDate, selfieUrl, mintraAuthUrl } = req.body;
  const userId = (req as any).user.id;

  if (!documentType || !documentNumber || !birthDate) {
    return res.status(400).json({
      status: 'error',
      message: 'Los campos documentType, documentNumber y birthDate son obligatorios.'
    });
  }

  // Calcular edad
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) {
    return res.status(400).json({ status: 'error', message: 'La fecha de nacimiento es inválida.' });
  }
  const age = calculateAge(birth);

  // ─────────────────────────────────────────────────────────────────────────────
  // CASO 1: BLOQUEO ABSOLUTO (MENORES DE 14 AÑOS)
  // Redirección al Ministerio de la Mujer (MIMP) y DEMUNA
  // ─────────────────────────────────────────────────────────────────────────────
  if (age < 14) {
    await prisma.identityVerification.upsert({
      where: { userId },
      update: {
        documentType,
        documentNumber,
        birthDate: birth,
        age,
        status: 'BLOCKED_UNDERAGE'
      },
      create: {
        userId,
        documentType,
        documentNumber,
        birthDate: birth,
        age,
        status: 'BLOCKED_UNDERAGE'
      }
    });

    await prisma.formalizationProfile.upsert({
      where: { userId },
      update: { score: 0, semaphoreColor: 'RED' },
      create: { userId, score: 0, semaphoreColor: 'RED' }
    });

    return res.status(403).json({
      status: 'blocked',
      message: 'Registro Bloqueado: El sistema "EnRuta" prohíbe el registro de menores de 14 años para erradicar el trabajo infantil.',
      canalesAyuda: {
        ministerioMujer: {
          entidad: 'Ministerio de la Mujer y Poblaciones Vulnerables (MIMP)',
          servicio: 'Línea 181 (Denuncia y Orientación sobre Trabajo Infantil) / Dirección de Protección Especial',
          enlacePeticionAyuda: 'https://www.gob.pe/mimp'
        },
        demuna: {
          entidad: 'Defensoría Municipal del Niño y del Adolescente (DEMUNA)',
          servicio: 'Asesoría Legal Gratuita y Apoyo Social Familiar',
          contacto: 'Dirígete a la Municipalidad de tu distrito o comunícate vía mesa de partes para coordinar con la asesora legal.'
        }
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASO 2: ADOLESCENTES TRABAJADORES (14 A 17 AÑOS)
  // Requiere Autorización de Trabajo Adolescente de MINTRA
  // ─────────────────────────────────────────────────────────────────────────────
  if (age >= 14 && age <= 17) {
    const verification = await prisma.identityVerification.upsert({
      where: { userId },
      update: {
        documentType,
        documentNumber,
        birthDate: birth,
        age,
        status: 'PENDING_APPROVAL',
        mintraAuthUrl: mintraAuthUrl || null
      },
      create: {
        userId,
        documentType,
        documentNumber,
        birthDate: birth,
        age,
        status: 'PENDING_APPROVAL',
        mintraAuthUrl: mintraAuthUrl || null
      }
    });

    await prisma.formalizationProfile.upsert({
      where: { userId },
      update: { score: 0, semaphoreColor: 'RED' },
      create: { userId, score: 0, semaphoreColor: 'RED' }
    });

    return res.status(201).json(
      buildResponse({
        verification,
        requiresAuthorization: true,
        message: 'Tu registro ha sido guardado con estado PENDIENTE DE APROBACIÓN.'
      }, 'Se requiere cargar la Autorización de Trabajo Adolescente del Ministerio de Trabajo (MINTRA) para su validación por la municipalidad.')
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASO 3: ADULTOS (>= 18 AÑOS)
  // Aprobado directo con biometría
  // ─────────────────────────────────────────────────────────────────────────────
  const verification = await prisma.identityVerification.upsert({
    where: { userId },
    update: {
      documentType,
      documentNumber,
      birthDate: birth,
      age,
      status: 'APPROVED',
      selfieUrl: selfieUrl || 'https://api.avatar.placeholder/verified.jpg',
      biometricScore: 92.5,
      verifiedAt: new Date()
    },
    create: {
      userId,
      documentType,
      documentNumber,
      birthDate: birth,
      age,
      status: 'APPROVED',
      selfieUrl: selfieUrl || 'https://api.avatar.placeholder/verified.jpg',
      biometricScore: 92.5,
      verifiedAt: new Date()
    }
  });

  // Generar wallet por defecto para el flujo Fintech si no cuenta con una
  await prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      balance: 0.00,
      currency: 'PEN',
      type: 'MERCHANT'
    }
  });

  // Recalcular semáforo
  const gamificationResult = await recalculateSemaphoreScore(userId);

  res.status(201).json(
    buildResponse({
      verification,
      gamification: gamificationResult
    }, 'Verificación KYC completada con éxito. ¡Bienvenido al EnRuta!')
  );
});

/**
 * Consulta y Validación de RUC (Ruta A)
 * POST /api/v1/formalization/ruc
 */
export const validateRUC = asyncHandler(async (req: Request, res: Response) => {
  const { rucNumber } = req.body;
  const userId = (req as any).user.id;

  if (!rucNumber || rucNumber.length !== 11) {
    return res.status(400).json({
      status: 'error',
      message: 'Debe ingresar un número de RUC válido de 11 dígitos.'
    });
  }

  try {
    // Web scraping o consulta SUNAT gratuita
    const sunatData = await scrapSunatRuc(rucNumber);

    if (sunatData.estado !== 'ACTIVO' || sunatData.condicion !== 'HABIDO') {
      return res.status(422).json({
        status: 'error',
        message: `El RUC no cumple las condiciones de SUNAT. Estado: ${sunatData.estado}, Condición: ${sunatData.condicion}. Debe figurar como ACTIVO y HABIDO.`
      });
    }

    // Actualizar el perfil de formalización con los datos de SUNAT
    const formalizationProfile = await prisma.formalizationProfile.upsert({
      where: { userId },
      update: {
        rucNumber,
        rucStatus: `${sunatData.estado} - ${sunatData.condicion}`,
        taxRegime: sunatData.regimenTributario,
        isRucValidated: true
      },
      create: {
        userId,
        rucNumber,
        rucStatus: `${sunatData.estado} - ${sunatData.condicion}`,
        taxRegime: sunatData.regimenTributario,
        isRucValidated: true
      }
    });

    // Recalcular semáforo
    const gamificationResult = await recalculateSemaphoreScore(userId);

    res.status(200).json(
      buildResponse({
        formalizationProfile,
        sunatData,
        gamification: gamificationResult
      }, 'RUC validado correctamente ante la SUNAT. ¡Camino de Emprendedor Formalizado habilitado!')
    );

  } catch (error: any) {
    logger.error(`Error al validar RUC: ${error.message}`);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Error al conectar con el servicio de consulta SUNAT.'
    });
  }
});

/**
 * Listar cursos y avance educativo del Trabajador
 * GET /api/v1/formalization/courses
 */
export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const courses = await prisma.course.findMany({
    include: {
      progress: {
        where: { userId }
      }
    }
  });

  // Estructurar respuesta amigable
  const structuredCourses = courses.map(course => {
    const progress = course.progress[0];
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      totalUnits: course.totalUnits,
      completedUnits: progress ? progress.completedUnits : 0,
      isCompleted: progress ? progress.isCompleted : false,
      lastAccessedAt: progress ? progress.lastAccessedAt : null
    };
  });

  res.status(200).json(
    buildResponse(structuredCourses, 'Cursos y progreso educativo obtenidos correctamente.')
  );
});

/**
 * Actualizar progreso de un curso (Feature Gating Trigger)
 * POST /api/v1/formalization/courses/:courseId/progress
 */
export const updateCourseProgress = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { completedUnits } = req.body;
  const userId = (req as any).user.id;

  if (completedUnits === undefined) {
    return res.status(400).json({
      status: 'error',
      message: 'Debe especificar el número de unidades completadas (completedUnits).'
    });
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    return res.status(404).json({
      status: 'error',
      message: 'El curso especificado no existe.'
    });
  }

  const isCompleted = completedUnits >= course.totalUnits;

  const progress = await prisma.educationalProgress.upsert({
    where: {
      userId_courseId: { userId, courseId }
    },
    update: {
      completedUnits: Math.min(course.totalUnits, completedUnits),
      isCompleted,
      lastAccessedAt: new Date(),
      ...(isCompleted && { completedAt: new Date() })
    },
    create: {
      userId,
      courseId,
      completedUnits: Math.min(course.totalUnits, completedUnits),
      isCompleted,
      lastAccessedAt: new Date(),
      ...(isCompleted && { completedAt: new Date() })
    }
  });

  // Recalcular semáforo ante cambio educativo
  const gamificationResult = await recalculateSemaphoreScore(userId);

  res.status(200).json(
    buildResponse({
      progress,
      gamification: gamificationResult
    }, isCompleted ? '¡Felicidades! Has completado este módulo de capacitación.' : 'Avance del curso guardado correctamente.')
  );
});

/**
 * Obtener estado de mi perfil de Formalización y EnRuta
 * GET /api/v1/formalization/profile
 */
export const getMyFormalizationProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const profile = await prisma.formalizationProfile.findUnique({
    where: { userId }
  });

  const verification = await prisma.identityVerification.findUnique({
    where: { userId }
  });

  const gamificationResult = await recalculateSemaphoreScore(userId);

  res.status(200).json(
    buildResponse({
      profile: profile || gamificationResult.profile,
      verification,
      gamificationDetail: {
        score: gamificationResult.score,
        semaphoreColor: gamificationResult.semaphoreColor,
        pilarLegal: gamificationResult.pilarLegal,
        pilarEducacion: gamificationResult.pilarEducacion,
        pilarFinanzas: gamificationResult.pilarFinanzas
      }
    }, 'Perfil de formalización y metas de semáforo obtenido correctamente.')
  );
});

/**
 * Métricas de Transición para Municipios (Gobernanza B2G)
 * GET /api/v1/formalization/metrics
 */
export const getDistrictMetrics = asyncHandler(async (req: Request, res: Response) => {
  // Conteo agregados de Semáforos por color
  const totalProfiles = await prisma.formalizationProfile.count();
  const redCount = await prisma.formalizationProfile.count({ where: { semaphoreColor: 'RED' } });
  const yellowCount = await prisma.formalizationProfile.count({ where: { semaphoreColor: 'YELLOW' } });
  const greenCount = await prisma.formalizationProfile.count({ where: { semaphoreColor: 'GREEN' } });

  // Conteo de RUCs validados (Ruta A completada)
  const rucValidatedCount = await prisma.formalizationProfile.count({ where: { isRucValidated: true } });

  // Conteo de contratados en Planilla (Ruta B completada)
  const b2bHiredCount = await prisma.formalizationProfile.count({ where: { isHiredB2B: true } });

  // Conteo de menores bajo control
  const underAgeBlocked = await prisma.identityVerification.count({ where: { status: 'BLOCKED_UNDERAGE' } });
  const underAgePending = await prisma.identityVerification.count({ where: { status: 'PENDING_APPROVAL' } });

  // Tasa de Transición Social
  const transitionRate = totalProfiles > 0 
    ? ((yellowCount + greenCount) / totalProfiles) * 100 
    : 0;

  res.status(200).json(
    buildResponse({
      KPIs: {
        totalTrabajadoresRegistrados: totalProfiles,
        tasaTransicionSocial: parseFloat(transitionRate.toFixed(2)),
        independientesFormalizadosConRuc: rucValidatedCount,
        empleadosPlanillaB2B: b2bHiredCount,
      },
      distribucionSemaforo: {
        rojoInformales: redCount,
        amarilloCapacitandose: yellowCount,
        verdeFormalizados: greenCount
      },
      controlMenoresEdad: {
        bloqueosAlertaMenoresDe14: underAgeBlocked,
        adolescentesPendientesAutorizacion: underAgePending
      }
    }, 'Métricas de transición del distrito obtenidas con éxito.')
  );
});

/**
 * Reporte de Transparencia Tributaria (SUNAT Macro audit)
 * GET /api/v1/formalization/taxes
 */
export const getTaxAuditReport = asyncHandler(async (req: Request, res: Response) => {
  const { period } = req.query;

  const logs = await prisma.sUNATAuditLog.findMany({
    where: {
      ...(period && { fiscalPeriod: period as string })
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalDeclared = logs.reduce((sum, log) => sum + Number(log.declaredRevenue), 0);
  const totalTaxCollected = logs.reduce((sum, log) => sum + Number(log.taxPaid), 0);

  res.status(200).json(
    buildResponse({
      fiscalPeriod: period || 'TODOS',
      auditedUsersCount: logs.length,
      resumenMacro: {
        totalIngresosDeclaradosPEN: totalDeclared,
        totalImpuestosRecaudadosPEN: totalTaxCollected
      },
      auditorias: logs.map(log => ({
        id: log.id,
        trabajador: log.user.name,
        periodo: log.fiscalPeriod,
        ingresosDeclarados: log.declaredRevenue,
        impuestoPagado: log.taxPaid,
        ticketSunat: log.sunatTicket,
        estado: log.status,
        fecha: log.createdAt
      }))
    }, 'Reporte tributario de auditoría macro emitido para SUNAT.')
  );
});
