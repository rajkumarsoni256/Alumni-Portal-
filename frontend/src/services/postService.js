/**
 * JECRC Community — Post & Feed Service Layer
 * 
 * Interfacing with backend REST API under /api/v1/posts for community feed,
 * post creation, likes, comments, edit, and deletion.
 */

import { apiClient } from './apiClient';

export const postService = {
  /**
   * Fetch paginated and filtered community posts from backend
   * @param {Object} params
   * @param {number} [params.page=1]
   * @param {number} [params.limit=10]
   * @param {string} [params.filter='all']
   * @param {string} [params.searchQuery='']
   */
  getPosts: async ({ page = 1, limit = 10, filter = 'all', searchQuery = '' } = {}) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', page);
      queryParams.set('limit', limit);
      if (filter && filter !== 'all') queryParams.set('category', filter);
      if (searchQuery && searchQuery.trim() !== '') queryParams.set('query', searchQuery.trim());

      const data = await apiClient.get(`/api/v1/posts?${queryParams.toString()}`);

      if (!data) {
        return { posts: [], totalCount: 0, page: 1, totalPages: 1, hasMore: false };
      }

      const rawPosts = data.posts || [];
      const total = data.total !== undefined ? data.total : (data.totalCount || rawPosts.length);
      const currentPage = data.page || page;
      const totalPages = data.pages || Math.ceil(total / limit) || 1;
      const hasMore = data.hasMore !== undefined ? data.hasMore : (currentPage < totalPages);

      return {
        posts: rawPosts,
        total,
        totalCount: total,
        page: currentPage,
        totalPages,
        hasMore,
      };
    } catch (err) {
      console.warn('Failed to fetch posts from backend:', err);
      return { posts: [], total: 0, totalCount: 0, page: 1, totalPages: 1, hasMore: false };
    }
  },

  /**
   * Create a new post in backend PostgreSQL
   * @param {Object} postData
   */
  createPost: async (postData) => {
    const data = await apiClient.post('/api/v1/posts', postData);
    return data ? (data.post || data) : null;
  },

  /**
   * Edit an existing post
   * @param {string} postId
   * @param {Object} updatedFields
   */
  editPost: async (postId, updatedFields) => {
    const data = await apiClient.put(`/api/v1/posts/${postId}`, updatedFields);
    return data ? (data.post || data) : null;
  },

  /**
   * Delete a post
   * @param {string} postId
   */
  deletePost: async (postId) => {
    return apiClient.delete(`/api/v1/posts/${postId}`);
  },

  /**
   * Toggle Like on a post in backend
   * @param {string} postId
   */
  toggleLike: async (postId) => {
    return apiClient.post(`/api/v1/posts/${postId}/like`);
  },

  /**
   * Add a comment to a post in backend
   * @param {string} postId
   * @param {Object} commentPayload
   */
  addComment: async (postId, commentPayload) => {
    const data = await apiClient.post(`/api/v1/posts/${postId}/comments`, commentPayload);
    return data;
  },

  /**
   * Fetch comments for a post from backend
   * @param {string} postId
   */
  getComments: async (postId) => {
    const data = await apiClient.get(`/api/v1/posts/${postId}/comments`);
    return data ? (data.comments || []) : [];
  },

  /**
   * Delete a comment from a post
   * @param {string} postId
   * @param {string} commentId
   */
  deleteComment: async (postId, commentId) => {
    return apiClient.delete(`/api/v1/posts/${postId}/comments/${commentId}`);
  },
};
