import { apiClient } from './apiClient';

export const connectionService = {
  /**
   * Send connection request to target user
   * @param {string} targetUserId
   */
  sendRequest: async (targetUserId) => {
    return apiClient.post('/api/v1/connections/request', { targetUserId });
  },

  /**
   * Accept connection request by connection ID or target user ID
   * @param {string} connectionIdOrTargetId
   */
  acceptRequest: async (connectionIdOrTargetId) => {
    return apiClient.post(`/api/v1/connections/${connectionIdOrTargetId}/accept`);
  },

  /**
   * Decline connection request by connection ID or target user ID
   * @param {string} connectionIdOrTargetId
   */
  declineRequest: async (connectionIdOrTargetId) => {
    return apiClient.post(`/api/v1/connections/${connectionIdOrTargetId}/decline`);
  },

  /**
   * Cancel outgoing connection request by connection ID or target user ID
   * @param {string} connectionIdOrTargetId
   */
  cancelRequest: async (connectionIdOrTargetId) => {
    return apiClient.post(`/api/v1/connections/${connectionIdOrTargetId}/cancel`);
  },

  /**
   * Remove active connection by connection ID or target user ID
   * @param {string} connectionIdOrTargetId
   */
  removeConnection: async (connectionIdOrTargetId) => {
    return apiClient.delete(`/api/v1/connections/${connectionIdOrTargetId}`);
  },

  /**
   * Get relationship status for a specific user ID
   * @param {string} userId
   */
  getConnectionStatus: async (userId) => {
    return apiClient.get(`/api/v1/connections/status/${userId}`);
  },

  /**
   * Get list of incoming connection requests for authenticated user
   */
  getIncomingRequests: async () => {
    const data = await apiClient.get('/api/v1/connections/requests/incoming');
    return data ? (data.requests || []) : [];
  },

  /**
   * Get list of outgoing connection requests for authenticated user
   */
  getOutgoingRequests: async () => {
    const data = await apiClient.get('/api/v1/connections/requests/outgoing');
    return data ? (data.requests || []) : [];
  },

  /**
   * Get list of accepted connections for authenticated user
   */
  getMyConnections: async () => {
    const data = await apiClient.get('/api/v1/users/connections');
    return data ? (data.connections || []) : [];
  },
};
