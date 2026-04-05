import { z } from 'zod';
import { ROLES, RECORD_TYPES, USER_STATUS, PAGINATION } from '../lib/constants';

// ── Auth Schemas ──

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

// ── User Schemas ──

export const userUpdateSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters')
      .trim()
      .optional(),
    role: z.enum([ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN], {
      errorMap: () => ({ message: `Role must be one of: ${Object.values(ROLES).join(', ')}` }),
    }).optional(),
    status: z.enum([USER_STATUS.ACTIVE, USER_STATUS.INACTIVE], {
      errorMap: () => ({ message: `Status must be one of: ${Object.values(USER_STATUS).join(', ')}` }),
    }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

// ── Financial Record Schemas ──

export const createRecordSchema = z.object({
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be a positive number')
    .max(999999999.99, 'Amount exceeds maximum allowed value'),
  type: z.enum([RECORD_TYPES.INCOME, RECORD_TYPES.EXPENSE], {
    errorMap: () => ({ message: `Type must be one of: ${Object.values(RECORD_TYPES).join(', ')}` }),
  }),
  category: z
    .string({ required_error: 'Category is required' })
    .min(1, 'Category cannot be empty')
    .max(50, 'Category must be at most 50 characters')
    .trim(),
  date: z
    .string({ required_error: 'Date is required' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Date must be a valid date string (e.g., 2024-01-15 or ISO 8601 format)',
    }),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .optional()
    .default(''),
  notes: z
    .string()
    .max(1000, 'Notes must be at most 1000 characters')
    .trim()
    .optional()
    .nullable(),
});

export const updateRecordSchema = z
  .object({
    amount: z
      .number({ invalid_type_error: 'Amount must be a number' })
      .positive('Amount must be a positive number')
      .max(999999999.99, 'Amount exceeds maximum allowed value')
      .optional(),
    type: z.enum([RECORD_TYPES.INCOME, RECORD_TYPES.EXPENSE], {
      errorMap: () => ({ message: `Type must be one of: ${Object.values(RECORD_TYPES).join(', ')}` }),
    }).optional(),
    category: z
      .string()
      .min(1, 'Category cannot be empty')
      .max(50, 'Category must be at most 50 characters')
      .trim()
      .optional(),
    date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Date must be a valid date string',
      })
      .optional(),
    description: z
      .string()
      .max(500, 'Description must be at most 500 characters')
      .trim()
      .optional(),
    notes: z
      .string()
      .max(1000, 'Notes must be at most 1000 characters')
      .trim()
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

// ── Query Schemas ──

export const recordQuerySchema = z.object({
  type: z.enum([RECORD_TYPES.INCOME, RECORD_TYPES.EXPENSE]).optional(),
  category: z.string().optional(),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date' })
    .optional(),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date' })
    .optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION.MAX_LIMIT, `Limit cannot exceed ${PAGINATION.MAX_LIMIT}`)
    .default(PAGINATION.DEFAULT_LIMIT),
  sortBy: z.enum(['date', 'amount', 'category', 'type', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Export inferred types for use in controllers
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type RecordQueryInput = z.infer<typeof recordQuerySchema>;
