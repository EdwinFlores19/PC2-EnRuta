export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public type?: string;
  public errors?: any;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(errors: any) {
    super('Error de validación', 422);
    this.errors = errors;
    this.type = 'validation';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe') {
    super(message, 409);
  }
}
