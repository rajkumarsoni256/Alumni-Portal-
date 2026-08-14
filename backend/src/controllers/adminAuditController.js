const adminAuditService = require('../services/adminAuditService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Controller to fetch paginated & filtered audit logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const data = await adminAuditService.getAuditLogs(req.query);
    return successResponse(res, data, 'Audit logs retrieved successfully');
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return errorResponse(res, 'Failed to fetch audit logs', 'AUDIT_LOG_ERROR', 500);
  }
};

/**
 * Controller to fetch recent activity stream derived from audit_logs
 */
const getRecentActivity = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const data = await adminAuditService.getRecentActivity({ limit });
    return successResponse(res, data, 'Recent activity stream retrieved successfully');
  } catch (err) {
    console.error('Error fetching activity stream:', err);
    return errorResponse(res, 'Failed to fetch activity stream', 'ACTIVITY_ERROR', 500);
  }
};

module.exports = {
  getAuditLogs,
  getRecentActivity,
};
