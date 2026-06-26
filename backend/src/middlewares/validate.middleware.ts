/**
 * src/middlewares/validate.middleware.ts — Middleware de Validación de Inputs (TypeScript)
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validationResult, param, query, ValidationChain } from 'express-validator';

export const validate: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: any) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    res.status(422).json({
      status: 'error',
      message: 'Los datos enviados contienen errores de validación.',
      errors: formattedErrors,
    });
    return;
  }

  next();
};

export const commonRules = {
  isUUID: (field = 'id'): ValidationChain => {
    return param(field)
      .isUUID(4)
      .withMessage(`El parámetro '${field}' debe ser un UUID válido (v4).`);
  },

  pagination: (): ValidationChain[] => {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage("El parámetro 'page' debe ser un entero mayor a 0.")
        .toInt(),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("El parámetro 'limit' debe ser un entero entre 1 y 100.")
        .toInt(),
    ];
  },
};
