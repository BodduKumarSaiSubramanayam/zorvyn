import prisma from '../lib/prisma';
import { NotFoundError, ForbiddenError } from '../lib/errors';
import { CreateRecordInput, UpdateRecordInput, RecordQueryInput } from '../schemas/validation';
import { Role, ROLES } from '../lib/constants';

/**
 * Financial record service — handles CRUD, filtering, searching, and pagination.
 */
export class RecordService {
  /**
   * Create a new financial record.
   */
  static async create(data: CreateRecordInput, userId: string) {
    const record = await prisma.financialRecord.create({
      data: {
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: new Date(data.date),
        description: data.description || '',
        notes: data.notes || null,
        userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return record;
  }

  /**
   * Get a single record by ID.
   */
  static async getById(id: string) {
    const record = await prisma.financialRecord.findFirst({
      where: { id, isDeleted: false },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!record) {
      throw new NotFoundError(`Financial record with ID '${id}' not found.`);
    }

    return record;
  }

  /**
   * Get records with filtering, searching, sorting, and pagination.
   */
  static async getAll(query: RecordQueryInput) {
    const { type, category, startDate, endDate, search, page, limit, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { isDeleted: false };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = { contains: category };
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Search across category, description, and notes
    if (search) {
      where.OR = [
        { category: { contains: search } },
        { description: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.financialRecord.count({ where }),
    ]);

    return { records, total, page, limit };
  }

  /**
   * Update a financial record. Only the creator or an admin can update.
   */
  static async update(id: string, data: UpdateRecordInput, userId: string, userRole: Role) {
    const existing = await prisma.financialRecord.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundError(`Financial record with ID '${id}' not found.`);
    }

    // Only the creator or an admin can update
    if (existing.userId !== userId && userRole !== ROLES.ADMIN) {
      throw new ForbiddenError('You can only update your own records.');
    }

    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }

    return prisma.financialRecord.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Delete a financial record (supports both soft and hard delete).
   */
  static async delete(id: string, userId: string, userRole: Role, soft: boolean = true) {
    const existing = await prisma.financialRecord.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundError(`Financial record with ID '${id}' not found.`);
    }

    // Only the creator or an admin can delete
    if (existing.userId !== userId && userRole !== ROLES.ADMIN) {
      throw new ForbiddenError('You can only delete your own records.');
    }

    if (soft) {
      await prisma.financialRecord.update({
        where: { id },
        data: { isDeleted: true },
      });
      return { message: 'Record soft-deleted successfully.' };
    } else {
      await prisma.financialRecord.delete({ where: { id } });
      return { message: 'Record permanently deleted successfully.' };
    }
  }

  /**
   * Restore a soft-deleted record.
   */
  static async restore(id: string) {
    const existing = await prisma.financialRecord.findFirst({
      where: { id, isDeleted: true },
    });

    if (!existing) {
      throw new NotFoundError(`Soft-deleted record with ID '${id}' not found.`);
    }

    return prisma.financialRecord.update({
      where: { id },
      data: { isDeleted: false },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
