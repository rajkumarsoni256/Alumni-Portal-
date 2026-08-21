const crypto = require('crypto');
const db = require('../config/db');
const notificationService = require('./notificationService');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  const date = new Date(dateStr);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 7)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getUserName = async (userId) => {
  const res = await db.query(
    `SELECT p.full_name, u.email FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1`,
    [userId]
  );
  if (res.rows.length === 0) return 'JECRC Member';
  return res.rows[0].full_name || res.rows[0].email.split('@')[0];
};

const formatPartner = (row) => {
  const isAlumni = (row.partner_role || '').toUpperCase() === 'ALUMNI';
  const gradYr = row.partner_graduation_year ? parseInt(row.partner_graduation_year, 10) : null;
  const name = row.partner_name || (row.partner_email ? row.partner_email.split('@')[0] : 'JECRC Member');

  return {
    id: row.partner_id,
    userId: row.partner_id,
    name: name,
    email: row.partner_email,
    role: (row.partner_role || 'STUDENT').toLowerCase(),
    avatar: row.partner_avatar || null,
    headline: isAlumni
      ? `${row.partner_designation || 'Alumnus'}${row.partner_company ? ` @ ${row.partner_company}` : ''}`
      : `${row.partner_degree || 'B.Tech'} ${row.partner_branch || ''}${gradYr ? ` • Class of ${gradYr}` : ''}`.trim(),
    batch: gradYr ? `Class of ${gradYr}` : (isAlumni ? 'Alumni' : 'Student'),
    company: row.partner_company || null,
    designation: row.partner_designation || null,
    isAlumni: isAlumni,
  };
};

const formatMessageDTO = (row) => {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    text: row.content,
    createdAt: row.created_at,
    timestamp: new Date(row.created_at).getTime(),
    timeAgo: formatTimeAgo(row.created_at),
  };
};

const verifyConnection = async (userId1, userId2) => {
  const connRes = await db.query(
    `SELECT status FROM connections
     WHERE (requester_id = $1 AND receiver_id = $2 OR requester_id = $2 AND receiver_id = $1)
       AND status = 'ACCEPTED'`,
    [userId1, userId2]
  );
  return connRes.rows.length > 0;
};

