const db = require('../config/db');

const AUDIT_ACTIONS = {
  USER_VIEWED: 'USER_VIEWED',
  USER_EXPORTED: 'USER_EXPORTED',
  USER_STATUS_UPDATED: 'USER_STATUS_UPDATED',
  VERIFICATION_APPROVED: 'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED: 'VERIFICATION_REJECTED',
  DATA_QUALITY_VIEWED: 'DATA_QUALITY_VIEWED',
  SETTING_UPDATED: 'SETTING_UPDATED',
  ADMIN_PROFILE_UPDATED: 'ADMIN_PROFILE_UPDATED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  USER_REACTIVATED: 'USER_REACTIVATED',
  NOTIFICATION_READ: 'NOTIFICATION_READ',
  NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
  NOTIFICATION_UPDATED: 'NOTIFICATION_UPDATED',
  NOTIFICATION_PUBLISHED: 'NOTIFICATION_PUBLISHED',
  NOTIFICATION_CANCELLED: 'NOTIFICATION_CANCELLED',
  POST_MODERATED: 'POST_MODERATED',
  COMMENT_MODERATED: 'COMMENT_MODERATED',
  JOB_MODERATED: 'JOB_MODERATED',
};

/**
 * Strips sensitive data (passwords, tokens, secrets) before persisting or returning audit metadata.
 * Handles nested arrays and objects recursively so that forbidden strings cannot appear as values.
 */
const sanitizeDetails = (details) => {
  if (!details || typeof details !== 'object') return {};
  const forbiddenKeys = ['password', 'password_hash', 'token', 'jwt', 'secret', 'authorization', 'cookie'];

  const sanitizeValue = (v) => {
    if (typeof v === 'string') {
      // Scrub string values that exactly match a forbidden key
      return forbiddenKeys.includes(v.toLowerCase()) ? '[REDACTED]' : (v.length > 500 ? v.substring(0, 500) + '...' : v);
    }
    if (Array.isArray(v)) {
      return v.map(sanitizeValue);
    }
    if (v && typeof v === 'object') {
      return sanitizeDetails(v);
    }
    return v;
  };

  const clean = {};
  for (const [k, v] of Object.entries(details)) {
    if (forbiddenKeys.includes(k.toLowerCase())) continue;
    clean[k] = sanitizeValue(v);
  }
  return clean;
};

/**
 * Records an immutable administrative audit log entry
 */
