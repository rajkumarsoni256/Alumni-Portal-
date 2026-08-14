const adminExportService = require('../services/adminExportService');
const adminAuditService = require('../services/adminAuditService');
const { errorResponse } = require('../utils/response');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Controller to handle CSV export requests
 */
const exportUsers = async (req, res, next) => {
  try {
    const { userIds, filters, columns } = req.body || {};

    // 1. Validate userIds if provided
    if (userIds !== undefined && userIds !== null) {
      if (!Array.isArray(userIds)) {
        return errorResponse(res, 'userIds must be an array of UUIDs', 'INVALID_ID_FORMAT', 400);
      }
      for (const id of userIds) {
        if (!id || typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
          return errorResponse(res, `Invalid user ID format: "${id}". Must be a valid UUID.`, 'INVALID_ID_FORMAT', 400);
        }
      }
    }

    // 2. Validate columns if provided
    if (columns !== undefined && columns !== null && !Array.isArray(columns)) {
      return errorResponse(res, 'columns must be an array of column key names', 'INVALID_COLUMN', 400);
    }

    // 3. Record Audit Event
    adminAuditService.logAdminAction({
      adminUserId: req.user?.id,
      action: 'USER_EXPORTED',
      targetEntity: 'USER',
      details: {
        mode: Array.isArray(userIds) && userIds.length > 0 ? 'selected' : 'filtered',
        recordCount: Array.isArray(userIds) && userIds.length > 0 ? userIds.length : undefined,
        columns: Array.isArray(columns) ? columns : 'default',
      },
    }).catch((err) => console.error('Failed to log USER_EXPORTED audit:', err));

    // 4. Delegate to streaming service
    await adminExportService.exportUsersStream(
      {
        userIds: Array.isArray(userIds) ? userIds.map((id) => id.trim()) : [],
        filters: filters && typeof filters === 'object' ? filters : {},
        columns: Array.isArray(columns) ? columns : undefined,
      },
      res
    );
  } catch (err) {
    if (!res.headersSent) {
      console.error('Error initiating CSV export:', err);
      return errorResponse(
        res,
        err.message || 'Failed to generate CSV export',
        err.errorCode || 'EXPORT_ERROR',
        err.statusCode || 500
      );
    } else {
      console.error('Error during CSV streaming:', err);
      res.end();
    }
  }
};

module.exports = {
  exportUsers,
};
