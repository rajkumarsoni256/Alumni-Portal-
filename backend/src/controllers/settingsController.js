const settingsService = require('../services/settingsService');
const { successResponse } = require('../utils/response');

const getSettings = async (req, res, next) => {
  try {
    const data = await settingsService.getSettings(req.user);
    return successResponse(res, data, 'User settings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const data = await settingsService.updateSettings(req.user, req.body);
    return successResponse(res, data, 'User settings updated successfully');
  } catch (err) {
    next(err);
  }
};

const changeEmail = async (req, res, next) => {
  try {
    const { newEmail, currentPassword } = req.body;
    const data = await settingsService.changeEmail(req.user, newEmail, currentPassword);
    return successResponse(res, data, 'Email address updated successfully');
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const data = await settingsService.changePassword(req.user, currentPassword, newPassword);
    return successResponse(res, data, 'Password updated successfully');
  } catch (err) {
    next(err);
  }
};

const deactivateAccount = async (req, res, next) => {
  try {
    const data = await settingsService.deactivateAccount(req.user);
    return successResponse(res, data, 'Account deactivated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const data = await settingsService.deleteAccount(req.user, password);
    return successResponse(res, data, 'Account deleted successfully');
  } catch (err) {
    next(err);
  }
};

const exportUserData = async (req, res, next) => {
  try {
    const data = await settingsService.exportUserData(req.user);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=ju_connect_data_${req.user.id}.json`);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

const getBlockedUsers = async (req, res, next) => {
  try {
    const data = await settingsService.getBlockedUsers(req.user);
    return successResponse(res, data, 'Blocked users fetched successfully');
  } catch (err) {
    next(err);
  }
};

const blockUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.body.targetUserId;
    const data = await settingsService.blockUser(req.user, targetUserId);
    return successResponse(res, data, 'User blocked successfully');
  } catch (err) {
    next(err);
  }
};

const unblockUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.body.targetUserId;
    const data = await settingsService.unblockUser(req.user, targetUserId);
    return successResponse(res, data, 'User unblocked successfully');
  } catch (err) {
    next(err);
  }
};

const getActiveSessions = async (req, res, next) => {
  try {
    const data = await settingsService.getActiveSessions(req.user);
    return successResponse(res, data, 'Active sessions fetched successfully');
  } catch (err) {
    next(err);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const data = await settingsService.revokeSession(req.user, sessionId);
    return successResponse(res, data, 'Session revoked successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  changeEmail,
  changePassword,
  deactivateAccount,
  deleteAccount,
  exportUserData,
  getBlockedUsers,
  blockUser,
  unblockUser,
  getActiveSessions,
  revokeSession,
};
