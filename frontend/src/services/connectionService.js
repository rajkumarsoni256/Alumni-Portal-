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

  /**
   * Get paginated connections list for any specific user ID with server-side search
   * @param {string} userId
   * @param {Object} params { search, page, limit }
   */
  getUserConnections: async (userId, params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString();
    const url = `/api/v1/users/${userId}/connections${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(url);
  },

  /**
   * Get personalized connection suggestions for authenticated user
   * @param {Object} params { limit }
   */
  getSuggestions: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString();
    const data = await apiClient.get(`/api/v1/connections/suggestions${queryString ? `?${queryString}` : ''}`);
    return data ? (data.suggestions || []) : [];
  },
};
