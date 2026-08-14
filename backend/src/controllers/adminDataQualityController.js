const adminDataQualityService = require('../services/adminDataQualityService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Controller to fetch data quality metrics and hygiene stats
 */
const getDataQualityStats = async (req, res, next) => {
  try {
    const stats = await adminDataQualityService.getDataQualityStats();
    return successResponse(res, stats, 'Data quality statistics retrieved successfully');
  } catch (err) {
    console.error('Error fetching admin data quality stats:', err);
    return errorResponse(res, 'Failed to fetch data quality statistics', 'INTERNAL_SERVER_ERROR', 500);
  }
};

module.exports = {
  getDataQualityStats,
};
