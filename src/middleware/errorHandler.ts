import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import { errorResponse } from '../lib/response';

/**
 * Global error handler middleware.
 * Catches all errors thrown by controllers/middleware and returns a consistent JSON response.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error] ${err.message}`);
    if (!(err instanceof AppError)) {
      console.error(err.stack);
    }
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(422).json(
      errorResponse('Validation failed', formattedErrors)
    );
    return;
  }

  // Handle custom application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      errorResponse(err.message, err.errors)
    );
    return;
  }

  // Handle Prisma known errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    
    if (prismaErr.code === 'P2002') {
      const target = prismaErr.meta?.target;
      res.status(409).json(
        errorResponse(`A record with this ${target || 'value'} already exists.`)
      );
      return;
    }

    if (prismaErr.code === 'P2025') {
      res.status(404).json(
        errorResponse('The requested record was not found.')
      );
      return;
    }
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json(
      errorResponse('Invalid JSON in request body.')
    );
    return;
  }

  // Default: Internal server error
  res.status(500).json(
    errorResponse(
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please try again later.'
        : err.message || 'Internal Server Error'
    )
  );
};

/**
 * 404 Not Found handler for unknown routes.
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(
    errorResponse(`Route ${req.method} ${req.originalUrl} not found.`)
  );
};
