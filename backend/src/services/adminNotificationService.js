const db = require('../config/db');
const { logAdminAction, AUDIT_ACTIONS } = require('./adminAuditService');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED_AUDIENCE_TYPES = ['ALL', 'STUDENTS', 'ALUMNI', 'ADMINS', 'CUSTOM'];
const ALLOWED_NOTIFICATION_TYPES = ['GENERAL', 'URGENT', 'EVENT', 'OPPORTUNITY', 'MAINTENANCE'];
const ALLOWED_STATUSES = ['DRAFT', 'PUBLISHED', 'CANCELLED'];
const ALLOWED_SORT_FIELDS = {
  createdat: 'a.created_at',
  updatedat: 'a.updated_at',
  publishedat: 'a.published_at',
  title: 'a.title',
  status: 'a.status',
  type: 'a.type',
};

/**
 * Validates a UUID string
 */
const isValidUUID = (uuid) => {
  return typeof uuid === 'string' && UUID_REGEX.test(uuid.trim());
};

/**
 * Builds safe parameterized SQL WHERE conditions for audience targeting
 */
const buildAudienceWhereClause = (audienceType = 'ALL', targetFilters = {}, paramOffset = 0) => {
  const normAudience = String(audienceType).toUpperCase().trim();
  const whereClauses = [`u.account_status = 'ACTIVE'`];
  const queryParams = [];

  if (normAudience === 'STUDENTS') {
    queryParams.push('STUDENT');
    whereClauses.push(`u.role = $${paramOffset + queryParams.length}`);
  } else if (normAudience === 'ALUMNI') {
    queryParams.push('ALUMNI');
    whereClauses.push(`u.role = $${paramOffset + queryParams.length}`);
  } else if (normAudience === 'ADMINS') {
    queryParams.push('ADMIN');
    whereClauses.push(`u.role = $${paramOffset + queryParams.length}`);
  } else if (normAudience === 'CUSTOM') {
    const { role, branch, batch, graduationYear, city, location, company, selectedUserIds } = targetFilters || {};

    if (selectedUserIds && Array.isArray(selectedUserIds) && selectedUserIds.length > 0) {
      const validIds = selectedUserIds.filter(isValidUUID);
      if (validIds.length === 0 && selectedUserIds.length > 0) {
        const error = new Error('All selectedUserIds must be valid UUID strings.');
        error.statusCode = 400;
        error.errorCode = 'INVALID_UUID_LIST';
        throw error;
      }
      queryParams.push(validIds);
      whereClauses.push(`u.id = ANY($${paramOffset + queryParams.length}::uuid[])`);
    }

    if (role && role !== 'all') {
      const normRole = String(role).toUpperCase().trim();
      if (['STUDENT', 'ALUMNI', 'ADMIN'].includes(normRole)) {
        queryParams.push(normRole);
        whereClauses.push(`u.role = $${paramOffset + queryParams.length}`);
      }
    }

    if (branch && String(branch).trim() && branch !== 'all') {
      queryParams.push(`%${String(branch).trim()}%`);
      whereClauses.push(`p.branch ILIKE $${paramOffset + queryParams.length}`);
    }

    const targetYear = batch || graduationYear;
    if (targetYear && targetYear !== 'all') {
      const yearInt = parseInt(targetYear, 10);
      if (!isNaN(yearInt)) {
        queryParams.push(yearInt);
        whereClauses.push(`(p.graduation_year = $${paramOffset + queryParams.length} OR p.current_year = $${paramOffset + queryParams.length})`);
      }
    }

    const targetLoc = city || location;
    if (targetLoc && String(targetLoc).trim() && targetLoc !== 'all') {
      queryParams.push(`%${String(targetLoc).trim()}%`);
      whereClauses.push(`p.location ILIKE $${paramOffset + queryParams.length}`);
    }

    if (company && String(company).trim() && company !== 'all') {
      queryParams.push(`%${String(company).trim()}%`);
      whereClauses.push(`p.company ILIKE $${paramOffset + queryParams.length}`);
    }
  }

  return {
    whereSql: whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '',
    queryParams,
  };
};

/**
 * Calculates audience reach count for given audience type and filters
 */
