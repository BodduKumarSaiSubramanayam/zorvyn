import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserService } from '../services/user.service';
import { userUpdateSchema } from '../schemas/validation';
import { successResponse } from '../lib/response';

/**
 * User Controller — handles user management (Admin only).
 */

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await UserService.getAllUsers();
    res.status(200).json({
      success: true,
      message: `Found ${users.length} users.`,
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await UserService.getUserById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'User retrieved successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = userUpdateSchema.parse(req.body);
    const user = await UserService.updateUser(req.params.id, validatedData, req.user!.id);
    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await UserService.deleteUser(req.params.id, req.user!.id);
    res.status(200).json(
      successResponse(result, result.message)
    );
  } catch (error) {
    next(error);
  }
};
