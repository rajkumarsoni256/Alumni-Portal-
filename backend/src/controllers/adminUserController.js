const adminUserService = require('../services/adminUserService');
const adminAuditService = require('../services/adminAuditService');
const { successResponse, errorResponse } = require('../utils/response');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_SORT_FIELDS = ['name', 'batch', 'lastupdated', 'createdat'];
const ALLOWED_SORT_ORDERS = ['asc', 'desc'];

/**
 * Controller to list users directory with pagination, search, and filtering
 */
const getUsers = async (req, res, next) => {
  try {
    const {
      page,
      pageSize,
      limit,
      q,
      role,
      branch,
      batch,
      batchFrom,
      batchTo,
      city,
      company,
      status,
      profileStatus,
      missing,
      missingFields,
      lastUpdated,
      sortBy,
      sortOrder,
    } = req.query;

    // Validate sortBy if provided
    if (sortBy && !ALLOWED_SORT_FIELDS.includes(String(sortBy).toLowerCase())) {
      return errorResponse(
        res,
        `Invalid sortBy parameter. Allowed values: name, batch, lastUpdated, createdAt`,
        'INVALID_QUERY',
        400
      );
    }

    // Validate sortOrder if provided
    if (sortOrder && !ALLOWED_SORT_ORDERS.includes(String(sortOrder).toLowerCase())) {
      return errorResponse(
        res,
        `Invalid sortOrder parameter. Allowed values: asc, desc`,
        'INVALID_QUERY',
        400
      );
    }

    const data = await adminUserService.getUsers({
      page,
      pageSize,
      limit,
      q,
      role,
      branch,
      batch,
      batchFrom,
      batchTo,
      city,
      company,
      status,
      profileStatus,
      missing,
      missingFields,
      lastUpdated,
      sortBy,
      sortOrder,
    });

    return successResponse(res, data, 'Users retrieved successfully');
  } catch (err) {
    console.error('Error fetching admin users list:', err);
    return errorResponse(res, 'Failed to fetch user directory', 'INTERNAL_SERVER_ERROR', 500);
  }
};

/**
 * Controller to get single user profile details by ID
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || !UUID_REGEX.test(id.trim())) {
      return errorResponse(
        res,
        'Invalid user ID format. Must be a valid UUID.',
        'INVALID_ID_FORMAT',
        400
      );
    }

    const user = await adminUserService.getUserById(id.trim());

    if (!user) {
      return errorResponse(res, `User record not found with ID: ${id}`, 'USER_NOT_FOUND', 404);
    }

    // Observational audit log (non-blocking)
    adminAuditService.logAdminAction({
      adminUserId: req.user?.id,
      action: 'USER_VIEWED',
      targetEntity: 'USER',
      targetId: id.trim(),
      details: {
        targetUserId: id.trim(),
        targetUserName: user.name,
        targetRole: user.role,
      },
    }).catch((err) => console.error('Failed to log USER_VIEWED audit:', err));

    return successResponse(res, user, 'User details retrieved successfully');
  } catch (err) {
    console.error('Error fetching admin user details:', err);
    return errorResponse(res, 'Failed to fetch user details', 'INTERNAL_SERVER_ERROR', 500);
  }
};

module.exports = {
  getUsers,
  getUserById,
};
