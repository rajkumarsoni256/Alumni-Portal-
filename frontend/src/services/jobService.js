/**
 * JECRC Community — Job & Placement Service Layer
 * 
 * Interfacing with backend REST API under /api/v1/jobs for job listings,
 * alumni job postings, applications, bookmarks, search, and filtering.
 */

import { apiClient } from './apiClient';

export const jobService = {
  /**
   * Fetch paginated and filtered jobs from backend
   * @param {Object} params
   * @param {number} [params.page=1]
   * @param {number} [params.limit=10]
   * @param {string} [params.search='']
   * @param {string} [params.type='All']
   * @param {string} [params.location='All']
   * @param {boolean|string} [params.myPosts=false]
   */
  getJobs: async ({ page = 1, limit = 10, search = '', type = 'All', location = 'All', myPosts = false } = {}) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', page);
      queryParams.set('limit', limit);
      if (search && search.trim() !== '') queryParams.set('search', search.trim());
      if (type && type !== 'All') queryParams.set('type', type);
      if (location && location !== 'All') queryParams.set('location', location);
      if (myPosts) queryParams.set('myPosts', 'true');

      const data = await apiClient.get(`/api/v1/jobs?${queryParams.toString()}`);

      if (!data) {
        return { jobs: [], total: 0, page: 1, totalPages: 1, hasMore: false };
      }

      const rawJobs = data.jobs || [];
      const total = data.total !== undefined ? data.total : (data.totalCount || rawJobs.length);
      const currentPage = data.page || page;
      const totalPages = data.pages || Math.ceil(total / limit) || 1;
      const hasMore = data.hasMore !== undefined ? data.hasMore : (currentPage < totalPages);

      return {
        jobs: rawJobs,
        total,
        totalCount: total,
        page: currentPage,
        totalPages,
        hasMore,
      };
    } catch (err) {
      console.warn('Failed to fetch jobs from backend:', err);
      return { jobs: [], total: 0, totalCount: 0, page: 1, totalPages: 1, hasMore: false };
    }
  },

  /**
   * Fetch specific job details from backend
   * @param {string} jobId
   */
  getJobById: async (jobId) => {
    const data = await apiClient.get(`/api/v1/jobs/${jobId}`);
    return data ? (data.job || data) : null;
  },

  /**
   * Post a new job opportunity (Alumni only)
   * @param {Object} jobData
   */
  createJob: async (jobData) => {
    const data = await apiClient.post('/api/v1/jobs', jobData);
    return data ? (data.job || data) : null;
  },

  /**
   * Update an existing job posting (Owner only)
   * @param {string} jobId
   * @param {Object} updatedFields
   */
  updateJob: async (jobId, updatedFields) => {
    const data = await apiClient.put(`/api/v1/jobs/${jobId}`, updatedFields);
    return data ? (data.job || data) : null;
  },

  /**
   * Delete a job posting (Owner only)
   * @param {string} jobId
   */
  deleteJob: async (jobId) => {
    return apiClient.delete(`/api/v1/jobs/${jobId}`);
  },

  /**
   * Toggle bookmark on a job
   * @param {string} jobId
   */
  toggleBookmark: async (jobId) => {
    return apiClient.post(`/api/v1/jobs/${jobId}/bookmark`);
  },

  /**
   * Submit job application / referral request
   * @param {string} jobId
   * @param {Object} payload
   */
  applyForJob: async (jobId, payload = {}) => {
    return apiClient.post(`/api/v1/jobs/${jobId}/apply`, payload);
  },

  /**
   * Fetch applications submitted by current user
   */
  getMyApplications: async () => {
    const data = await apiClient.get('/api/v1/jobs/applications/me');
    return data ? (data.applications || []) : [];
  },

  /**
   * Fetch jobs bookmarked by current user
   */
  getMyBookmarks: async () => {
    const data = await apiClient.get('/api/v1/jobs/bookmarks/me');
    return data ? (data.jobs || []) : [];
  },
};
