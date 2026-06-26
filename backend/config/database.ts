/**
 * config/database.ts — Configuración y Gestión de Conexión a PostgreSQL (TypeScript)
 */

import { PrismaClient } from '@prisma/client';
import logger from '../src/utils/logger';

const prismaOptions: any = {
  log: process.env.NODE_ENV === 'development'
    ? [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ]
    : [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
};

export const prisma = new PrismaClient(prismaOptions);

if (process.env.NODE_ENV === 'development') {
  (prisma as any).$on('query', (event: any) => {
    logger.debug({
      type: 'DB_QUERY',
      query: event.query,
      params: event.params,
      duration: `${event.duration}ms`,
    });
  });
}

(prisma as any).$on('error', (event: any) => {
  logger.error({
    type: 'DB_ERROR',
    message: event.message,
    target: event.target,
  });
});

(prisma as any).$on('warn', (event: any) => {
  logger.warn({
    type: 'DB_WARN',
    message: event.message,
  });
});

export const connectDatabase = async (): Promise<void> => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'Variable de entorno DATABASE_URL no definida. ' +
        'Revisa tu archivo .env y asegúrate de que apunta a tu instancia de Supabase/PostgreSQL.'
      );
    }

    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl.includes('[') || dbUrl.includes(']')) {
      logger.error('❌ CONFIGURACIÓN INVÁLIDA: DATABASE_URL contiene corchetes [ o ], lo que indica placeholders no reemplazados.');
      throw new Error('DATABASE_URL contiene placeholders inválidos [ o ].');
    }

    // Alerta preventiva sobre caracteres especiales no escapados (ej: ? en password)
    if (dbUrl.includes('?') && !dbUrl.includes('?schema=') && !dbUrl.includes('&') && !dbUrl.includes('pgbouncer=')) {
      logger.warn('⚠️ ADVERTENCIA SRE: Tu DATABASE_URL contiene un caracter "?" que podría romper el parseo. Si tu contraseña tiene caracteres especiales (como "?" o "@"), asegúrate de codificarlos en formato URL (ej: "?" como "%3F").');
    }

    await prisma.$connect();
    logger.info('🗄️  Conexión a PostgreSQL (Supabase) establecida correctamente.');

    const result = await prisma.$queryRaw<any[]>`SELECT current_database(), current_user, version()`;
    logger.info(`📊 Base de datos: ${result[0].current_database} | Usuario: ${result[0].current_user}`);

  } catch (error: any) {
    logger.error(`❌ Error al conectar con PostgreSQL: ${error.message}`);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('🗄️  Conexión a PostgreSQL closed correctly.');
  } catch (error: any) {
    logger.error(`Error al cerrar la conexión a PostgreSQL: ${error.message}`);
  }
};
