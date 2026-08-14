const notificationService = require('../services/notificationService');
const { successResponse } = require('../utils/response');

const getNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getNotifications(req.user.id, req.query);
    return successResponse(res, data, 'Notifications fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const data = await notificationService.getUnreadCount(req.user.id);
    return successResponse(res, data, 'Unread count fetched successfully');
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await notificationService.markAsRead(req.user.id, id);
    return successResponse(res, data, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const data = await notificationService.markAllAsRead(req.user.id);
    return successResponse(res, data, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
