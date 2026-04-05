import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { RecordService } from '../services/record.service';
import { createRecordSchema, updateRecordSchema, recordQuerySchema } from '../schemas/validation';
import { successResponse, paginatedResponse } from '../lib/response';
import { Role } from '../lib/constants';

/**
 * Record Controller — handles financial record CRUD operations.
 */

export const createRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = createRecordSchema.parse(req.body);
    const record = await RecordService.create(validatedData, req.user!.id);

    res.status(201).json(
      successResponse(record, 'Financial record created successfully.')
    );
  } catch (error) {
    next(error);
  }
};

export const getRecordById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await RecordService.getById(req.params.id);
    res.status(200).json(
      successResponse(record, 'Record retrieved successfully.')
    );
  } catch (error) {
    next(error);
  }
};

export const getRecords = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedQuery = recordQuerySchema.parse(req.query);
    const { records, total, page, limit } = await RecordService.getAll(validatedQuery);

    res.status(200).json(
      paginatedResponse(records, total, page, limit, 'Records retrieved successfully.')
    );
  } catch (error) {
    next(error);
  }
};

export const updateRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = updateRecordSchema.parse(req.body);
    const record = await RecordService.update(
      req.params.id,
      validatedData,
      req.user!.id,
      req.user!.role as Role
    );

    res.status(200).json(
      successResponse(record, 'Record updated successfully.')
    );
  } catch (error) {
    next(error);
  }
};

export const deleteRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const soft = req.query.soft !== 'false'; // Default to soft delete
    const result = await RecordService.delete(
      req.params.id,
      req.user!.id,
      req.user!.role as Role,
      soft
    );

    res.status(200).json(
      successResponse(result, result.message)
    );
  } catch (error) {
    next(error);
  }
};

export const restoreRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await RecordService.restore(req.params.id);
    res.status(200).json(
      successResponse(record, 'Record restored successfully.')
    );
  } catch (error) {
    next(error);
  }
};
