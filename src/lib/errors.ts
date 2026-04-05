/**
 * Custom application error class with HTTP status code support.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: any[];

  constructor(message: string, statusCode: number = 500, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', errors?: any[]) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', errors?: any[]) {
    super(message, 422, errors);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(message, 429);
  }
}
