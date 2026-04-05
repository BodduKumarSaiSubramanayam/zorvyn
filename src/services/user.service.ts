import prisma from '../lib/prisma';
import { NotFoundError, ForbiddenError } from '../lib/errors';
import { UserUpdateInput } from '../schemas/validation';

/**
 * User management service — handles CRUD operations for users (Admin only).
 */
export class UserService {
  /**
   * Get all users (excluding passwords).
   */
  static async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { records: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single user by ID.
   */
  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { records: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError(`User with ID '${id}' not found.`);
    }

    return user;
  }

  /**
   * Update a user's role or status.
   */
  static async updateUser(id: string, data: UserUpdateInput, adminId: string) {
    // Prevent admin from demoting themselves
    if (id === adminId && data.role && data.role !== 'ADMIN') {
      throw new ForbiddenError('You cannot change your own role.');
    }

    // Prevent admin from deactivating themselves
    if (id === adminId && data.status === 'INACTIVE') {
      throw new ForbiddenError('You cannot deactivate your own account.');
    }

    // Check user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundError(`User with ID '${id}' not found.`);
    }

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete a user (hard delete). Admin cannot delete themselves.
   */
  static async deleteUser(id: string, adminId: string) {
    if (id === adminId) {
      throw new ForbiddenError('You cannot delete your own account.');
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundError(`User with ID '${id}' not found.`);
    }

    await prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully.' };
  }
}
