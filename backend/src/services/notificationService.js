const crypto = require('crypto');
const db = require('../config/db');

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

const formatNotificationDTO = (row) => {
  const isActorAlumni = (row.actor_role || '').toUpperCase() === 'ALUMNI';
  const actorName = row.actor_name || (row.actor_email ? row.actor_email.split('@')[0] : null);

  let actor = null;
  if (row.actor_id && actorName) {
    actor = {
      id: row.actor_id,
      name: actorName,
      email: row.actor_email,
      role: (row.actor_role || 'STUDENT').toLowerCase(),
      avatar: row.actor_avatar || (isActorAlumni
        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'),
    };
  }

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    text: row.message,
    actor: actor,
    avatar: actor ? actor.avatar : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300',
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata || {},
    isRead: Boolean(row.is_read),
    unread: !Boolean(row.is_read),
    createdAt: row.created_at,
    time: formatTimeAgo(row.created_at),
    readAt: row.read_at,
  };
};

/**
 * Central Notification Service Layer
 */
const createNotification = async ({
  recipientId,
  actorId = null,
  type,
  title,
  message,
  entityType = null,
  entityId = null,
  metadata = {},
}) => {
  // Self-notification guard: NEVER notify users about their own actions
  if (recipientId && actorId && recipientId === actorId) {
    return null;
  }

  if (!recipientId || !type || !title || !message) {
    return null;
  }

  try {
    const notifId = crypto.randomUUID();
    const result = await db.query(
      `INSERT INTO notifications (id, recipient_id, actor_id, type, title, message, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [notifId, recipientId, actorId, type, title, message, entityType, entityId, JSON.stringify(metadata)]
    );

    return result.rows[0];
  } catch (err) {
    console.warn('[NOTIFICATION SERVICE] Failed to create notification:', err.message);
    return null;
  }
};

const getNotifications = async (authUserId, queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page || 1, 10));
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit || 20, 10)));
  const offset = (page - 1) * limit;

  // Total count & unread count queries
  const totalRes = await db.query('SELECT COUNT(*) AS total FROM notifications WHERE recipient_id = $1', [authUserId]);
  const unreadRes = await db.query('SELECT COUNT(*) AS unread FROM notifications WHERE recipient_id = $1 AND is_read = false', [authUserId]);

  const total = parseInt(totalRes.rows[0].total, 10);
  const unreadCount = parseInt(unreadRes.rows[0].unread, 10);

  const queryText = `
    SELECT n.*,
           u_actor.email AS actor_email, u_actor.role AS actor_role,
           p_actor.full_name AS actor_name, p_actor.avatar_url AS actor_avatar
    FROM notifications n
    LEFT JOIN users u_actor ON n.actor_id = u_actor.id
    LEFT JOIN user_profiles p_actor ON u_actor.id = p_actor.user_id
    WHERE n.recipient_id = $1
    ORDER BY n.created_at DESC
    LIMIT $2 OFFSET $3;
  `;

  const result = await db.query(queryText, [authUserId, limit, offset]);
  const notifications = result.rows.map(formatNotificationDTO);

  return {
    notifications,
    unreadCount,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
    hasMore: offset + limit < total,
  };
};

const getUnreadCount = async (authUserId) => {
  const result = await db.query('SELECT COUNT(*) AS unread FROM notifications WHERE recipient_id = $1 AND is_read = false', [authUserId]);
  return { unreadCount: parseInt(result.rows[0].unread || '0', 10) };
};

const markAsRead = async (authUserId, notificationId) => {
  const checkRes = await db.query('SELECT recipient_id FROM notifications WHERE id = $1', [notificationId]);
  if (checkRes.rows.length === 0) {
    const err = new Error('Notification not found');
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  if (checkRes.rows[0].recipient_id !== authUserId) {
    const err = new Error('You do not have permission to modify this notification');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  await db.query(
    `UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND recipient_id = $2`,
    [notificationId, authUserId]
  );

  return { success: true, message: 'Notification marked as read' };
};

const markAllAsRead = async (authUserId) => {
  const result = await db.query(
    `UPDATE notifications SET is_read = true, read_at = NOW() WHERE recipient_id = $1 AND is_read = false`,
    [authUserId]
  );

  return { success: true, message: 'All notifications marked as read', updatedCount: result.rowCount };
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
