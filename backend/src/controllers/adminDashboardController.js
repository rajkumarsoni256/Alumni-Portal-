const adminDashboardService = require('../services/adminDashboardService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Controller to fetch comprehensive administrative dashboard statistics
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const data = await adminDashboardService.getDashboardStats();
    return successResponse(res, data, 'Dashboard statistics retrieved successfully');
  } catch (err) {
    console.error('Error fetching admin dashboard statistics:', err);
    return errorResponse(res, 'Failed to fetch dashboard statistics', 'DASHBOARD_STATS_ERROR', 500);
  }
};

const getEmailHealthStats = async (req, res, next) => {
  try {
    const provider = (process.env.EMAIL_PROVIDER || 'console').toLowerCase().trim();
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const from = process.env.EMAIL_FROM || 'no-reply@jecrc.ac.in';
    const mode = process.env.EMAIL_MODE || 'development';

    const isConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

    return successResponse(
      res,
      {
        provider,
        configured: isConfigured,
        host,
        port,
        from,
        mode,
      },
      'Email system health status retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getEmailHealthStats,
};
