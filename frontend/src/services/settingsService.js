import { apiClient } from './apiClient';

export const settingsService = {
  /**
   * Fetch all user settings from backend
   */
  getSettings: async () => {
    return apiClient.get('/api/v1/settings');
  },

  /**
   * Update general user settings (privacy, notifications, messaging, career, appearance, etc.)
   * @param {Object} payload
   */
  updateSettings: async (payload) => {
    return apiClient.patch('/api/v1/settings', payload);
  },

  /**
   * Change account email address
   * @param {Object} payload { newEmail, currentPassword }
   */
  changeEmail: async (payload) => {
    return apiClient.post('/api/v1/settings/account/email', payload);
  },

  /**
   * Change account password
   * @param {Object} payload { currentPassword, newPassword }
   */
  changePassword: async (payload) => {
    return apiClient.post('/api/v1/settings/account/password', payload);
  },

  /**
   * Deactivate account
   */
  deactivateAccount: async () => {
    return apiClient.post('/api/v1/settings/account/deactivate');
  },

  /**
   * Request account deletion
   * @param {Object} payload { password }
   */
  deleteAccount: async (payload = {}) => {
    return apiClient.post('/api/v1/settings/account/delete', payload);
  },

  /**
   * Get list of blocked users
   */
  getBlockedUsers: async () => {
    const res = await apiClient.get('/api/v1/settings/blocks');
    return res?.blockedUsers || [];
  },

  /**
   * Block a user
   * @param {string} userId
   */
  blockUser: async (userId) => {
    return apiClient.post(`/api/v1/settings/blocks/${userId}`);
  },

  /**
   * Unblock a user
   * @param {string} userId
   */
  unblockUser: async (userId) => {
    return apiClient.delete(`/api/v1/settings/blocks/${userId}`);
  },

  /**
   * Get active login sessions
   */
  getActiveSessions: async () => {
    const res = await apiClient.get('/api/v1/settings/sessions');
    return res?.sessions || [];
  },

  /**
   * Revoke an active session
   * @param {string} sessionId
   */
  revokeSession: async (sessionId) => {
    return apiClient.delete(`/api/v1/settings/sessions/${sessionId}`);
  },

  /**
   * Download user data archive URL / Blob trigger
   */
  getExportDataUrl: () => '/api/v1/settings/data/export',
};
