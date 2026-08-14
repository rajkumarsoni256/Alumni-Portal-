import { apiClient } from './apiClient';

export const notificationService = {
  getNotifications: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page);
    if (params.limit) queryParams.set('limit', params.limit);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/notifications${queryString ? `?${queryString}` : ''}`;
    const data = await apiClient.get(endpoint);
    return data;
  },

  getUnreadCount: async () => {
    if (!apiClient.getAuthToken()) {
      return { unreadCount: 0 };
    }
    const data = await apiClient.get('/api/v1/notifications/unread-count');
    return data || { unreadCount: 0 };
  },

  markAsRead: async (id) => {
    const data = await apiClient.patch(`/api/v1/notifications/${id}/read`);
    return data;
  },

  markAllAsRead: async () => {
    const data = await apiClient.patch('/api/v1/notifications/read-all');
    return data;
  },
};
