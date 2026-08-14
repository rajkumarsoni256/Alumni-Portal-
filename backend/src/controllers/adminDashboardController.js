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

module.exports = {
  getDashboardStats,
};
