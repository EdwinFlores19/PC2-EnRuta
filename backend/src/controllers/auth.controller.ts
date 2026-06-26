/**
 * src/controllers/auth.controller.ts — Controlador de Autenticación (TypeScript)
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { asyncHandler, buildResponse } from '../utils/index';
import { generateAccessToken } from '../utils/jwt.helper';
import { UnauthorizedError } from '../utils/AppError';

/**
 * Autentica un usuario y genera un JWT Access Token.
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Los campos "email" y "password" son obligatorios.',
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new UnauthorizedError('Credenciales incorrectas (usuario no encontrado).');
  }

  if (!user.isActive) {
    return res.status(403).json({
      status: 'error',
      message: 'Esta cuenta ha sido suspendida.',
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Credenciales incorrectas (contraseña inválida).');
  }

  // Generar JWT
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(200).json(
    buildResponse({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    }, 'Inicio de sesión exitoso.')
  );
});

/**
 * Obtiene la lista de usuarios sembrados para facilitar la depuración/testeo de roles en el frontend.
 * GET /api/v1/auth/debug/users
 */
export const getDebugUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
    take: 10,
  });

  res.status(200).json(
    buildResponse(users, 'Usuarios de prueba obtenidos correctamente.')
  );
});
