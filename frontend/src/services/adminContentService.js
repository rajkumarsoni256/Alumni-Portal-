import { apiClient } from './apiClient';

export const adminContentService = {
  // 1. Admin Jobs
  getAdminJobs: async (params = {}) => {
    return await apiClient.get('/api/v1/admin/jobs', { params });
  },

  createAdminJob: async (jobData) => {
    return await apiClient.post('/api/v1/admin/jobs', jobData);
  },

  getAdminJobById: async (id) => {
    return await apiClient.get(`/api/v1/admin/jobs/${id}`);
  },

  updateAdminJob: async (id, jobData) => {
    return await apiClient.put(`/api/v1/admin/jobs/${id}`, jobData);
  },

  updateAdminJobStatus: async (id, status) => {
    return await apiClient.patch(`/api/v1/admin/jobs/${id}/status`, { status });
  },

  deleteAdminJob: async (id) => {
    return await apiClient.delete(`/api/v1/admin/jobs/${id}`);
  },

  exportJobApplicantsCSV: async (jobId) => {
    const token = localStorage.getItem('jecrc_community_jwt');
    const baseUrl = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080';

    const response = await fetch(`${baseUrl}/api/v1/admin/jobs/${jobId}/applications/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export job applicants CSV');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `job_applicants_${jobId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  // 2. Admin Events
  getAdminEvents: async (params = {}) => {
    return await apiClient.get('/api/v1/admin/events', { params });
  },

  createAdminEvent: async (eventData) => {
    return await apiClient.post('/api/v1/admin/events', eventData);
  },

  getAdminEventById: async (id) => {
    return await apiClient.get(`/api/v1/admin/events/${id}`);
  },

  updateAdminEventStatus: async (id, status) => {
    return await apiClient.patch(`/api/v1/admin/events/${id}/status`, { status });
  },

  exportEventAttendeesCSV: async (eventId) => {
    const token = localStorage.getItem('jecrc_community_jwt');
    const baseUrl = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080';

    const response = await fetch(`${baseUrl}/api/v1/admin/events/${eventId}/registrations/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export event attendees CSV');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `event_attendees_${eventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  // 3. Feed Moderation
  getAdminPosts: async (params = {}) => {
    return await apiClient.get('/api/v1/admin/posts', { params });
  },

  deleteAdminPost: async (id) => {
    return await apiClient.delete(`/api/v1/admin/posts/${id}`);
  },

  deleteAdminComment: async (commentId) => {
    return await apiClient.delete(`/api/v1/admin/comments/${commentId}`);
  },

  // 4. Connections & Mentorship Oversight
  getAdminConnections: async (params = {}) => {
    return await apiClient.get('/api/v1/admin/connections', { params });
  },

  getAdminMentorship: async (params = {}) => {
    return await apiClient.get('/api/v1/admin/mentorship', { params });
  },
};
