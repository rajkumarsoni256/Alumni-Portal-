import { apiClient } from './apiClient';

export const eventService = {
  getEvents: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page);
    if (params.limit) queryParams.set('limit', params.limit);
    if (params.category && params.category !== 'All') queryParams.set('category', params.category);
    if (params.eventType && params.eventType !== 'All') queryParams.set('eventType', params.eventType);
    if (params.search && params.search.trim() !== '') queryParams.set('search', params.search.trim());
    if (params.upcoming) queryParams.set('upcoming', params.upcoming);
    if (params.past) queryParams.set('past', params.past);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/events${queryString ? `?${queryString}` : ''}`;
    const data = await apiClient.get(endpoint);
    return data;
  },

  getEventById: async (id) => {
    const data = await apiClient.get(`/api/v1/events/${id}`);
    return data;
  },

  registerForEvent: async (id) => {
    const data = await apiClient.post(`/api/v1/events/${id}/register`);
    return data;
  },

  cancelRegistration: async (id) => {
    const data = await apiClient.delete(`/api/v1/events/${id}/register`);
    return data;
  },

  getMyRegistrations: async () => {
    const data = await apiClient.get('/api/v1/events/registrations/me');
    return data;
  },

  createEvent: async (eventData) => {
    const data = await apiClient.post('/api/v1/events', eventData);
    return data;
  },

  updateEvent: async (id, eventData) => {
    const data = await apiClient.put(`/api/v1/events/${id}`, eventData);
    return data;
  },

  getUpcomingEvents: async (limit = 5) => {
    const data = await apiClient.get(`/api/v1/events/upcoming?limit=${limit}`);
    if (Array.isArray(data)) return data;
    return data?.events || [];
  },

  deleteEvent: async (id) => {
    const data = await apiClient.delete(`/api/v1/events/${id}`);
    return data;
  },
};