const logAdminAction = async ({
  client,
  adminUserId,
  actorName,
  action,
  targetEntity,
  targetId,
  details = {},
}) => {
  try {
    const queryRunner = client || db;

    let resolvedActorName = actorName;
    if (!resolvedActorName && adminUserId) {
      const nameRes = await queryRunner.query(
        `SELECT p.full_name, u.email FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1`,
        [adminUserId]
      );
      resolvedActorName = nameRes.rows[0]?.full_name || nameRes.rows[0]?.email || 'Administrator';
    }

    const sanitized = sanitizeDetails(details);

    const insertQuery = `
      INSERT INTO audit_logs (
        user_id,
        actor_name,
        action,
        target_entity,
        target_id,
        details,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const result = await queryRunner.query(insertQuery, [
      adminUserId || null,
      resolvedActorName || 'Administrator',
      action,
      targetEntity || null,
      targetId || null,
      JSON.stringify(sanitized),
    ]);

    return result.rows[0];
  } catch (err) {
    console.error('[AUDIT LOG ERROR] Failed to record audit log:', err);
    if (client) throw err;
    return null;
  }
};

/**
 * Fetches paginated & filtered audit logs
 */
const getAuditLogs = async (options = {}) => {
  const {
    action,
    adminUserId,
    targetUserId,
    targetEntity,
    from,
    to,
    page = 1,
    pageSize = 20,
  } = options;

  const whereClauses = [];
  const queryParams = [];

  if (action && action !== 'all') {
    queryParams.push(action.trim().toUpperCase());
    whereClauses.push(`a.action = $${queryParams.length}`);
  }

  if (adminUserId) {
    queryParams.push(adminUserId.trim());
    whereClauses.push(`a.user_id = $${queryParams.length}`);
  }

  if (targetUserId) {
    queryParams.push(targetUserId.trim());
    whereClauses.push(`(a.target_id::text = $${queryParams.length} OR (a.details->>'targetUserId') = $${queryParams.length})`);
  }

  if (targetEntity) {
    queryParams.push(targetEntity.trim().toUpperCase());
    whereClauses.push(`a.target_entity = $${queryParams.length}`);
  }

  if (from) {
    queryParams.push(new Date(from).toISOString());
    whereClauses.push(`a.created_at >= $${queryParams.length}`);
  }

  if (to) {
    queryParams.push(new Date(to).toISOString());
    whereClauses.push(`a.created_at <= $${queryParams.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const parsedPage = parseInt(page, 10);
  const validatedPage = !isNaN(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const parsedPageSize = parseInt(pageSize, 10);
  const validatedPageSize = !isNaN(parsedPageSize) && parsedPageSize >= 1 ? Math.min(100, parsedPageSize) : 20;
  const offset = (validatedPage - 1) * validatedPageSize;

  // Count
  const countQuery = `SELECT COUNT(*) AS total FROM audit_logs a ${whereSql};`;
  const countRes = await db.query(countQuery, queryParams);
  const totalCount = parseInt(countRes.rows[0]?.total, 10) || 0;
  const totalPages = Math.ceil(totalCount / validatedPageSize) || 1;

  // Data
  const dataQueryParams = [...queryParams, validatedPageSize, offset];
  const limitIdx = queryParams.length + 1;
  const offsetIdx = queryParams.length + 2;

  const dataQuery = `
    SELECT
        a.id,
        a.user_id AS "adminUserId",
        a.actor_name AS "actorName",
        a.action,
        a.target_entity AS "targetEntity",
        a.target_id AS "targetId",
        a.details,
        a.created_at AS "createdAt"
    FROM audit_logs a
    ${whereSql}
    ORDER BY a.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx};
  `;

  const result = await db.query(dataQuery, dataQueryParams);

  return {
    logs: result.rows.map((row) => ({
      id: row.id,
      adminUserId: row.adminUserId,
      actorName: row.actorName,
      action: row.action,
      targetEntity: row.targetEntity,
      targetId: row.targetId,
      targetUserName: row.details?.targetUserName || null,
      // Re-sanitize at read time to guard against historical entries stored
      // before the sanitizer was in place (e.g., pre-Phase-12 test data).
      details: sanitizeDetails(row.details || {}),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    })),
    totalCount,
    page: validatedPage,
    pageSize: validatedPageSize,
    totalPages,
    hasNext: validatedPage < totalPages,
    hasPrev: validatedPage > 1,
  };
};

/**
 * Generates human-readable action description from audit row
 */
const generateDescription = (row) => {
  const actor = row.actor_name || 'Admin';
  const target = row.details?.targetUserName || 'User';
  switch (row.action) {
    case 'USER_VIEWED':
      return `${actor} viewed profile of ${target}`;
    case 'USER_EXPORTED':
      return `${actor} exported ${row.details?.recordCount ? `${row.details.recordCount} ` : ''}user records to CSV`;
    case 'VERIFICATION_APPROVED':
      return `${actor} approved alumni verification for ${target}`;
    case 'VERIFICATION_REJECTED':
      return `${actor} declined alumni verification for ${target}`;
    case 'DATA_QUALITY_VIEWED':
      return `${actor} inspected data quality & hygiene metrics`;
    case 'SETTING_UPDATED':
      return `${actor} updated platform system settings`;
    case 'ADMIN_PROFILE_UPDATED':
      return `${actor} updated administrator profile details`;
    case 'USER_ROLE_CHANGED':
      return `${actor} promoted ${target} from ${row.details?.previousRole || 'Student'} to ${row.details?.newRole || 'Alumni'}`;
    case 'USER_DEACTIVATED':
      return `${actor} deactivated account for ${target}`;
    case 'USER_REACTIVATED':
      return `${actor} restored active access for ${target}`;
    case 'NOTIFICATION_READ':
      return `${actor} marked notification as read`;
    case 'NOTIFICATION_CREATED':
      return `${actor} created announcement draft: "${row.details?.title || 'Announcement'}"`;
    case 'NOTIFICATION_UPDATED':
      return `${actor} updated announcement draft: "${row.details?.title || 'Announcement'}"`;
    case 'NOTIFICATION_PUBLISHED':
      return `${actor} published announcement "${row.details?.title || 'Announcement'}" to ${row.details?.recipientCount || 0} recipients`;
    case 'NOTIFICATION_CANCELLED':
      return `${actor} cancelled announcement: "${row.details?.title || 'Announcement'}"`;
    default:
      return `${actor} performed ${row.action}`;
  }
};

/**
 * Formats relative timestamp for activity cards
 */
const formatTimeAgo = (createdAt) => {
  if (!createdAt) return 'Recently';
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

/**
 * Fetches recent administrative activity stream derived from audit_logs
 */
const getRecentActivity = async (options = {}) => {
  const { limit = 10 } = options;
  const parsedLimit = parseInt(limit, 10);
  const safeLimit = !isNaN(parsedLimit) && parsedLimit >= 1 ? Math.min(50, parsedLimit) : 10;

  const query = `
    SELECT
        a.id,
        a.user_id AS "actorId",
        a.actor_name AS "actorName",
        a.action,
        a.target_entity AS "targetEntity",
        a.target_id AS "targetId",
        a.details,
        a.created_at AS "createdAt",
        p.avatar_url AS "avatarUrl"
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ORDER BY a.created_at DESC
    LIMIT $1;
  `;

  const result = await db.query(query, [safeLimit]);

  return result.rows.map((row) => ({
    id: row.id,
    action: row.action,
    actorId: row.actorId,
    actorName: row.actorName,
    avatar: row.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    targetEntity: row.targetEntity,
    targetId: row.targetId,
    targetUserName: row.details?.targetUserName || null,
    description: generateDescription(row),
    time: formatTimeAgo(row.createdAt),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    details: row.details,
  }));
};

module.exports = {
  AUDIT_ACTIONS,
  logAdminAction,
  getAuditLogs,
  getRecentActivity,
};
