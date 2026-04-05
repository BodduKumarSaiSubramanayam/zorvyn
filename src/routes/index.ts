import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/user.controller';
import {
  createRecord,
  getRecordById,
  getRecords,
  updateRecord,
  deleteRecord,
  restoreRecord,
} from '../controllers/record.controller';
import {
  getSummary,
  getRecentActivity,
  getMonthlyTrends,
  getWeeklyTrends,
  getFullDashboard,
} from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { ROLES } from '../lib/constants';

const router = Router();

// ═══════════════════════════════════════════════
// Authentication Routes (Public)
// ═══════════════════════════════════════════════
router.post('/auth/register', authLimiter, register);
router.post('/auth/login', authLimiter, login);

// ═══════════════════════════════════════════════
// Profile Route (Any authenticated user)
// ═══════════════════════════════════════════════
router.get('/auth/profile', authenticate, getProfile);

// ═══════════════════════════════════════════════
// User Management Routes (Admin Only)
// ═══════════════════════════════════════════════
router.get('/users', authenticate, authorize([ROLES.ADMIN]), getUsers);
router.get('/users/:id', authenticate, authorize([ROLES.ADMIN]), getUserById);
router.patch('/users/:id', authenticate, authorize([ROLES.ADMIN]), updateUser);
router.delete('/users/:id', authenticate, authorize([ROLES.ADMIN]), deleteUser);

// ═══════════════════════════════════════════════
// Financial Records Routes (Role-based)
// ═══════════════════════════════════════════════

// View records — Analyst and Admin
router.get('/records', authenticate, authorize([ROLES.ANALYST, ROLES.ADMIN]), getRecords);
router.get('/records/:id', authenticate, authorize([ROLES.ANALYST, ROLES.ADMIN]), getRecordById);

// Create, Update, Delete records — Admin only
router.post('/records', authenticate, authorize([ROLES.ADMIN]), createRecord);
router.put('/records/:id', authenticate, authorize([ROLES.ADMIN]), updateRecord);
router.delete('/records/:id', authenticate, authorize([ROLES.ADMIN]), deleteRecord);

// Restore soft-deleted records — Admin only
router.patch('/records/:id/restore', authenticate, authorize([ROLES.ADMIN]), restoreRecord);

// ═══════════════════════════════════════════════
// Dashboard Routes (All authenticated roles)
// ═══════════════════════════════════════════════
router.get(
  '/dashboard/summary',
  authenticate,
  authorize([ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN]),
  getSummary
);
router.get(
  '/dashboard/recent',
  authenticate,
  authorize([ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN]),
  getRecentActivity
);
router.get(
  '/dashboard/trends/monthly',
  authenticate,
  authorize([ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN]),
  getMonthlyTrends
);
router.get(
  '/dashboard/trends/weekly',
  authenticate,
  authorize([ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN]),
  getWeeklyTrends
);
router.get(
  '/dashboard',
  authenticate,
  authorize([ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN]),
  getFullDashboard
);

export default router;
