/**
 * src/utils/logger.ts — Logger Centralizado con Winston (TypeScript)
 */

import { createLogger, format, transports } from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors, json, splat } = format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  json()
);

const isDevelopment = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

export const logger = createLogger({
  level: logLevel,
  format: isDevelopment ? devFormat : prodFormat,
  defaultMeta: {
    service: process.env.npm_package_name || 'backend-api',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    new transports.Console({
      silent: process.env.NODE_ENV === 'test',
    }),
    new transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
    ...(process.env.NODE_ENV === 'production'
      ? [
          new transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            maxsize: 20 * 1024 * 1024,
            maxFiles: 10,
            tailable: true,
          }),
        ]
      : []),
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join(__dirname, '../../logs/exceptions.log') }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(__dirname, '../../logs/rejections.log') }),
  ],
});

export default logger;
