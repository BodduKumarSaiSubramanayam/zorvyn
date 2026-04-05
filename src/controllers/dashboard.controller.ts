import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DashboardService } from '../services/dashboard.service';
import { successResponse } from '../lib/response';

/**
 * Dashboard Controller — provides analytics and summary endpoints.
 */

export const getSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const summary = await DashboardService.getSummary();
    res.status(200).json(
      successResponse(summary, 'Dashboard summary retrieved successfully.')
    );
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const activity = await DashboardService.getRecentActivity(limit);
    res.status(200).json(
      successResponse(activity, 'Recent activity retrieved successfully.')
    );
  } catch (error) {
    next(error);
  }
};

export const getMonthlyTrends = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const months = Math.min(Number(req.query.months) || 12, 24);
    const trends = await DashboardService.getMonthlyTrends(months);
    res.status(200).json(
      successResponse(trends, 'Monthly trends retrieved successfully.')
    );
  } catch (error) {
    next(error);
  }
};

export const getWeeklyTrends = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const weeks = Math.min(Number(req.query.weeks) || 8, 52);
    const trends = await DashboardService.getWeeklyTrends(weeks);
    res.status(200).json(
      successResponse(trends, 'Weekly trends retrieved successfully.')
    );
  } catch (error) {
    next(error);
  }
};

export const getFullDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dashboard = await DashboardService.getFullDashboard();
    res.status(200).json(
      successResponse(dashboard, 'Full dashboard data retrieved successfully.')
    );
  } catch (error) {
    next(error);
  }
};
