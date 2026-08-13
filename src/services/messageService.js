import { INITIAL_CONVERSATIONS, INITIAL_MESSAGES } from '../data/mockMessages';

const STORAGE_KEY_CONVS = 'jecrc_conversations_v1';
const STORAGE_KEY_MSGS = 'jecrc_messages_v1';

// In-memory state with localStorage caching
let conversationsState = null;
let messagesState = null;

const initStorage = () => {
  if (conversationsState && messagesState) return;

  try {
    const storedConvs = localStorage.getItem(STORAGE_KEY_CONVS);
    const storedMsgs = localStorage.getItem(STORAGE_KEY_MSGS);

    conversationsState = storedConvs ? JSON.parse(storedConvs) : [...INITIAL_CONVERSATIONS];
    messagesState = storedMsgs ? JSON.parse(storedMsgs) : [...INITIAL_MESSAGES];
  } catch (e) {
    conversationsState = [...INITIAL_CONVERSATIONS];
    messagesState = [...INITIAL_MESSAGES];
  }
};

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY_CONVS, JSON.stringify(conversationsState));
    localStorage.setItem(STORAGE_KEY_MSGS, JSON.stringify(messagesState));
  } catch (e) {
    // LocalStorage quota or access issue fallback
  }
};

/**
 * Message Service Layer
 * API-ready service handling conversations, messages, and state.
 */
export const messageService = {
  /**
   * Fetch all conversations for current user with resolved participant profile
   */
  getConversations: async (currentUserId = 'st_101', usersMap = {}) => {
    initStorage();
    // Simulate brief network tick
    await new Promise((res) => setTimeout(res, 80));

    const userConvs = conversationsState.filter((conv) =>
      conv.participantIds.includes(currentUserId)
    );

    // Attach partner profile details
    const populated = userConvs.map((conv) => {
      const partnerId = conv.participantIds.find((id) => id !== currentUserId) || conv.participantIds[0];
      const partner = usersMap[partnerId] || {
        id: partnerId,
        name: 'JECRC Member',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300',
        headline: 'JECRC Community Member',
        company: 'JECRC University',
        role: 'Alumni',
        isAlumni: true,
        batchDisplay: 'JECRC Member',
      };

      return {
        ...conv,
        partnerId,
        partner,
      };
    });

    // Sort by most recent activity
    populated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return populated;
  },

  /**
   * Fetch messages for a specific conversation
   */
  getMessages: async (conversationId) => {
    initStorage();
    await new Promise((res) => setTimeout(res, 60));

    const msgs = messagesState.filter((m) => m.conversationId === conversationId);
    msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return msgs;
  },

  /**
   * Send a text message in a conversation
   */
  sendMessage: async (conversationId, text, senderId = 'st_101') => {
    initStorage();
    const cleanText = text.trim();
    if (!cleanText) throw new Error('Message cannot be empty');

    const now = new Date().toISOString();
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      conversationId,
      senderId,
      text: cleanText,
      createdAt: now,
    };

    messagesState.push(newMessage);

    // Update conversation metadata
    const convIndex = conversationsState.findIndex((c) => c.id === conversationId);
    if (convIndex !== -1) {
      conversationsState[convIndex] = {
        ...conversationsState[convIndex],
        lastMessageText: cleanText,
        lastMessageAt: now,
        updatedAt: now,
      };
    }

    persist();
    return newMessage;
  },

  /**
   * Create a new conversation or return existing one with a partner user
   */
  createOrGetConversation: async (currentUserId = 'st_101', targetUserId, usersMap = {}) => {
    initStorage();
    if (!targetUserId) throw new Error('Target user ID is required');

    // Check if conversation already exists
    let existing = conversationsState.find(
      (c) =>
        c.participantIds.includes(currentUserId) &&
        c.participantIds.includes(targetUserId)
    );

    if (existing) {
      return existing;
    }

    // Create a new conversation
    const now = new Date().toISOString();
    const newConv = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      participantIds: [currentUserId, targetUserId],
      unreadCount: 0,
      updatedAt: now,
      lastMessageText: '',
      lastMessageAt: now,
    };

    conversationsState.unshift(newConv);
    persist();
    return newConv;
  },

  /**
   * Mark a conversation as read
   */
  markAsRead: async (conversationId) => {
    initStorage();
    const convIndex = conversationsState.findIndex((c) => c.id === conversationId);
    if (convIndex !== -1 && conversationsState[convIndex].unreadCount > 0) {
      conversationsState[convIndex] = {
        ...conversationsState[convIndex],
        unreadCount: 0,
      };
      persist();
    }
  },

  /**
   * Get total unread count across all conversations for current user
   */
  getUnreadCount: (currentUserId = 'st_101') => {
    initStorage();
    return conversationsState
      .filter((c) => c.participantIds.includes(currentUserId))
      .reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  },

  /**
   * Search conversations by participant name or headline
   */
  searchConversations: (query, conversations = []) => {
    if (!query || !query.trim()) return conversations;
    const q = query.toLowerCase().trim();

    return conversations.filter((c) => {
      const name = c.partner?.name?.toLowerCase() || '';
      return name.includes(q);
    });
  },

  /**
   * Generate an automated realistic simulated reply for interactive demo experience
   */
  generateMockReply: async (conversationId, partnerUserId, usersMap = {}) => {
    initStorage();
    const partner = usersMap[partnerUserId];
    const partnerName = partner ? partner.name.split(' ')[0] : 'Alumni';

    const replies = [
      `Thanks for reaching out, Tokir! Let's definitely coordinate on this.`,
      `Sounds good! Focus on the core fundamentals and feel free to share your progress.`,
      `Awesome. I'll take a look and get back to you with detailed feedback.`,
      `Sure thing! Happy to help out a fellow JECRC student anytime.`,
      `Great initiative. Keep building and let's review it during our next connect.`,
    ];

    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    const now = new Date().toISOString();

    const replyMsg = {
      id: `msg_reply_${Date.now()}`,
      conversationId,
      senderId: partnerUserId,
      text: randomReply,
      createdAt: now,
    };

    messagesState.push(replyMsg);

    const convIndex = conversationsState.findIndex((c) => c.id === conversationId);
    if (convIndex !== -1) {
      conversationsState[convIndex] = {
        ...conversationsState[convIndex],
        lastMessageText: randomReply,
        lastMessageAt: now,
        updatedAt: now,
      };
    }

    persist();
    return replyMsg;
  },

  /**
   * Reset data to initial mock dataset (useful for testing)
   */
  resetToDefault: () => {
    conversationsState = [...INITIAL_CONVERSATIONS];
    messagesState = [...INITIAL_MESSAGES];
    persist();
  },
};
