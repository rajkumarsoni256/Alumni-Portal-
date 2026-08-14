import { apiClient } from './apiClient';

export const hashtagService = {
  /**
   * Fetch trending hashtags from backend
   * @param {number} [limit=10]
   */
  getTrendingHashtags: async (limit = 10) => {
    const data = await apiClient.get(`/api/v1/hashtags/trending?limit=${limit}`);
    if (Array.isArray(data)) return data;
    return data?.hashtags || [];
  },

  /**
   * Fetch posts matching a hashtag
   * @param {string} hashtag
   * @param {Object} [params]
   */
  getPostsByHashtag: async (hashtag, params = {}) => {
    const clean = hashtag.replace(/^#/, '').trim();
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString();
    return apiClient.get(`/api/v1/hashtags/${encodeURIComponent(clean)}/posts${queryString ? `?${queryString}` : ''}`);
  },
};
