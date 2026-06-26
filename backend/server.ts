/**
 * server.ts — Punto de Entrada Principal del Backend (TypeScript)
 */

import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import logger from './src/utils/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import aiRouter from './src/routes/ai.routes';

// Carga de variables de entorno
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configuración CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS bloqueó petición desde origen no permitido: ${origin}`);
      callback(new Error(`Origen no permitido por la política CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions) as any);

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (NODE_ENV !== 'test') {
  app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: { write: (message: string) => logger.http(message.trim()) },
  }));
}

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Demasiadas peticiones desde esta IP. Inténtalo de nuevo en 15 minutos.',
  },
});

app.use('/api/', globalLimiter);

// Endpoint de Health Check (Render)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'El servidor está funcionando correctamente.',
  });
});

// Endpoint de Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'El servidor está funcionando correctamente.',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Rutas de Inteligencia Artificial
app.use('/api/v1/ai', aiRouter);

// Manejo de rutas no encontradas (404)
app.use((req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    status: 'error',
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Manejador de errores global
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  if (err.message && err.message.startsWith('Origen no permitido')) {
    res.status(403).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  if (err.type === 'validation') {
    res.status(422).json({
      status: 'error',
      message: 'Error de validación en los datos enviados.',
      errors: err.errors,
    });
    return;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      status: 'error',
      message: 'Token de autenticación inválido o expirado.',
    });
    return;
  }

  if (err.code === 'P2002') {
    res.status(409).json({
      status: 'error',
      message: 'El recurso ya existe (conflicto de datos únicos).',
      field: err.meta?.target,
    });
    return;
  }
  if (err.code === 'P2025') {
    res.status(404).json({
      status: 'error',
      message: 'El recurso solicitado no fue encontrado en la base de datos.',
    });
    return;
  }

  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    body: NODE_ENV !== 'production' ? req.body : '[HIDDEN]',
  });

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    status: 'error',
    message: NODE_ENV === 'production'
      ? 'Ha ocurrido un error interno en el servidor.'
      : err.message || 'Error interno del servidor.',
    ...(NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Inicio del servidor
const startServer = async () => {
  try {
    await connectDatabase();

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Servidor iniciado en modo [${NODE_ENV.toUpperCase()}]`);
      logger.info(`📡 Escuchando en http://localhost:${PORT}`);
      logger.info(`✅ Health Check disponible en http://localhost:${PORT}/api/health`);
      logger.info(`🌐 CORS permitido para: ${allowedOrigins.join(' | ')}`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.warn(`\n⚠️  Señal ${signal} recibida. Iniciando cierre graceful...`);

      server.close(async () => {
        logger.info('🔌 Servidor HTTP cerrado.');
        await disconnectDatabase();
        logger.info('🗄️  Conexión a la base de datos cerrada.');
        logger.info('👋 Proceso terminado limpiamente.');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('❌ Cierre forzado por timeout (10s). Proceso terminado abruptamente.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error: any) {
    logger.error(`❌ Error crítico al iniciar el servidor: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
};

process.on('uncaughtException', (error) => {
  logger.error(`💥 EXCEPCIÓN NO CAPTURADA: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`💥 PROMESA RECHAZADA NO MANEJADA en: ${promise}`);
  logger.error(`Razón: ${reason}`);
  process.exit(1);
});

if (NODE_ENV !== 'test') {
  startServer();
}

export default app;
