/**
 * User and Network Service Layer
 * 
 * Provides abstraction for discovering JECRC students and alumni,
 * filtering/searching directories, managing connections, and retrieving public profiles.
 * Communicates with backend REST API under /api/v1/users and /api/v1/connections.
 */

import { apiClient } from './apiClient';
import { connectionService } from './connectionService';

export const userService = {
  /**
   * Fetch paginated and filtered users from backend REST API
   * @param {Object} params
   */
  getUsers: async ({
    page = 1,
    limit = 18,
    type = 'all',
    branch = 'all',
    batch = 'all',
    location = 'all',
    query = '',
  } = {}) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', page);
      queryParams.set('limit', limit);

      if (type && type !== 'all') queryParams.set('role', type);
      if (branch && branch !== 'all') queryParams.set('branch', branch);
      if (batch && batch !== 'all') queryParams.set('graduationYear', batch);
      if (query && query.trim() !== '') queryParams.set('query', query.trim());

      const data = await apiClient.get(`/api/v1/users?${queryParams.toString()}`);

      if (!data) {
        return { users: [], totalCount: 0, page: 1, totalPages: 1, hasMore: false };
      }

      const rawUsers = data.users || [];
      const total = data.total !== undefined ? data.total : (data.totalCount || rawUsers.length);
      const currentPage = data.page || page;
      const totalPages = data.pages || Math.ceil(total / limit) || 1;
      const hasMore = data.hasMore !== undefined ? data.hasMore : (currentPage < totalPages);

      return {
        users: rawUsers,
        totalCount: total,
        page: currentPage,
        totalPages,
        hasMore,
      };
    } catch (err) {
      console.warn('Failed to fetch users from backend:', err);
      return { users: [], totalCount: 0, page: 1, totalPages: 1, hasMore: false };
    }
  },

  /**
   * Get single public user by ID from backend REST API
   * @param {string} userId
   */
  getUserById: async (userId) => {
    try {
      const response = await apiClient.get(`/api/v1/users/${userId}`);
      if (!response) return null;
      return response.user || response;
    } catch (err) {
      console.warn(`Failed to fetch public profile for user ${userId}:`, err);
      return null;
    }
  },

  /**
   * Fetch incoming connection requests from real backend
   */
  getConnectionRequests: async () => {
    return connectionService.getIncomingRequests();
  },

  /**
   * Accept incoming connection request
   */
  acceptConnectionRequest: async (requestId) => {
    await connectionService.acceptRequest(requestId);
    return true;
  },

  /**
   * Ignore / Decline incoming connection request
   */
  ignoreConnectionRequest: async (requestId) => {
    await connectionService.declineRequest(requestId);
    return true;
  },

  /**
   * Toggle connection request state based on current status
   */
  toggleConnect: async (targetUserId, currentStatus) => {
    if (currentStatus === 'connected') {
      await connectionService.removeConnection(targetUserId);
      return 'none';
    } else if (currentStatus === 'pending' || currentStatus === 'pending_outgoing') {
      await connectionService.cancelRequest(targetUserId);
      return 'none';
    } else {
      await connectionService.sendRequest(targetUserId);
      return 'pending';
    }
  },
};
