import prisma from '../lib/prisma';

/**
 * Dashboard service — provides aggregated analytics and summary data.
 */
export class DashboardService {
  /**
   * Get overall financial summary: totals, net balance, category-wise breakdown.
   */
  static async getSummary() {
    const records = await prisma.financialRecord.findMany({
      where: { isDeleted: false },
      select: { amount: true, type: true, category: true },
    });

    const totalIncome = records
      .filter((r) => r.type === 'INCOME')
      .reduce((sum, r) => sum + r.amount, 0);

    const totalExpenses = records
      .filter((r) => r.type === 'EXPENSE')
      .reduce((sum, r) => sum + r.amount, 0);

    const netBalance = totalIncome - totalExpenses;

    // Category-wise breakdown with income and expense split
    const categoryBreakdown: Record<string, { income: number; expense: number; net: number }> = {};
    records.forEach((r) => {
      if (!categoryBreakdown[r.category]) {
        categoryBreakdown[r.category] = { income: 0, expense: 0, net: 0 };
      }
      if (r.type === 'INCOME') {
        categoryBreakdown[r.category].income += r.amount;
      } else {
        categoryBreakdown[r.category].expense += r.amount;
      }
      categoryBreakdown[r.category].net =
        categoryBreakdown[r.category].income - categoryBreakdown[r.category].expense;
    });

    // Top expense categories (sorted by expense amount)
    const topExpenseCategories = Object.entries(categoryBreakdown)
      .filter(([_, data]) => data.expense > 0)
      .sort((a, b) => b[1].expense - a[1].expense)
      .slice(0, 5)
      .map(([category, data]) => ({ category, amount: data.expense }));

    // Top income sources (sorted by income amount)
    const topIncomeSources = Object.entries(categoryBreakdown)
      .filter(([_, data]) => data.income > 0)
      .sort((a, b) => b[1].income - a[1].income)
      .slice(0, 5)
      .map(([category, data]) => ({ category, amount: data.income }));

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netBalance: Math.round(netBalance * 100) / 100,
      totalRecords: records.length,
      categoryBreakdown,
      topExpenseCategories,
      topIncomeSources,
      savingsRate: totalIncome > 0 ? Math.round((netBalance / totalIncome) * 10000) / 100 : 0,
    };
  }

  /**
   * Get recent activity (last N records).
   */
  static async getRecentActivity(limit: number = 10) {
    return prisma.financialRecord.findMany({
      where: { isDeleted: false },
      orderBy: [
        { createdAt: 'desc' }, // Sort by input time first to show "most recently added"
        { date: 'desc' }       // Then by financial date
      ],
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Get monthly trends for the last N months.
   */
  static async getMonthlyTrends(months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const records = await prisma.financialRecord.findMany({
      where: {
        isDeleted: false,
        date: { gte: startDate },
      },
      select: { date: true, amount: true, type: true },
      orderBy: { date: 'asc' },
    });

    const trends: Record<string, { month: string; income: number; expenses: number; net: number; count: number }> = {};

    records.forEach((r) => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

      if (!trends[key]) {
        trends[key] = { month: monthName, income: 0, expenses: 0, net: 0, count: 0 };
      }

      if (r.type === 'INCOME') {
        trends[key].income += r.amount;
      } else {
        trends[key].expenses += r.amount;
      }
      trends[key].net = trends[key].income - trends[key].expenses;
      trends[key].count += 1;
    });

    // Sort by date and return as array
    return Object.entries(trends)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        period: key,
        ...data,
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
        net: Math.round(data.net * 100) / 100,
      }));
  }

  /**
   * Get weekly trends for the last N weeks.
   */
  static async getWeeklyTrends(weeks: number = 8) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);
    startDate.setHours(0, 0, 0, 0);

    const records = await prisma.financialRecord.findMany({
      where: {
        isDeleted: false,
        date: { gte: startDate },
      },
      select: { date: true, amount: true, type: true },
      orderBy: { date: 'asc' },
    });

    const trends: Record<string, { week: string; income: number; expenses: number; net: number; count: number }> = {};

    records.forEach((r) => {
      const d = new Date(r.date);
      // Get ISO week number
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const diff = d.getTime() - startOfYear.getTime();
      const weekNum = Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7);
      const key = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

      if (!trends[key]) {
        trends[key] = { week: key, income: 0, expenses: 0, net: 0, count: 0 };
      }

      if (r.type === 'INCOME') {
        trends[key].income += r.amount;
      } else {
        trends[key].expenses += r.amount;
      }
      trends[key].net = trends[key].income - trends[key].expenses;
      trends[key].count += 1;
    });

    return Object.entries(trends)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, data]) => ({
        ...data,
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
        net: Math.round(data.net * 100) / 100,
      }));
  }

  /**
   * Get comprehensive dashboard data in a single call.
   */
  static async getFullDashboard() {
    const [summary, recentActivity, monthlyTrends, weeklyTrends] = await Promise.all([
      DashboardService.getSummary(),
      DashboardService.getRecentActivity(10),
      DashboardService.getMonthlyTrends(12),
      DashboardService.getWeeklyTrends(8),
    ]);

    return {
      summary,
      recentActivity,
      monthlyTrends,
      weeklyTrends,
    };
  }
}
