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
      avatar: row.actor_avatar || null,
    };
  }

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    text: row.message,
    actor: actor,
    avatar: actor ? actor.avatar : null,
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

    // Fetch actor details to format complete Notification DTO for instant Socket.IO push
    const actorRes = await db.query(
      `SELECT u.email AS actor_email, u.role AS actor_role, p.full_name AS actor_name, p.avatar_url AS actor_avatar
       FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1`,
      [actorId]
    ).catch(() => ({ rows: [] }));

    const notifRow = {
      ...result.rows[0],
      ...(actorRes.rows[0] || {}),
    };

    const dto = formatNotificationDTO(notifRow);

    // Instant Real-Time Socket.IO Push Event to recipient room
    try {
      const { emitToUser } = require('../socket/socketServer');
      emitToUser(recipientId, 'notification:new', dto);
    } catch {
      // Non-blocking socket error catch
    }

    // Trigger Platform Email Dispatch (respecting recipient's Settings toggles)
    const emailService = require('../email/emailService');
    emailService.sendPlatformNotification(recipientId, type, {
      title,
      message,
      entityType,
      entityId,
    }).catch((err) => console.warn('[Platform Email Warning]', err.message));

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

  // Execute unread count (leveraging partial index) and data query in parallel
  const unreadPromise = db.query(
    'SELECT COUNT(*) AS unread FROM notifications WHERE recipient_id = $1 AND is_read = false',
    [authUserId]
  );

  const queryText = `
    SELECT n.*,
           u_actor.email AS actor_email, u_actor.role AS actor_role,
           p_actor.full_name AS actor_name, p_actor.avatar_url AS actor_avatar,
           COUNT(*) OVER() AS total_count
    FROM notifications n
    LEFT JOIN users u_actor ON n.actor_id = u_actor.id
    LEFT JOIN user_profiles p_actor ON u_actor.id = p_actor.user_id
    WHERE n.recipient_id = $1
    ORDER BY n.created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const dataPromise = db.query(queryText, [authUserId, limit, offset]);

  const [unreadRes, dataResult] = await Promise.all([unreadPromise, dataPromise]);

  const unreadCount = parseInt(unreadRes.rows[0]?.unread || '0', 10);
  const notifications = dataResult.rows.map(formatNotificationDTO);
  const total = dataResult.rows.length > 0 ? parseInt(dataResult.rows[0].total_count, 10) : 0;

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

const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const markAsRead = async (authUserId, notificationId) => {
  if (!isUUID(notificationId)) {
    return { success: true, message: 'Notification marked as read' };
  }

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
