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
    
    // Flatten categoryBreakdown to categoryWise for frontend compatibility
    const categoryWise: Record<string, number> = {};
    Object.entries(summary.categoryBreakdown).forEach(([cat, data]) => {
      categoryWise[cat] = data.net;
    });

    res.status(200).json({
      success: true,
      message: 'Dashboard summary retrieved successfully.',
      summary: {
        ...summary,
        categoryWise,
      },
    });
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

/**
 * Compatibility endpoint for the dashboard trends (used by frontend).
 */
export const getTrendsForFrontend = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [recentActivity, monthlyTrends] = await Promise.all([
      DashboardService.getRecentActivity(10),
      DashboardService.getMonthlyTrends(12),
    ]);

    // Map monthly trends to the object structure expected by the frontend type definition
    // interface TrendData { monthlyTrends: Record<string, { income: number; expenses: number }> }
    const trendsObj: Record<string, { income: number; expenses: number }> = {};
    monthlyTrends.forEach((t) => {
      trendsObj[t.period] = { income: t.income, expenses: t.expenses };
    });

    res.status(200).json(
      successResponse({
        recentActivity,
        monthlyTrends: trendsObj,
      }, 'Dashboard trends retrieved successfully.')
    );
  } catch (error) {
    next(error);
  }
};
