import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { ConflictError, UnauthorizedError, ForbiddenError } from '../lib/errors';
import { RegisterInput, LoginInput } from '../schemas/validation';
import { Role } from '../lib/constants';

/**
 * Authentication service — handles registration and login logic.
 */
export class AuthService {
  /**
   * Register a new user with the default VIEWER role.
   */
  static async register(data: RegisterInput) {
    const { name, email, password } = data;

    // Check for existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('A user with this email address already exists.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'VIEWER',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = AuthService.generateToken(user.id, user.email, user.role as Role);

    return { user, token };
  }

  /**
   * Login with email and password, returning a JWT.
   */
  static async login(data: LoginInput) {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    // Check status
    if (user.status === 'INACTIVE') {
      throw new ForbiddenError(
        'Your account has been deactivated. Please contact an administrator.'
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    // Generate token
    const token = AuthService.generateToken(user.id, user.email, user.role as Role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      token,
    };
  }

  /**
   * Generate a JWT token.
   */
  private static generateToken(id: string, email: string, role: Role): string {
    const secret: jwt.Secret = process.env.JWT_SECRET || 'secret';
    return jwt.sign({ id, email, role }, secret, { expiresIn: '24h' } as jwt.SignOptions);
  }
}
