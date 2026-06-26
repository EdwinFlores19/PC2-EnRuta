/**
 * src/utils/jwt.helper.ts — Utilidades para gestión de tokens JWT (TypeScript)
 */

import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno.');
  }

  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: (process.env.JWT_EXPIRES_IN as any) || '7d',
      issuer: 'pc2-pfdc3-api',
      audience: 'pc2-pfdc3-client',
    }
  );
};

export const generateRefreshToken = (userId: string): string => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET no está definido en las variables de entorno.');
  }

  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as any) || '30d',
      issuer: 'pc2-pfdc3-api',
      audience: 'pc2-pfdc3-client',
    }
  );
};

export const verifyAccessToken = (token: string): any => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno.');
  }
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'pc2-pfdc3-api',
    audience: 'pc2-pfdc3-client',
  });
};

export const verifyRefreshToken = (token: string): any => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET no está definido en las variables de entorno.');
  }
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: 'pc2-pfdc3-api',
    audience: 'pc2-pfdc3-client',
  });
};
