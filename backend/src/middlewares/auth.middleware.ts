/**
 * src/middlewares/auth.middleware.ts — Middleware de Autenticación y Autorización (TypeScript)
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import logger from '../utils/logger';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        isActive: boolean;
      };
    }
  }
}

export const authenticate: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        status: 'error',
        message: 'Acceso denegado. Se requiere token de autenticación.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined') {
      res.status(401).json({
        status: 'error',
        message: 'Token de autenticación inválido.',
      });
      return;
    }

    let decoded: any;
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET no está definido en las variables de entorno.');
      }
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        res.status(401).json({
          status: 'error',
          message: 'El token de autenticación ha expirado.',
          code: 'TOKEN_EXPIRED',
        });
        return;
      }
      if (jwtError.name === 'JsonWebTokenError') {
        res.status(401).json({
          status: 'error',
          message: 'Token de autenticación malformado o inválido.',
        });
        return;
      }
      throw jwtError;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'El usuario asociado a este token no existe.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        status: 'error',
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.',
      });
      return;
    }

    req.user = user;
    next();

  } catch (error: any) {
    logger.error(`Error en middleware de autenticación: ${error.message}`);
    next(error);
  }
};

export const authorize = (...roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Se requiere autenticación previa.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        `Intento de acceso no autorizado: Usuario ${req.user.email} (rol: ${req.user.role}) ` +
        `intentó acceder a un recurso que requiere: [${roles.join(', ')}]`
      );

      res.status(403).json({
        status: 'error',
        message: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}.`,
      });
      return;
    }

    next();
  };
};
