/**
 * src/controllers/auth.controller.ts — Controlador de Autenticación (TypeScript)
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { asyncHandler, buildResponse } from '../utils/index';
import { generateAccessToken } from '../utils/jwt.helper';
import { UnauthorizedError, ConflictError } from '../utils/AppError';

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
 * Registra un nuevo usuario en Supabase (PostgreSQL) vía Prisma.
 * Crea automáticamente billetera y perfil de formalización.
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role = 'USER' } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ConflictError('Ya existe una cuenta registrada con este correo electrónico.');
  }

  const bcryptRounds = Number(process.env.BCRYPT_ROUNDS) || 10;
  const hashedPassword = await bcrypt.hash(password, bcryptRounds);

  const validRoles = ['USER', 'WORKER', 'EMPLOYER', 'ADMIN'];
  const assignedRole = validRoles.includes(role) ? role : 'USER';

  const newUser = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      isActive: true,
      wallet: {
        create: {
          balance: 0,
          currency: 'PEN',
          type: assignedRole === 'WORKER' ? 'MERCHANT' : 'PLATFORM',
        },
      },
      formalizationProfile: {
        create: {
          score: 0,
          semaphoreColor: 'RED',
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  const accessToken = generateAccessToken({
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
  });

  res.status(201).json(
    buildResponse({
      accessToken,
      user: newUser,
    }, 'Cuenta creada exitosamente. Bienvenido a EnRuta.')
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

/**
 * Refresca el Token de Acceso JWT de forma segura descodificando el token expirado.
 * POST /api/v1/auth/refresh-token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Se requiere token para refrescar la sesión.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no está definido.');
    }

    // Decodificar el token ignorando la expiración para comprobar la firma
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      ignoreExpiration: true,
      issuer: 'pc2-pfdc3-api',
      audience: 'pc2-pfdc3-client',
    }) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Usuario inválido o cuenta suspendida.',
      });
    }

    // Generar un nuevo accessToken válido
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json(
      buildResponse({ accessToken: newAccessToken }, 'Token refrescado con éxito.')
    );
  } catch (error: any) {
    res.status(401).json({
      status: 'error',
      message: 'Token de refresh inválido o malformado.',
    });
  }
});