const createOrGetConversation = async (user, targetUserId) => {
  if (!targetUserId || typeof targetUserId !== 'string') {
    const err = new Error('Target user ID is required');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  if (!UUID_REGEX.test(targetUserId.trim())) {
    return {
      id: `conv_${targetUserId.trim()}`,
      partner: {
        id: targetUserId.trim(),
        userId: targetUserId.trim(),
        name: 'JECRC Member',
        role: 'student',
        avatar: null,
      },
      lastMessageText: 'Started a conversation',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
    };
  }

  const cleanTargetId = targetUserId.trim();

  if (cleanTargetId === user.id) {
    const err = new Error('You cannot start a conversation with yourself');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  if (user.account_status === 'DISABLED') {
    const err = new Error('Disabled accounts cannot access private messaging');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  const targetUserRes = await db.query('SELECT id, role, account_status FROM users WHERE id = $1', [cleanTargetId]);
  if (targetUserRes.rows.length === 0) {
    const err = new Error(`Target user not found with ID '${cleanTargetId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const targetUser = targetUserRes.rows[0];
  if ((targetUser.role || '').toUpperCase() === 'ADMIN') {
    const err = new Error('Private messaging is not enabled for Admin accounts');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  if (targetUser.account_status === 'DISABLED') {
    const err = new Error('Cannot message a disabled account');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  // Blocked users check
  const blockCheck = await db.query(
    'SELECT id FROM user_blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
    [user.id, cleanTargetId]
  );
  if (blockCheck.rows.length > 0) {
    const err = new Error('Private messaging is unavailable between blocked accounts');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  // Check target user's messaging preference (allow_messages_from)
  const targetSettingsRes = await db.query('SELECT allow_messages_from FROM user_settings WHERE user_id = $1', [cleanTargetId]);
  const allowFrom = targetSettingsRes.rows[0]?.allow_messages_from || 'CONNECTIONS';

  const isConnected = await verifyConnection(user.id, cleanTargetId);
  if (allowFrom === 'CONNECTIONS' && !isConnected) {
    const err = new Error('This user only accepts private messages from confirmed connections');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  // Search existing 1-to-1 conversation pair
  const existingRes = await db.query(
    `SELECT cp1.conversation_id
     FROM conversation_participants cp1
     JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
     WHERE cp1.user_id = $1 AND cp2.user_id = $2`,
    [user.id, cleanTargetId]
  );

  if (existingRes.rows.length > 0) {
    const existingConvId = existingRes.rows[0].conversation_id;
    return getConversationById(user.id, existingConvId);
  }

  // Create new conversation
  const convId = crypto.randomUUID();
  await db.query(`INSERT INTO conversations (id) VALUES ($1)`, [convId]);
  await db.query(
    `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
    [convId, user.id, cleanTargetId]
  );

  return getConversationById(user.id, convId);
};

const getConversations = async (authUserId) => {
  const queryText = `
    SELECT c.id, c.last_message_at, c.updated_at,
           cp_partner.user_id AS partner_id,
           u_partner.email AS partner_email, u_partner.role AS partner_role,
           p_partner.full_name AS partner_name, p_partner.avatar_url AS partner_avatar,
           p_partner.degree AS partner_degree, p_partner.branch AS partner_branch,
           p_partner.graduation_year AS partner_graduation_year,
           p_partner.company AS partner_company, p_partner.designation AS partner_designation,
           (
             SELECT m.content FROM messages m 
             WHERE m.conversation_id = c.id 
             ORDER BY m.created_at DESC LIMIT 1
           ) AS last_message_text,
           (
             SELECT m.created_at FROM messages m 
             WHERE m.conversation_id = c.id 
             ORDER BY m.created_at DESC LIMIT 1
           ) AS last_message_created_at,
           (
             SELECT COUNT(*) FROM messages m2
             WHERE m2.conversation_id = c.id
               AND m2.created_at > COALESCE(cp_self.last_read_at, '1970-01-01'::timestamp)
               AND m2.sender_id != $1
           ) AS unread_count
    FROM conversations c
    JOIN conversation_participants cp_self ON c.id = cp_self.conversation_id AND cp_self.user_id = $1
    JOIN conversation_participants cp_partner ON c.id = cp_partner.conversation_id AND cp_partner.user_id != $1
    JOIN users u_partner ON cp_partner.user_id = u_partner.id
    LEFT JOIN user_profiles p_partner ON u_partner.id = p_partner.user_id
    WHERE u_partner.account_status != 'DISABLED'
    ORDER BY c.last_message_at DESC;
  `;

  const result = await db.query(queryText, [authUserId]);

  const seenPartners = new Set();
  const conversations = [];

  for (const row of result.rows) {
    const partner = formatPartner(row);
    if (!seenPartners.has(partner.id)) {
      seenPartners.add(partner.id);
      const lastMsgTime = row.last_message_created_at || row.last_message_at;
      const unread = parseInt(row.unread_count || '0', 10);

      conversations.push({
        id: row.id,
        conversationId: row.id,
        participantIds: [authUserId, partner.id],
        partnerId: partner.id,
        partner: partner,
        lastMessageText: row.last_message_text || '',
        lastMessageAt: lastMsgTime,
        updatedAt: lastMsgTime,
        timeAgo: formatTimeAgo(lastMsgTime),
        unreadCount: unread,
      });
    }
  }

  return { conversations, total: conversations.length };
};

const getConversationById = async (authUserId, conversationId) => {
  if (!UUID_REGEX.test(conversationId)) {
    const err = new Error('Invalid conversation ID format');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const queryText = `
    SELECT c.id, c.last_message_at, c.updated_at,
           cp_partner.user_id AS partner_id,
           u_partner.email AS partner_email, u_partner.role AS partner_role,
           p_partner.full_name AS partner_name, p_partner.avatar_url AS partner_avatar,
           p_partner.degree AS partner_degree, p_partner.branch AS partner_branch,
           p_partner.graduation_year AS partner_graduation_year,
           p_partner.company AS partner_company, p_partner.designation AS partner_designation,
           (
             SELECT m.content FROM messages m 
             WHERE m.conversation_id = c.id 
             ORDER BY m.created_at DESC LIMIT 1
           ) AS last_message_text,
           (
             SELECT m.created_at FROM messages m 
             WHERE m.conversation_id = c.id 
             ORDER BY m.created_at DESC LIMIT 1
           ) AS last_message_created_at,
           (
             SELECT COUNT(*) FROM messages m2
             WHERE m2.conversation_id = c.id
               AND m2.created_at > COALESCE(cp_self.last_read_at, '1970-01-01'::timestamp)
               AND m2.sender_id != $1
           ) AS unread_count
    FROM conversations c
    JOIN conversation_participants cp_self ON c.id = cp_self.conversation_id AND cp_self.user_id = $1
    JOIN conversation_participants cp_partner ON c.id = cp_partner.conversation_id AND cp_partner.user_id != $1
    JOIN users u_partner ON cp_partner.user_id = u_partner.id
    LEFT JOIN user_profiles p_partner ON u_partner.id = p_partner.user_id
    WHERE c.id = $2;
  `;

  const result = await db.query(queryText, [authUserId, conversationId]);

  if (result.rows.length === 0) {
    const err = new Error('Conversation not found or access denied');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const row = result.rows[0];
  const partner = formatPartner(row);
  const lastMsgTime = row.last_message_created_at || row.last_message_at;

  return {
    conversation: {
      id: row.id,
      conversationId: row.id,
      participantIds: [authUserId, partner.id],
      partnerId: partner.id,
      partner: partner,
      lastMessageText: row.last_message_text || '',
      lastMessageAt: lastMsgTime,
      updatedAt: lastMsgTime,
      timeAgo: formatTimeAgo(lastMsgTime),
      unreadCount: parseInt(row.unread_count || '0', 10),
    },
  };
};

const getMessages = async (authUserId, conversationId, queryParams = {}) => {
  if (!UUID_REGEX.test(conversationId)) {
    const err = new Error('Invalid conversation ID format');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  // Authorization check
  const partCheck = await db.query(
    'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, authUserId]
  );

  if (partCheck.rows.length === 0) {
    const err = new Error('You do not have permission to view messages in this private conversation');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const { before, page: rawPage, limit: rawLimit } = queryParams;
  const limit = Math.min(100, Math.max(1, parseInt(rawLimit || 50, 10)));

  let dataQuery = `
    SELECT id, conversation_id, sender_id, content, created_at, updated_at,
           COUNT(*) OVER() AS total_count
    FROM messages
    WHERE conversation_id = $1
  `;
  const queryParamsArr = [conversationId];

  if (before && UUID_REGEX.test(String(before).trim())) {
    dataQuery += ` AND created_at < (SELECT created_at FROM messages WHERE id = $2)`;
    queryParamsArr.push(String(before).trim());
  }

  const limitIdx = queryParamsArr.length + 1;
  dataQuery += ` ORDER BY created_at ASC LIMIT $${limitIdx}`;
  queryParamsArr.push(limit);

  const result = await db.query(dataQuery, queryParamsArr);
  const messages = result.rows.map(formatMessageDTO);
  const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;

  return {
    messages,
    total,
    limit,
    hasMore: result.rows.length === limit,
    nextCursor: messages.length > 0 ? messages[0].id : null,
  };
};

const sendMessage = async (user, conversationId, messageData) => {
  if (!UUID_REGEX.test(conversationId)) {
    const err = new Error('Invalid conversation ID format');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  if (user.account_status === 'DISABLED') {
    const err = new Error('Disabled accounts cannot send private messages');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  // Authorization & Partner lookup check
  const partCheck = await db.query(
    'SELECT user_id FROM conversation_participants WHERE conversation_id = $1',
    [conversationId]
  );

  const isParticipant = partCheck.rows.some((r) => r.user_id === user.id);
  if (!isParticipant) {
    const err = new Error('You are not a participant in this conversation');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const recipientPart = partCheck.rows.find((r) => r.user_id !== user.id);

  const content = (messageData.text || messageData.content || '').trim();
  if (!content) {
    const err = new Error('Message text cannot be empty');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  if (content.length > 2000) {
    const err = new Error('Message exceeds maximum length of 2000 characters');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const msgId = crypto.randomUUID();
  const now = new Date();

  await db.query(
    `INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [msgId, conversationId, user.id, content, now]
  );

  const msgDto = {
    id: msgId,
    conversationId,
    senderId: user.id,
    content,
    text: content,
    createdAt: now.toISOString(),
    timestamp: now.getTime(),
    timeAgo: 'Just now',
  };

  // Instant Socket.IO Event Emission to active conversation room and recipient user room
  try {
    const { emitToConversation, emitToUser } = require('../socket/socketServer');
    emitToConversation(conversationId, 'message:new', msgDto);
    if (recipientPart) {
      emitToUser(recipientPart.user_id, 'message:new', msgDto);
    }
  } catch {
    // Non-blocking socket error handling
  }

  // Async updates (non-blocking for HTTP latency)
  db.query(
    `UPDATE conversations SET last_message_at = $1, updated_at = $1 WHERE id = $2`,
    [now, conversationId]
  ).catch(() => {});

  db.query(
    `UPDATE conversation_participants SET last_read_at = $1 WHERE conversation_id = $2 AND user_id = $3`,
    [now, conversationId, user.id]
  ).catch(() => {});

  // Trigger Notification to Recipient
  if (recipientPart) {
    getUserName(user.id).then((senderName) => {
      notificationService.createNotification({
        recipientId: recipientPart.user_id,
        actorId: user.id,
        type: 'NEW_MESSAGE',
        title: 'New private message',
        message: `${senderName} sent you a new message`,
        entityType: 'CONVERSATION',
        entityId: conversationId,
      }).catch(() => {});
    }).catch(() => {});
  }

  return {
    message: msgDto,
  };
};

const markAsRead = async (authUserId, conversationId) => {
  if (!UUID_REGEX.test(conversationId)) {
    return { success: false, message: 'Invalid conversation ID format' };
  }

  const partCheck = await db.query(
    'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, authUserId]
  );

  if (partCheck.rows.length === 0) {
    const err = new Error('Access denied');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  await db.query(
    `UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, authUserId]
  );

  return { success: true, message: 'Conversation marked as read' };
};

const getUnreadCount = async (authUserId) => {
  const result = await db.query(
    `SELECT COUNT(m.id) AS total_unread
     FROM messages m
     JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id AND cp.user_id = $1
     WHERE m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamp)
       AND m.sender_id != $1`,
    [authUserId]
  );

  return { unreadCount: parseInt(result.rows[0].total_unread || '0', 10) };
};

module.exports = {
  createOrGetConversation,
  getConversations,
  getConversationById,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
};
