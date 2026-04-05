import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../schemas/validation';
import { successResponse } from '../lib/response';

/**
 * Auth Controller — handles registration and login requests.
 */

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await AuthService.register(validatedData);

    res.status(201).json(
      successResponse(result, 'User registered successfully.')
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await AuthService.login(validatedData);

    res.status(200).json(
      successResponse(result, 'Login successful.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get the current user's profile from the JWT token.
 */
export const getProfile = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json(
      successResponse({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      }, 'Profile retrieved successfully.')
    );
  } catch (error) {
    next(error);
  }
};
