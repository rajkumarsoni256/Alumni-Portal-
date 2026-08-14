/**
 * JECRC Community — Messaging & Private Chat Service Layer
 * 
 * Interfacing with backend REST API under /api/v1/conversations for
 * 1-to-1 private chat, real-time-ready messaging, unread counts, and read receipts.
 */

import { apiClient } from './apiClient';

export const messageService = {
  /**
   * Fetch all private conversations for authenticated user
   */
  getConversations: async () => {
    try {
      const data = await apiClient.get('/api/v1/conversations');
      if (!data) return [];
      return data.conversations || [];
    } catch (err) {
      console.warn('Failed to fetch conversations from backend:', err);
      return [];
    }
  },

  /**
   * Fetch details of a single conversation
   * @param {string} conversationId
   */
  getConversationById: async (conversationId) => {
    const data = await apiClient.get(`/api/v1/conversations/${conversationId}`);
    return data ? (data.conversation || data) : null;
  },

  /**
   * Create a new conversation or retrieve existing one with target user
   * @param {string} param1 - targetUserId or _currentUserId
   * @param {string} [param2] - targetUserId if param1 is _currentUserId
   */
  createOrGetConversation: async (param1, param2) => {
    const targetUserId = param2 || param1;
    if (!targetUserId) throw new Error('Target user ID is required to start a conversation');
    const data = await apiClient.post('/api/v1/conversations', { targetUserId });
    return data ? (data.conversation || data) : null;
  },

  /**
   * Fetch message history for a specific conversation
   * @param {string} conversationId
   * @param {Object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=50]
   */
  getMessages: async (conversationId, { page = 1, limit = 50 } = {}) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', page);
      queryParams.set('limit', limit);

      const data = await apiClient.get(`/api/v1/conversations/${conversationId}/messages?${queryParams.toString()}`);
      if (!data) return [];
      return data.messages || [];
    } catch (err) {
      console.warn(`Failed to fetch messages for conversation ${conversationId}:`, err);
      return [];
    }
  },

  /**
   * Send a text message in a conversation
   * @param {string} conversationId
   * @param {string} text
   */
  sendMessage: async (conversationId, text) => {
    const cleanText = (text || '').trim();
    if (!cleanText) throw new Error('Message text cannot be empty');

    const data = await apiClient.post(`/api/v1/conversations/${conversationId}/messages`, { text: cleanText });
    return data ? (data.message || data) : null;
  },

  /**
   * Mark a conversation as read by the authenticated user
   * @param {string} conversationId
   */
  markAsRead: async (conversationId) => {
    try {
      return await apiClient.patch(`/api/v1/conversations/${conversationId}/read`);
    } catch (err) {
      console.warn(`Failed to mark conversation ${conversationId} as read:`, err);
      return { success: false };
    }
  },

  /**
   * Fetch total unread message count across all conversations
   */
  getUnreadCount: async () => {
    if (!apiClient.getAuthToken()) {
      return 0;
    }
    try {
      const data = await apiClient.get('/api/v1/conversations/unread-count');
      return data ? (data.unreadCount || 0) : 0;
    } catch (err) {
      console.warn('Failed to fetch total unread count:', err);
      return 0;
    }
  },

  /**
   * Search loaded conversations by partner name, company, or headline
   * @param {string} query
   * @param {Array} conversations
   */
  searchConversations: (query, conversations = []) => {
    if (!query || !query.trim()) return conversations;
    const q = query.toLowerCase().trim();

    return conversations.filter((c) => {
      const name = c.partner?.name?.toLowerCase() || '';
      const headline = c.partner?.headline?.toLowerCase() || '';
      const company = c.partner?.company?.toLowerCase() || '';
      return name.includes(q) || headline.includes(q) || company.includes(q);
    });
  },
};
