import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { UnauthorizedError, ForbiddenError } from '../lib/errors';
import { Role, ROLES } from '../lib/constants';

/**
 * Extended Request type that includes the authenticated user's info.
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

/**
 * JWT payload structure.
 */
interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

/**
 * Authentication middleware.
 * Verifies the JWT token from the Authorization header and attaches user info to the request.
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication required. Please provide a valid Bearer token.');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Token is missing from the Authorization header.');
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as JwtPayload;

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    if (!user) {
      throw new UnauthorizedError('User associated with this token no longer exists.');
    }

    if (user.status === 'INACTIVE') {
      throw new ForbiddenError(
        'Your account has been deactivated. Please contact an administrator.'
      );
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token. Please login again.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token has expired. Please login again.'));
    }
    next(error);
  }
};

/**
 * Authorization middleware factory.
 * Restricts access to users with specific roles.
 * 
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export const authorize = (allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication is required before authorization.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
        )
      );
    }

    next();
  };
};
