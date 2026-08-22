import { apiClient } from './apiClient';

export const mentorshipService = {
  getMentorshipRequests: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.set('status', params.status);
    if (params.studentId) queryParams.set('studentId', params.studentId);
    if (params.mentorId) queryParams.set('mentorId', params.mentorId);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/mentorship/requests${queryString ? `?${queryString}` : ''}`;
    const data = await apiClient.get(endpoint);
    return data;
  },

  getMyRequests: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.set('status', params.status);
    if (params.studentId) queryParams.set('studentId', params.studentId);
    if (params.mentorId) queryParams.set('mentorId', params.mentorId);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/mentorship/requests${queryString ? `?${queryString}` : ''}`;
    const res = await apiClient.get(endpoint);
    return Array.isArray(res) ? res : (res?.requests || res?.data || []);
  },

  getMentorshipRequestById: async (id) => {
    const data = await apiClient.get(`/api/v1/mentorship/requests/${id}`);
    return data;
  },

  createMentorshipRequest: async (data) => {
    const resData = await apiClient.post('/api/v1/mentorship/requests', data);
    return resData;
  },

  updateMentorshipRequestStatus: async (id, status) => {
    const resData = await apiClient.patch(`/api/v1/mentorship/requests/${id}`, { status });
    return resData;
  },
};