const getAudienceCount = async (audienceType = 'ALL', targetFilters = {}) => {
  const { whereSql, queryParams } = buildAudienceWhereClause(audienceType, targetFilters, 0);
  const countQuery = `
    SELECT COUNT(u.id) AS total
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ${whereSql};
  `;
  const result = await db.query(countQuery, queryParams);
  return parseInt(result.rows[0]?.total, 10) || 0;
};

/**
 * Formats announcement record for API response
 */
const formatAnnouncement = (row) => {
  const totalRecipients = row.recipient_count !== null && row.recipient_count !== undefined
    ? parseInt(row.recipient_count, 10)
    : (row.total_recipients ? parseInt(row.total_recipients, 10) : 0);
  const readCount = row.read_count !== null && row.read_count !== undefined
    ? parseInt(row.read_count, 10)
    : 0;
  const unreadCount = Math.max(0, totalRecipients - readCount);
  const readPercentage = totalRecipients > 0 ? Math.round((readCount / totalRecipients) * 100) : 0;

  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    status: row.status,
    audienceType: row.audience_type,
    targetFilters: row.target_filters || {},
    createdBy: {
      id: row.created_by,
      name: row.creator_name || 'Admin',
      email: row.creator_email || null,
    },
    publishedBy: row.published_by
      ? {
          id: row.published_by,
          name: row.publisher_name || 'Admin',
          email: row.publisher_email || null,
        }
      : null,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    statistics: {
      totalRecipients,
      readCount,
      unreadCount,
      readPercentage,
    },
  };
};

/**
 * Lists announcements with pagination, search, filtering, and delivery statistics
 */
