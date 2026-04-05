/**
 * Constants used throughout the application.
 */

// ── Role definitions ──
export const ROLES = {
  VIEWER: 'VIEWER',
  ANALYST: 'ANALYST',
  ADMIN: 'ADMIN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// ── User status ──
export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

// ── Financial record types ──
export const RECORD_TYPES = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const;

export type RecordType = (typeof RECORD_TYPES)[keyof typeof RECORD_TYPES];

// ── Predefined categories ──
export const CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Rent',
  'Utilities',
  'Marketing',
  'Food',
  'Travel',
  'Healthcare',
  'Education',
  'Entertainment',
  'Savings',
  'Insurance',
  'Taxes',
  'Other',
] as const;

// ── Pagination defaults ──
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
