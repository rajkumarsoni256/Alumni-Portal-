const adminVerificationService = require('../services/adminVerificationService');
const { successResponse, errorResponse } = require('../utils/response');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_STATUSES = ['pending', 'approved', 'rejected', 'all'];

/**
 * Controller to fetch alumni verification requests
 */
const getVerifications = async (req, res, next) => {
  try {
    const { status, q, page, pageSize, limit } = req.query;

    if (status && !ALLOWED_STATUSES.includes(String(status).toLowerCase())) {
      return errorResponse(
        res,
        'Invalid status parameter. Allowed values: PENDING, APPROVED, REJECTED, ALL',
        'INVALID_STATUS',
        400
      );
    }

    const data = await adminVerificationService.getVerifications({
      status,
      q,
      page,
      pageSize,
      limit,
    });

    return successResponse(res, data, 'Verification requests retrieved successfully');
  } catch (err) {
    console.error('Error fetching verification queue:', err);
    return errorResponse(res, 'Failed to fetch verification requests', 'INTERNAL_SERVER_ERROR', 500);
  }
};

/**
 * Controller to moderate (Approve / Reject) an alumni verification request
 */
const updateVerificationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body || {};

    if (!id || !UUID_REGEX.test(id.trim())) {
      return errorResponse(res, 'Invalid verification ID format. Must be a valid UUID.', 'INVALID_ID_FORMAT', 400);
    }

    if (!status || !['APPROVED', 'REJECTED'].includes(String(status).trim().toUpperCase())) {
      return errorResponse(res, 'status is required and must be either APPROVED or REJECTED.', 'INVALID_STATUS', 400);
    }

    const reviewerId = req.user.id;
    const updatedRecord = await adminVerificationService.updateVerificationStatus(id.trim(), {
      status: String(status).trim().toUpperCase(),
      rejectionReason,
      reviewerId,
    });

    const actionText = updatedRecord.status === 'APPROVED' ? 'approved' : 'rejected';
    return successResponse(res, updatedRecord, `Alumni verification request ${actionText} successfully`);
  } catch (err) {
    console.error('Error updating verification status:', err);
    return errorResponse(
      res,
      err.message || 'Failed to update verification request',
      err.errorCode || 'INTERNAL_SERVER_ERROR',
      err.statusCode || 500
    );
  }
};

module.exports = {
  getVerifications,
  updateVerificationStatus,
};