const getNotifications = async (options = {}) => {
  const {
    q,
    status,
    type,
    from,
    to,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    pageSize = 20,
  } = options;

  const whereClauses = [];
  const queryParams = [];

  // Search filter
  if (q && String(q).trim()) {
    queryParams.push(`%${String(q).trim()}%`);
    const idx = queryParams.length;
    whereClauses.push(`(a.title ILIKE $${idx} OR a.message ILIKE $${idx})`);
  }

  // Status filter
  if (status && status !== 'all') {
    const normStatus = String(status).toUpperCase().trim();
    if (ALLOWED_STATUSES.includes(normStatus)) {
      queryParams.push(normStatus);
      whereClauses.push(`a.status = $${queryParams.length}`);
    }
  }

  // Type filter
  if (type && type !== 'all') {
    const normType = String(type).toUpperCase().trim();
    if (ALLOWED_NOTIFICATION_TYPES.includes(normType)) {
      queryParams.push(normType);
      whereClauses.push(`a.type = $${queryParams.length}`);
    }
  }

  // Date range filter
  if (from) {
    queryParams.push(new Date(from).toISOString());
    whereClauses.push(`a.created_at >= $${queryParams.length}`);
  }

  if (to) {
    queryParams.push(new Date(to).toISOString());
    whereClauses.push(`a.created_at <= $${queryParams.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Pagination
  const parsedPage = parseInt(page, 10);
  const validatedPage = !isNaN(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
  const parsedPageSize = parseInt(pageSize, 10);
  const validatedPageSize = !isNaN(parsedPageSize) && parsedPageSize >= 1 ? Math.min(100, parsedPageSize) : 20;
  const offset = (validatedPage - 1) * validatedPageSize;

  // Whitelist sorting
  const cleanSortBy = String(sortBy).toLowerCase().replace(/[^a-z]/g, '');
  const sortColumn = ALLOWED_SORT_FIELDS[cleanSortBy] || 'a.created_at';
  const sortDirection = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Count query
  const countQuery = `SELECT COUNT(*) AS total FROM announcements a ${whereSql};`;
  const countRes = await db.query(countQuery, queryParams);
  const totalCount = parseInt(countRes.rows[0]?.total, 10) || 0;
  const totalPages = Math.ceil(totalCount / validatedPageSize) || 1;

  // Data query with statistics subqueries
  const dataQueryParams = [...queryParams, validatedPageSize, offset];
  const limitIdx = queryParams.length + 1;
  const offsetIdx = queryParams.length + 2;

  const dataQuery = `
    SELECT
        a.id,
        a.title,
        a.message,
        a.type,
        a.status,
        a.audience_type,
        a.target_filters,
        a.created_by,
        a.published_by,
        a.published_at,
        a.created_at,
        a.updated_at,
        cp.full_name AS creator_name,
        cu.email AS creator_email,
        pp.full_name AS publisher_name,
        pu.email AS publisher_email,
        COALESCE(r.total_recipients, 0) AS recipient_count,
        COALESCE(r.read_count, 0) AS read_count
    FROM announcements a
    LEFT JOIN users cu ON a.created_by = cu.id
    LEFT JOIN user_profiles cp ON cu.id = cp.user_id
    LEFT JOIN users pu ON a.published_by = pu.id
    LEFT JOIN user_profiles pp ON pu.id = pp.user_id
    LEFT JOIN (
        SELECT 
            announcement_id,
            COUNT(id) AS total_recipients,
            COUNT(CASE WHEN is_read = TRUE THEN 1 END) AS read_count
        FROM announcement_recipients
        GROUP BY announcement_id
    ) r ON a.id = r.announcement_id
    ${whereSql}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT $${limitIdx} OFFSET $${offsetIdx};
  `;

  const result = await db.query(dataQuery, dataQueryParams);

  // Calculate summary metrics for admin view
  const summaryRes = await db.query(`
    SELECT
        COUNT(*) AS total_announcements,
        COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) AS published_count,
        COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) AS draft_count,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled_count
    FROM announcements;
  `);

  const summary = {
    totalAnnouncements: parseInt(summaryRes.rows[0]?.total_announcements, 10) || 0,
    publishedCount: parseInt(summaryRes.rows[0]?.published_count, 10) || 0,
    draftCount: parseInt(summaryRes.rows[0]?.draft_count, 10) || 0,
    cancelledCount: parseInt(summaryRes.rows[0]?.cancelled_count, 10) || 0,
  };

  return {
    notifications: result.rows.map(formatAnnouncement),
    summary,
    totalCount,
    page: validatedPage,
    pageSize: validatedPageSize,
    totalPages,
    hasNext: validatedPage < totalPages,
    hasPrev: validatedPage > 1,
  };
};

/**
 * Fetches single announcement details by UUID
 */
const getNotificationById = async (id) => {
  if (!isValidUUID(id)) {
    const error = new Error('Invalid announcement ID format. Expected UUID.');
    error.statusCode = 400;
    error.errorCode = 'INVALID_UUID';
    throw error;
  }

  const query = `
    SELECT
        a.id,
        a.title,
        a.message,
        a.type,
        a.status,
        a.audience_type,
        a.target_filters,
        a.created_by,
        a.published_by,
        a.published_at,
        a.created_at,
        a.updated_at,
        cp.full_name AS creator_name,
        cu.email AS creator_email,
        pp.full_name AS publisher_name,
        pu.email AS publisher_email,
        COALESCE(r.total_recipients, 0) AS recipient_count,
        COALESCE(r.read_count, 0) AS read_count
    FROM announcements a
    LEFT JOIN users cu ON a.created_by = cu.id
    LEFT JOIN user_profiles cp ON cu.id = cp.user_id
    LEFT JOIN users pu ON a.published_by = pu.id
    LEFT JOIN user_profiles pp ON pu.id = pp.user_id
    LEFT JOIN (
        SELECT 
            announcement_id,
            COUNT(id) AS total_recipients,
            COUNT(CASE WHEN is_read = TRUE THEN 1 END) AS read_count
        FROM announcement_recipients
        GROUP BY announcement_id
    ) r ON a.id = r.announcement_id
    WHERE a.id = $1;
  `;

  const result = await db.query(query, [id]);
  if (result.rows.length === 0) {
    const error = new Error(`Announcement not found with ID: ${id}`);
    error.statusCode = 404;
    error.errorCode = 'NOTIFICATION_NOT_FOUND';
    throw error;
  }

  return formatAnnouncement(result.rows[0]);
};

/**
 * Creates a new announcement draft
 */
const createNotification = async (adminUserId, payload = {}) => {
  const {
    title,
    message,
    type = 'GENERAL',
    audienceType = 'ALL',
    targetFilters = {},
  } = payload;

  if (!title || typeof title !== 'string' || !title.trim() || title.trim().length > 255) {
    const error = new Error('Announcement title is required and must be under 255 characters.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  if (!message || typeof message !== 'string' || !message.trim() || message.trim().length > 10000) {
    const error = new Error('Announcement message is required and must be under 10000 characters.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  const normType = String(type).toUpperCase().trim();
  if (!ALLOWED_NOTIFICATION_TYPES.includes(normType)) {
    const error = new Error(`Invalid notification type. Allowed types: ${ALLOWED_NOTIFICATION_TYPES.join(', ')}.`);
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  const normAudience = String(audienceType).toUpperCase().trim();
  if (!ALLOWED_AUDIENCE_TYPES.includes(normAudience)) {
    const error = new Error(`Invalid audience type. Allowed audiences: ${ALLOWED_AUDIENCE_TYPES.join(', ')}.`);
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  // Validate targetFilters if selectedUserIds present
  if (targetFilters && targetFilters.selectedUserIds) {
    if (!Array.isArray(targetFilters.selectedUserIds)) {
      const error = new Error('selectedUserIds must be an array of UUIDs.');
      error.statusCode = 400;
      error.errorCode = 'VALIDATION_ERROR';
      throw error;
    }
    for (const uid of targetFilters.selectedUserIds) {
      if (!isValidUUID(uid)) {
        const error = new Error(`Invalid recipient user UUID format: ${uid}`);
        error.statusCode = 400;
        error.errorCode = 'INVALID_UUID';
        throw error;
      }
    }
  }

  const insertQuery = `
    INSERT INTO announcements (
        title,
        message,
        type,
        status,
        audience_type,
        target_filters,
        created_by
    ) VALUES ($1, $2, $3, 'DRAFT', $4, $5, $6)
    RETURNING *;
  `;

  const result = await db.query(insertQuery, [
    title.trim(),
    message.trim(),
    normType,
    normAudience,
    JSON.stringify(targetFilters || {}),
    adminUserId,
  ]);

  const created = result.rows[0];

  // Log Audit Action
  await logAdminAction({
    adminUserId,
    action: AUDIT_ACTIONS.NOTIFICATION_CREATED,
    targetEntity: 'ANNOUNCEMENT',
    targetId: created.id,
    details: {
      announcementId: created.id,
      title: created.title,
      type: created.type,
      audienceType: created.audience_type,
      status: 'DRAFT',
    },
  });

  return await getNotificationById(created.id);
};

/**
 * Updates an existing draft announcement
 */
const updateNotification = async (adminUserId, id, payload = {}) => {
  if (!isValidUUID(id)) {
    const error = new Error('Invalid announcement ID format. Expected UUID.');
    error.statusCode = 400;
    error.errorCode = 'INVALID_UUID';
    throw error;
  }

  const existingRes = await db.query(`SELECT id, status, title FROM announcements WHERE id = $1`, [id]);
  if (existingRes.rows.length === 0) {
    const error = new Error(`Announcement not found with ID: ${id}`);
    error.statusCode = 404;
    error.errorCode = 'NOTIFICATION_NOT_FOUND';
    throw error;
  }

  const existing = existingRes.rows[0];
  if (existing.status !== 'DRAFT') {
    const error = new Error(`Cannot modify announcement in ${existing.status} status. Only DRAFT announcements may be edited.`);
    error.statusCode = 409;
    error.errorCode = 'CANNOT_MODIFY_NON_DRAFT';
    throw error;
  }

  const { title, message, type, audienceType, targetFilters } = payload;
  const updates = [];
  const queryParams = [id];
  const changedFields = [];

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 255) {
      const error = new Error('Title must be a non-empty string under 255 characters.');
      error.statusCode = 400;
      error.errorCode = 'VALIDATION_ERROR';
      throw error;
    }
    queryParams.push(title.trim());
    updates.push(`title = $${queryParams.length}`);
    changedFields.push('title');
  }

  if (message !== undefined) {
    if (typeof message !== 'string' || !message.trim() || message.trim().length > 10000) {
      const error = new Error('Message must be a non-empty string under 10000 characters.');
      error.statusCode = 400;
      error.errorCode = 'VALIDATION_ERROR';
      throw error;
    }
    queryParams.push(message.trim());
    updates.push(`message = $${queryParams.length}`);
    changedFields.push('message');
  }

  if (type !== undefined) {
    const normType = String(type).toUpperCase().trim();
    if (!ALLOWED_NOTIFICATION_TYPES.includes(normType)) {
      const error = new Error(`Invalid type. Allowed: ${ALLOWED_NOTIFICATION_TYPES.join(', ')}.`);
      error.statusCode = 400;
      error.errorCode = 'VALIDATION_ERROR';
      throw error;
    }
    queryParams.push(normType);
    updates.push(`type = $${queryParams.length}`);
    changedFields.push('type');
  }

  if (audienceType !== undefined) {
    const normAudience = String(audienceType).toUpperCase().trim();
    if (!ALLOWED_AUDIENCE_TYPES.includes(normAudience)) {
      const error = new Error(`Invalid audienceType. Allowed: ${ALLOWED_AUDIENCE_TYPES.join(', ')}.`);
      error.statusCode = 400;
      error.errorCode = 'VALIDATION_ERROR';
      throw error;
    }
    queryParams.push(normAudience);
    updates.push(`audience_type = $${queryParams.length}`);
    changedFields.push('audienceType');
  }

  if (targetFilters !== undefined) {
    if (targetFilters && targetFilters.selectedUserIds) {
      if (!Array.isArray(targetFilters.selectedUserIds)) {
        const error = new Error('selectedUserIds must be an array of UUIDs.');
        error.statusCode = 400;
        error.errorCode = 'VALIDATION_ERROR';
        throw error;
      }
      for (const uid of targetFilters.selectedUserIds) {
        if (!isValidUUID(uid)) {
          const error = new Error(`Invalid recipient user UUID: ${uid}`);
          error.statusCode = 400;
          error.errorCode = 'INVALID_UUID';
          throw error;
        }
      }
    }
    queryParams.push(JSON.stringify(targetFilters || {}));
    updates.push(`target_filters = $${queryParams.length}`);
    changedFields.push('targetFilters');
  }

  if (updates.length === 0) {
    return await getNotificationById(id);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const updateQuery = `
    UPDATE announcements
    SET ${updates.join(', ')}
    WHERE id = $1
    RETURNING *;
  `;

  await db.query(updateQuery, queryParams);

  // Log Audit Action
  await logAdminAction({
    adminUserId,
    action: AUDIT_ACTIONS.NOTIFICATION_UPDATED,
    targetEntity: 'ANNOUNCEMENT',
    targetId: id,
    details: {
      announcementId: id,
      changedFields,
      title: title !== undefined ? title.trim() : existing.title,
    },
  });

  return await getNotificationById(id);
};

/**
 * Publishes an announcement atomically, generating recipient rows and in-app notifications
 */
const publishNotification = async (adminUserId, id) => {
  if (!isValidUUID(id)) {
    const error = new Error('Invalid announcement ID format. Expected UUID.');
    error.statusCode = 400;
    error.errorCode = 'INVALID_UUID';
    throw error;
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const lockQuery = `SELECT * FROM announcements WHERE id = $1 FOR UPDATE`;
    const lockRes = await client.query(lockQuery, [id]);

    if (lockRes.rows.length === 0) {
      const error = new Error(`Announcement not found with ID: ${id}`);
      error.statusCode = 404;
      error.errorCode = 'NOTIFICATION_NOT_FOUND';
      throw error;
    }

    const announcement = lockRes.rows[0];

    // State machine check
    if (announcement.status === 'PUBLISHED') {
      const error = new Error('Announcement is already published.');
      error.statusCode = 409;
      error.errorCode = 'ALREADY_PUBLISHED';
      throw error;
    }

    if (announcement.status === 'CANCELLED') {
      const error = new Error('Cannot publish a cancelled announcement.');
      error.statusCode = 409;
      error.errorCode = 'CANNOT_PUBLISH_CANCELLED';
      throw error;
    }

    // 1. Build audience query for announcement_recipients ($1 is announcement_id)
    const { whereSql: recipWhereSql, queryParams: recipParams } = buildAudienceWhereClause(
      announcement.audience_type,
      announcement.target_filters,
      1
    );

    // 2. Set-based bulk insert into announcement_recipients
    const bulkInsertQuery = `
      INSERT INTO announcement_recipients (announcement_id, user_id, is_read)
      SELECT $1::uuid, u.id, FALSE
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ${recipWhereSql}
      ON CONFLICT (announcement_id, user_id) DO NOTHING;
    `;

    await client.query(bulkInsertQuery, [id, ...recipParams]);

    // 3. Bulk insert into in-app notifications table ($1 is type, $2 is title, $3 is message)
    const { whereSql: notifWhereSql, queryParams: notifParams } = buildAudienceWhereClause(
      announcement.audience_type,
      announcement.target_filters,
      3
    );

    const notifInsertQuery = `
      INSERT INTO notifications (recipient_id, user_id, type, title, message, actor_name)
      SELECT u.id, u.id, $1::varchar, $2::varchar, $3::text, 'Dean of Alumni Relations'
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ${notifWhereSql};
    `;
    await client.query(notifInsertQuery, [announcement.type || 'SYSTEM', announcement.title, announcement.message, ...notifParams]);

    // 4. Update announcement status to PUBLISHED
    const updateAnnQuery = `
      UPDATE announcements
      SET 
          status = 'PUBLISHED',
          published_by = $2,
          published_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    await client.query(updateAnnQuery, [id, adminUserId]);

    // 5. Count generated recipients
    const countRes = await client.query(
      `SELECT COUNT(*) AS total FROM announcement_recipients WHERE announcement_id = $1`,
      [id]
    );
    const recipientCount = parseInt(countRes.rows[0]?.total, 10) || 0;

    // 6. Log Audit Action
    await logAdminAction({
      client,
      adminUserId,
      action: AUDIT_ACTIONS.NOTIFICATION_PUBLISHED,
      targetEntity: 'ANNOUNCEMENT',
      targetId: id,
      details: {
        announcementId: id,
        title: announcement.title,
        audienceType: announcement.audience_type,
        recipientCount,
      },
    });

    await client.query('COMMIT');

    return await getNotificationById(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Cancels a draft announcement
 */
const cancelNotification = async (adminUserId, id) => {
  if (!isValidUUID(id)) {
    const error = new Error('Invalid announcement ID format. Expected UUID.');
    error.statusCode = 400;
    error.errorCode = 'INVALID_UUID';
    throw error;
  }

  const existingRes = await db.query(`SELECT id, status, title FROM announcements WHERE id = $1`, [id]);
  if (existingRes.rows.length === 0) {
    const error = new Error(`Announcement not found with ID: ${id}`);
    error.statusCode = 404;
    error.errorCode = 'NOTIFICATION_NOT_FOUND';
    throw error;
  }

  const existing = existingRes.rows[0];
  if (existing.status !== 'DRAFT') {
    const error = new Error(`Cannot cancel announcement in '${existing.status}' status. Only DRAFT announcements may be cancelled.`);
    error.statusCode = 409;
    error.errorCode = 'INVALID_STATE_TRANSITION';
    throw error;
  }

  await db.query(
    `UPDATE announcements SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [id]
  );

  // Log Audit Action
  await logAdminAction({
    adminUserId,
    action: AUDIT_ACTIONS.NOTIFICATION_CANCELLED,
    targetEntity: 'ANNOUNCEMENT',
    targetId: id,
    details: {
      announcementId: id,
      title: existing.title,
      previousStatus: existing.status,
      newStatus: 'CANCELLED',
    },
  });

  return await getNotificationById(id);
};

/**
 * Deletes an announcement (only DRAFT or CANCELLED)
 */
const deleteNotification = async (adminUserId, id) => {
  if (!isValidUUID(id)) {
    const error = new Error('Invalid announcement ID format. Expected UUID.');
    error.statusCode = 400;
    error.errorCode = 'INVALID_UUID';
    throw error;
  }

  const existingRes = await db.query(`SELECT id, status, title FROM announcements WHERE id = $1`, [id]);
  if (existingRes.rows.length === 0) {
    const error = new Error(`Announcement not found with ID: ${id}`);
    error.statusCode = 404;
    error.errorCode = 'NOTIFICATION_NOT_FOUND';
    throw error;
  }

  const existing = existingRes.rows[0];
  if (existing.status === 'PUBLISHED') {
    const error = new Error('Cannot delete a PUBLISHED announcement. Preserved for delivery and audit integrity.');
    error.statusCode = 409;
    error.errorCode = 'CANNOT_DELETE_PUBLISHED';
    throw error;
  }

  await db.query(`DELETE FROM announcements WHERE id = $1`, [id]);

  return { success: true, message: `Announcement '${existing.title}' deleted successfully.` };
};

module.exports = {
  getNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  publishNotification,
  cancelNotification,
  deleteNotification,
  getAudienceCount,
  isValidUUID,
};
