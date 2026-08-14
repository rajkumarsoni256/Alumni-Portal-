const postService = require('../services/postService');
const jobService = require('../services/jobService');
const adminAuditService = require('../services/adminAuditService');
const { successResponse, errorResponse } = require('../utils/response');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Admin Moderation: Delete Post
 */
const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id.trim())) {
      return errorResponse(res, 'Invalid post ID format', 'INVALID_ID_FORMAT', 400);
    }

    const result = await postService.deletePost(req.user, id.trim());

    // Transactional / observational audit log
    adminAuditService.logAdminAction({
      adminUserId: req.user?.id,
      action: 'POST_MODERATED',
      targetEntity: 'POST',
      targetId: id.trim(),
      details: { postId: id.trim(), actionType: 'DELETED' },
    }).catch((err) => console.error('Failed to log POST_MODERATED audit:', err));

    return successResponse(res, result, 'Post moderated and deleted successfully');
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.errorCode || 'BAD_REQUEST', err.statusCode);
    }
    console.error('Error in admin post moderation:', err);
    return errorResponse(res, 'Failed to moderate post', 'INTERNAL_SERVER_ERROR', 500);
  }
};

/**
 * Admin Moderation: Delete Comment
 */
const deleteComment = async (req, res, next) => {
  try {
    const { postId, commentId, id } = req.params;
    const targetCommentId = commentId || id || postId;

    if (!targetCommentId || !UUID_REGEX.test(targetCommentId.trim())) {
      return errorResponse(res, 'Invalid comment ID format', 'INVALID_ID_FORMAT', 400);
    }

    const result = await postService.deleteComment(req.user, postId, targetCommentId.trim());

    adminAuditService.logAdminAction({
      adminUserId: req.user?.id,
      action: 'COMMENT_MODERATED',
      targetEntity: 'COMMENT',
      targetId: targetCommentId.trim(),
      details: { commentId: targetCommentId.trim(), actionType: 'DELETED' },
    }).catch((err) => console.error('Failed to log COMMENT_MODERATED audit:', err));

    return successResponse(res, result, 'Comment moderated and deleted successfully');
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.errorCode || 'BAD_REQUEST', err.statusCode);
    }
    console.error('Error in admin comment moderation:', err);
    return errorResponse(res, 'Failed to moderate comment', 'INTERNAL_SERVER_ERROR', 500);
  }
};

/**
 * Admin Moderation: Delete Job
 */
const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id.trim())) {
      return errorResponse(res, 'Invalid job ID format', 'INVALID_ID_FORMAT', 400);
    }

    const result = await jobService.deleteJob(req.user, id.trim());

    adminAuditService.logAdminAction({
      adminUserId: req.user?.id,
      action: 'JOB_MODERATED',
      targetEntity: 'JOB',
      targetId: id.trim(),
      details: { jobId: id.trim(), actionType: 'DELETED' },
    }).catch((err) => console.error('Failed to log JOB_MODERATED audit:', err));

    return successResponse(res, result, 'Job posting moderated and deleted successfully');
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.errorCode || 'BAD_REQUEST', err.statusCode);
    }
    console.error('Error in admin job moderation:', err);
    return errorResponse(res, 'Failed to moderate job', 'INTERNAL_SERVER_ERROR', 500);
  }
};

module.exports = {
  deletePost,
  deleteComment,
  deleteJob,
};
