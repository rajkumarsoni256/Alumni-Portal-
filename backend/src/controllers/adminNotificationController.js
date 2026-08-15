const adminNotificationService = require('../services/adminNotificationService');

/**
 * Controller to list announcements with search, pagination, and status filters
 */
const getNotifications = async (req, res, next) => {
  try {
    const result = await adminNotificationService.getNotifications(req.query);

    return res.status(200).json({
      success: true,
      message: 'Announcements retrieved successfully',
      data: result.notifications,
      summary: result.summary,
      pagination: {
        totalCount: result.totalCount,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev,
      },
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    next(error);
  }
};

/**
 * Controller to get single announcement details by ID
 */
const getNotificationById = async (req, res, next) => {
  try {
    const notification = await adminNotificationService.getNotificationById(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Announcement details retrieved successfully',
      data: notification,
    });
  } catch (error) {
    console.error('Error fetching announcement details:', error);
    next(error);
  }
};

/**
 * Controller to create a new announcement draft
 */
const createNotification = async (req, res, next) => {
  try {
    const adminUserId = req.user?.id || req.user?.sub;
    const notification = await adminNotificationService.createNotification(adminUserId, req.body);

    return res.status(201).json({
      success: true,
      message: 'Announcement draft created successfully',
      data: notification,
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    next(error);
  }
};

/**
 * Controller to update an existing draft announcement
 */
const updateNotification = async (req, res, next) => {
  try {
    const adminUserId = req.user?.id || req.user?.sub;
    const updated = await adminNotificationService.updateNotification(adminUserId, req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Announcement draft updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    next(error);
  }
};

/**
 * Controller to publish an announcement and generate delivery records
 */
const publishNotification = async (req, res, next) => {
  try {
    const adminUserId = req.user?.id || req.user?.sub;
    const published = await adminNotificationService.publishNotification(adminUserId, req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Announcement published successfully',
      data: published,
    });
  } catch (error) {
    console.error('Error publishing announcement:', error);
    next(error);
  }
};

/**
 * Controller to cancel a draft announcement
 */
const cancelNotification = async (req, res, next) => {
  try {
    const adminUserId = req.user?.id || req.user?.sub;
    const cancelled = await adminNotificationService.cancelNotification(adminUserId, req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Announcement cancelled successfully',
      data: cancelled,
    });
  } catch (error) {
    console.error('Error cancelling announcement:', error);
    next(error);
  }
};

/**
 * Controller to delete a draft or cancelled announcement
 */
const deleteNotification = async (req, res, next) => {
  try {
    const adminUserId = req.user?.id || req.user?.sub;
    const result = await adminNotificationService.deleteNotification(adminUserId, req.params.id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    next(error);
  }
};

/**
 * Controller to preview audience recipient count before publishing
 */
const previewAudience = async (req, res, next) => {
  try {
    const { audienceType, targetFilters } = req.body || {};
    const count = await adminNotificationService.getAudienceCount(audienceType || 'ALL', targetFilters || {});

    return res.status(200).json({
      success: true,
      message: 'Audience preview calculated successfully',
      data: { count },
    });
  } catch (error) {
    console.error('Error previewing audience count:', error);
    next(error);
  }
};

/**
 * Controller to fetch Admin Notification Inbox records
 */
const getNotificationInbox = async (req, res, next) => {
  try {
    const notificationService = require('../services/notificationService');
    const adminUserId = req.user?.id;
    const result = await notificationService.getNotifications(adminUserId, req.query);

    return res.status(200).json({
      success: true,
      message: 'Admin notification inbox retrieved successfully',
      data: result.notifications,
      unreadCount: result.unreadCount,
      pagination: {
        totalCount: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.pages,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error('Error fetching admin notification inbox:', error);
    next(error);
  }
};

/**
 * Controller to mark single notification as read
 */
const markNotificationRead = async (req, res, next) => {
  try {
    const notificationService = require('../services/notificationService');
    const { logAdminAction, AUDIT_ACTIONS } = require('../services/adminAuditService');
    const adminUserId = req.user?.id;
    const { id } = req.params;

    const result = await notificationService.markAsRead(adminUserId, id);

    logAdminAction({
      adminUserId,
      action: AUDIT_ACTIONS.NOTIFICATION_READ,
      targetEntity: 'NOTIFICATION',
      targetId: id,
      details: { notificationId: id },
    }).catch((err) => console.error('Failed to log NOTIFICATION_READ audit:', err));

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    next(error);
  }
};

/**
 * Controller to mark all admin notifications as read
 */
const markAllNotificationsRead = async (req, res, next) => {
  try {
    const notificationService = require('../services/notificationService');
    const adminUserId = req.user?.id;

    const result = await notificationService.markAllAsRead(adminUserId);

    return res.status(200).json({
      success: true,
      message: result.message,
      updatedCount: result.updatedCount,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    next(error);
  }
};

module.exports = {
  getNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  publishNotification,
  cancelNotification,
  deleteNotification,
  previewAudience,
  getNotificationInbox,
  markNotificationRead,
  markAllNotificationsRead,
};
