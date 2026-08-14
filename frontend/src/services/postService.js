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
    let body = postData;
    if (postData.mediaFile || postData.file || (postData.mediaFiles && postData.mediaFiles.length > 0)) {
      const formData = new FormData();
      Object.keys(postData).forEach(key => {
        if (key === 'mediaFile' || key === 'file') {
          if (postData[key]) formData.append('media', postData[key]);
        } else if (key === 'mediaFiles' && Array.isArray(postData[key])) {
          postData[key].forEach(f => formData.append('media', f));
        } else if (Array.isArray(postData[key])) {
          formData.append(key, postData[key].join(','));
        } else if (postData[key] !== null && postData[key] !== undefined) {
          formData.append(key, postData[key]);
        }
      });
      body = formData;
    }

    const data = await apiClient.post('/api/v1/posts', body);
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
   * Add a comment or reply to a post in backend
   * @param {string} postId
   * @param {Object|string} commentPayload
   */
  addComment: async (postId, commentPayload) => {
    const payload = typeof commentPayload === 'string' ? { content: commentPayload } : commentPayload;
    const data = await apiClient.post(`/api/v1/posts/${postId}/comments`, payload);
    return data;
  },

  /**
   * Fetch comments for a post from backend with sorting and pagination
   * @param {string} postId
   * @param {Object} [params] { page, limit, sort }
   */
  getComments: async (postId, params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sort) query.append('sort', params.sort);

    const queryString = query.toString();
    const data = await apiClient.get(`/api/v1/posts/${postId}/comments${queryString ? `?${queryString}` : ''}`);

    if (Array.isArray(data)) {
      return { comments: data, total: data.length, totalCount: data.length, hasMore: false };
    }
    return {
      comments: data?.comments || [],
      total: data?.total !== undefined ? data.total : (data?.totalCount || 0),
      totalCount: data?.total !== undefined ? data.total : (data?.totalCount || 0),
      hasMore: Boolean(data?.hasMore),
      page: data?.page || 1,
    };
  },

  /**
   * Edit a comment
   * @param {string} commentId
   * @param {Object} payload { content }
   */
  editComment: async (commentId, payload) => {
    return apiClient.patch(`/api/v1/comments/${commentId}`, payload);
  },

  /**
   * Delete a comment from a post
   * @param {string} postId
   * @param {string} commentId
   */
  deleteComment: async (postId, commentId) => {
    const targetId = commentId || postId;
    return apiClient.delete(`/api/v1/comments/${targetId}`);
  },

  /**
   * Toggle Like on a comment in backend
   * @param {string} commentId
   */
  toggleLikeComment: async (commentId) => {
    return apiClient.post(`/api/v1/comments/${commentId}/like`);
  },

  /**
   * Toggle Pin status on a comment in backend
   * @param {string} commentId
   */
  togglePinComment: async (commentId) => {
    return apiClient.patch(`/api/v1/comments/${commentId}/pin`);
  },
};
