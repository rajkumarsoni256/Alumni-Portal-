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

    if (id === 'stats') {
      return getUserStats(req, res, next);
    }
    if (id === 'pending-alumni') {
      return getPendingAlumni(req, res, next);
    }

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

/**
 * Controller to enable/disable user account status
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, accountStatus } = req.body;
    const targetStatus = accountStatus || status;

    if (!id || !UUID_REGEX.test(id.trim())) {
      return errorResponse(res, 'Invalid user ID format. Must be a valid UUID.', 'INVALID_ID_FORMAT', 400);
    }

    if (!targetStatus) {
      return errorResponse(res, 'Account status is required (ACTIVE or DISABLED)', 'VALIDATION_ERROR', 400);
    }

    const adminUserId = req.user?.id;
    const updatedUser = await adminUserService.updateUserStatus(adminUserId, id.trim(), targetStatus);

    return successResponse(res, updatedUser, `User account status updated to ${updatedUser.account_status}`);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.errorCode || 'BAD_REQUEST', err.statusCode);
    }
    console.error('Error updating user status:', err);
    return errorResponse(res, 'Failed to update user status', 'INTERNAL_SERVER_ERROR', 500);
  }
};

/**
 * Controller to promote Student to Alumni role
 */
const changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};

    if (!id || !UUID_REGEX.test(id.trim())) {
      return errorResponse(res, 'Invalid user ID format. Must be a valid UUID.', 'INVALID_ID_FORMAT', 400);
    }

    if (!role) {
      return errorResponse(res, 'Role property is required in request body.', 'VALIDATION_ERROR', 400);
    }

    const adminUserId = req.user?.id;
    const updatedUser = await adminUserService.updateUserRole(adminUserId, id.trim(), role);

    return successResponse(res, updatedUser, `User successfully promoted to ${updatedUser.role}`);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.errorCode || 'BAD_REQUEST', err.statusCode);
    }
    console.error('Error updating user role:', err);
    return errorResponse(res, 'Failed to update user role', 'INTERNAL_SERVER_ERROR', 500);
  }
};

/**
 * Controller to approve an alumni user account directly
 */
const approveUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id.trim())) {
      return errorResponse(res, 'Invalid user ID format. Must be a valid UUID.', 'INVALID_ID_FORMAT', 400);
    }

    const reviewerId = req.user.id;
    const adminVerificationService = require('../services/adminVerificationService');
    const result = await adminVerificationService.approveUserById(id.trim(), reviewerId);

    return successResponse(res, result, 'Alumni user account approved successfully');
  } catch (err) {
    console.error('Error approving user account:', err);
    return errorResponse(res, err.message || 'Failed to approve user account', err.errorCode || 'INTERNAL_SERVER_ERROR', err.statusCode || 500);
  }
};

/**
 * Controller to reject an alumni user account directly
 */
const rejectUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body || {};

    if (!id || !UUID_REGEX.test(id.trim())) {
      return errorResponse(res, 'Invalid user ID format. Must be a valid UUID.', 'INVALID_ID_FORMAT', 400);
    }

    const reviewerId = req.user.id;
    const adminVerificationService = require('../services/adminVerificationService');
    const result = await adminVerificationService.rejectUserById(id.trim(), {
      rejectionReason,
      reviewerId,
    });

    return successResponse(res, result, 'Alumni user account rejected successfully');
  } catch (err) {
    console.error('Error rejecting user account:', err);
    return errorResponse(res, err.message || 'Failed to reject user account', err.errorCode || 'INTERNAL_SERVER_ERROR', err.statusCode || 500);
  }
};

/**
 * Controller to get pending alumni applications
 */
const getPendingAlumni = async (req, res, next) => {
  try {
    const adminVerificationService = require('../services/adminVerificationService');
    const data = await adminVerificationService.getVerifications({
      status: 'PENDING',
      page: req.query.page,
      pageSize: req.query.pageSize || req.query.limit,
      q: req.query.q,
    });
    return successResponse(res, data, 'Pending alumni applications retrieved successfully');
  } catch (err) {
    console.error('Error fetching pending alumni list:', err);
    return errorResponse(res, 'Failed to fetch pending alumni list', 'INTERNAL_SERVER_ERROR', 500);
  }
};

/**
 * Controller to get user statistics summary
 */
const getUserStats = async (req, res, next) => {
  try {
    const stats = await adminUserService.getUserStats();
    return successResponse(res, stats, 'User statistics retrieved successfully');
  } catch (err) {
    console.error('Error fetching user stats:', err);
    return errorResponse(res, 'Failed to fetch user statistics', 'INTERNAL_SERVER_ERROR', 500);
  }
};

/**
 * Controller to permanently delete a user account
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id.trim())) {
      return errorResponse(res, 'Invalid user ID format. Must be a valid UUID.', 'INVALID_ID_FORMAT', 400);
    }

    const adminUserId = req.user.id;
    const result = await adminUserService.deleteUser(adminUserId, id.trim());
    return successResponse(res, result, result.message, 200);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.errorCode || 'BAD_REQUEST', err.statusCode);
    }
    console.error('Error deleting user:', err);
    return errorResponse(res, 'Failed to delete user account', 'INTERNAL_SERVER_ERROR', 500);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUserStatus,
  changeUserRole,
  approveUser,
  rejectUser,
  getPendingAlumni,
  getUserStats,
  deleteUser,
};
