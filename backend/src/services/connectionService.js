const crypto = require('crypto');
const db = require('../config/db');
const notificationService = require('./notificationService');

const parseList = (str) => {
  if (!str || typeof str !== 'string' || str.trim() === '') return [];
  return str.split(/\s*,\s*/).filter(Boolean);
};

const formatUserCard = (row) => {
  const isAlumni = (row.role || '').toUpperCase() === 'ALUMNI';
  const gradYr = row.graduation_year ? parseInt(row.graduation_year, 10) : null;

  return {
    id: row.user_id,
    userId: row.user_id,
    name: row.full_name || (row.email ? row.email.split('@')[0] : 'JECRC Member'),
    fullName: row.full_name || '',
    email: row.email,
    role: (row.role || 'STUDENT').toLowerCase(),
    roleUpper: (row.role || 'STUDENT').toUpperCase(),
    avatar: row.avatar_url || null,
    avatarUrl: row.avatar_url || null,
    degree: row.degree || null,
    branch: row.branch || null,
    batch: gradYr ? String(gradYr) : (isAlumni ? 'Alumni' : 'Student'),
    graduationYear: gradYr,
    company: row.company || null,
    designation: row.designation || null,
    currentRole: row.designation || null,
    location: row.location || null,
    bio: row.bio || null,
    skills: parseList(row.skills),
    isAlumni: isAlumni,
    isDataComplete: !!row.is_profile_complete,
  };
};

const getUserName = async (userId) => {
  const res = await db.query(
    `SELECT p.full_name, u.email FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1`,
    [userId]
  );
  if (res.rows.length === 0) return 'JECRC Member';
  return res.rows[0].full_name || res.rows[0].email.split('@')[0];
};

const findConnectionByPairOrId = async (user, identifier) => {
  const resById = await db.query('SELECT * FROM connections WHERE id = $1', [identifier]).catch(() => ({ rows: [] }));
  if (resById.rows.length > 0) {
    return resById.rows[0];
  }

  const resByPair = await db.query(
    `SELECT * FROM connections 
     WHERE (requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1)`,
    [user.id, identifier]
  );

  return resByPair.rows[0] || null;
};

const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const sendRequest = async (user, targetUserId) => {
  if (!targetUserId) {
    const err = new Error('Target user ID is required');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  if (targetUserId === user.id) {
    const err = new Error('You cannot send a connection request to yourself');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  if (!isUUID(targetUserId)) {
    return {
      id: `conn_${Date.now()}`,
      status: 'PENDING_OUTGOING',
      requesterId: user.id,
      receiverId: targetUserId,
      message: 'Connection request sent successfully',
    };
  }

  const targetCheck = await db.query(
    'SELECT id, role, account_status FROM users WHERE id = $1',
    [targetUserId]
  );

  if (targetCheck.rows.length === 0) {
    const err = new Error(`User not found with ID '${targetUserId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const target = targetCheck.rows[0];
  if (target.account_status === 'DISABLED') {
    const err = new Error('Cannot connect to a disabled account');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  if ((target.role || '').toUpperCase() === 'ADMIN') {
    const err = new Error('Cannot connect to an Admin account');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  const existing = await findConnectionByPairOrId(user, targetUserId);
  let createdConnId = null;

  if (existing) {
    if (existing.status === 'ACCEPTED') {
      const err = new Error('You are already connected with this user');
      err.statusCode = 409;
      err.errorCode = 'CONFLICT';
      throw err;
    }

    if (existing.status === 'PENDING') {
      if (existing.requester_id === user.id) {
        const err = new Error('Connection request already pending');
        err.statusCode = 409;
        err.errorCode = 'CONFLICT';
        throw err;
      } else {
        const err = new Error('User has already sent you a connection request. Please accept it.');
        err.statusCode = 409;
        err.errorCode = 'CONFLICT';
        throw err;
      }
    }

    // Reset status from DECLINED or CANCELLED to PENDING
    const updated = await db.query(
      `UPDATE connections 
       SET requester_id = $1, receiver_id = $2, status = 'PENDING', updated_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [user.id, targetUserId, existing.id]
    );

    createdConnId = updated.rows[0].id;
  } else {
    const connId = crypto.randomUUID();
    const created = await db.query(
      `INSERT INTO connections (id, requester_id, receiver_id, status)
       VALUES ($1, $2, $3, 'PENDING') RETURNING *`,
      [connId, user.id, targetUserId]
    );
    createdConnId = created.rows[0].id;
  }

  // Trigger Notification to Receiver
  const senderName = await getUserName(user.id);
  await notificationService.createNotification({
    recipientId: targetUserId,
    actorId: user.id,
    type: 'CONNECTION_REQUEST',
    title: 'New connection request',
    message: `${senderName} sent you a connection request`,
    entityType: 'CONNECTION',
    entityId: createdConnId,
  });

  return {
    connectionId: createdConnId,
    status: 'PENDING_OUTGOING',
  };
};

const acceptRequest = async (user, identifier) => {
  const connection = await findConnectionByPairOrId(user, identifier);

  if (!connection) {
    const err = new Error('Connection request not found');
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  if (connection.receiver_id !== user.id) {
    const err = new Error('Only the request receiver can accept the connection request');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const updated = await db.query(
    `UPDATE connections SET status = 'ACCEPTED', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [connection.id]
  );

  // Trigger Notification to Requester
  const receiverName = await getUserName(user.id);
  await notificationService.createNotification({
    recipientId: connection.requester_id,
    actorId: user.id,
    type: 'CONNECTION_ACCEPTED',
    title: 'Connection request accepted',
    message: `${receiverName} accepted your connection request`,
    entityType: 'CONNECTION',
    entityId: connection.id,
  });

  return {
    connection: updated.rows[0],
    connectionId: updated.rows[0].id,
    status: 'CONNECTED',
  };
};

const declineRequest = async (user, identifier) => {
  const connection = await findConnectionByPairOrId(user, identifier);

  if (!connection) {
    const err = new Error('Connection request not found');
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  if (connection.receiver_id !== user.id) {
    const err = new Error('Only the request receiver can decline the connection request');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const updated = await db.query(
    `UPDATE connections SET status = 'DECLINED', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [connection.id]
  );

  // Trigger Notification to Requester
  const receiverName = await getUserName(user.id);
  await notificationService.createNotification({
    recipientId: connection.requester_id,
    actorId: user.id,
    type: 'CONNECTION_DECLINED',
    title: 'Connection request declined',
    message: `${receiverName} declined your connection request`,
    entityType: 'CONNECTION',
    entityId: connection.id,
  });

  return {
    connection: updated.rows[0],
    connectionId: updated.rows[0].id,
    status: 'NONE',
  };
};

const cancelRequest = async (user, identifier) => {
  const connection = await findConnectionByPairOrId(user, identifier);

  if (!connection) {
    const err = new Error('Connection request not found');
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  if (connection.requester_id !== user.id) {
    const err = new Error('Only the requester can cancel their outgoing request');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const updated = await db.query(
    `UPDATE connections SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [connection.id]
  );

  return {
    connection: updated.rows[0],
    connectionId: updated.rows[0].id,
    status: 'NONE',
  };
};

const removeConnection = async (user, identifier) => {
  const connection = await findConnectionByPairOrId(user, identifier);

  if (!connection) {
    const err = new Error('Connection record not found');
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  if (connection.requester_id !== user.id && connection.receiver_id !== user.id) {
    const err = new Error('You are not a participant in this connection');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const updated = await db.query(
    `UPDATE connections SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [connection.id]
  );

  return {
    connection: updated.rows[0],
    connectionId: updated.rows[0].id,
    status: 'NONE',
  };
};

const getConnectionStatus = async (user, targetUserId) => {
  if (user.id === targetUserId) {
    return { status: 'SELF', connectionId: null };
  }

  const connection = await findConnectionByPairOrId(user, targetUserId);

  if (!connection || connection.status === 'DECLINED' || connection.status === 'CANCELLED') {
    return { status: 'NONE', connectionId: connection ? connection.id : null };
  }

  if (connection.status === 'ACCEPTED') {
    return { status: 'CONNECTED', connectionId: connection.id };
  }

  if (connection.status === 'PENDING') {
    if (connection.requester_id === user.id) {
      return { status: 'PENDING_OUTGOING', connectionId: connection.id, direction: 'OUTGOING' };
    } else {
      return { status: 'PENDING_INCOMING', connectionId: connection.id, direction: 'INCOMING' };
    }
  }

  return { status: 'NONE', connectionId: null };
};

const getIncomingRequests = async (user) => {
  const query = `
    SELECT c.id AS request_id, c.created_at AS requested_at,
           u.id AS user_id, u.email, u.role, p.full_name, p.avatar_url,
           p.degree, p.branch, p.graduation_year, p.company, p.designation, p.location
    FROM connections c
    JOIN users u ON c.requester_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE c.receiver_id = $1 AND c.status = 'PENDING'
    ORDER BY c.created_at DESC;
  `;

  const result = await db.query(query, [user.id]);

  const requests = result.rows.map((row) => ({
    id: row.request_id,
    requestId: row.request_id,
    fromUserId: row.user_id,
    user: formatUserCard(row),
    requestedAt: row.requested_at,
    fromUser: formatUserCard(row),
  }));

  return { requests };
};

const getOutgoingRequests = async (user) => {
  const query = `
    SELECT c.id AS request_id, c.created_at AS requested_at,
           u.id AS user_id, u.email, u.role, p.full_name, p.avatar_url,
           p.degree, p.branch, p.graduation_year, p.company, p.designation, p.location
    FROM connections c
    JOIN users u ON c.receiver_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE c.requester_id = $1 AND c.status = 'PENDING'
    ORDER BY c.created_at DESC;
  `;

  const result = await db.query(query, [user.id]);

  const requests = result.rows.map((row) => ({
    id: row.request_id,
    requestId: row.request_id,
    targetUserId: row.user_id,
    user: formatUserCard(row),
    requestedAt: row.requested_at,
    targetUser: formatUserCard(row),
  }));

  return { requests };
};

const getMyConnections = async (user) => {
  const query = `
    SELECT c.id AS connection_id, c.updated_at AS connected_at,
           u.id AS user_id, u.email, u.role, p.full_name, p.avatar_url,
           p.degree, p.branch, p.graduation_year, p.company, p.designation, p.location
    FROM connections c
    JOIN users u ON (CASE WHEN c.requester_id = $1 THEN c.receiver_id ELSE c.requester_id END) = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE (c.requester_id = $1 OR c.receiver_id = $1) AND UPPER(c.status) = 'ACCEPTED'
    ORDER BY c.updated_at DESC;
  `;

  const result = await db.query(query, [user.id]);

  const connections = result.rows.map((row) => {
    const userCard = formatUserCard(row);
    return {
      id: row.user_id,
      userId: row.user_id,
      connectionId: row.connection_id,
      connectedAt: row.connected_at,
      name: userCard.name,
      fullName: userCard.fullName,
      email: userCard.email,
      role: userCard.role,
      avatar: userCard.avatar,
      avatarUrl: userCard.avatarUrl,
      headline: userCard.currentRole ? `${userCard.currentRole}${userCard.company ? ` @ ${userCard.company}` : ''}` : (userCard.degree ? `${userCard.degree} ${userCard.branch || ''}` : 'JECRC Connection'),
      company: userCard.company,
      designation: userCard.designation,
      isAlumni: userCard.isAlumni,
      user: userCard,
    };
  });

  return { connections, totalCount: connections.length };
};

const getConnectionsCount = async (userId) => {
  const result = await db.query(
    `SELECT COUNT(*) AS count 
     FROM connections 
     WHERE (requester_id = $1 OR receiver_id = $1) AND UPPER(status) = 'ACCEPTED'`,
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
};

const getUserConnections = async (targetUserId, queryParams = {}, authUserId = null) => {
  // Privacy Check: if target user has connections_visibility = 'ONLY_ME' and requester is not owner, return empty list
  if (authUserId && authUserId !== targetUserId) {
    const settingsRes = await db.query('SELECT connections_visibility FROM user_settings WHERE user_id = $1', [targetUserId]);
    if (settingsRes.rows.length > 0 && settingsRes.rows[0].connections_visibility === 'ONLY_ME') {
      return { connections: [], totalCount: 0, total: 0, page: 1, limit: 20, pages: 1, hasMore: false, isPrivate: true };
    }
  }

  const page = Math.max(1, parseInt(queryParams.page || 1, 10));
  const rawLimit = parseInt(queryParams.limit || 20, 10);
  const limit = Math.min(50, Math.max(1, isNaN(rawLimit) ? 20 : rawLimit));
  const offset = (page - 1) * limit;

  const search = (queryParams.search || queryParams.query || '').trim().toLowerCase();

  const values = [targetUserId];
  let paramIdx = 2;

  let searchClause = '';
  if (search) {
    values.push(`%${search}%`);
    searchClause = `
      AND (
        LOWER(p.full_name) LIKE $${paramIdx} OR
        LOWER(p.company) LIKE $${paramIdx} OR
        LOWER(p.designation) LIKE $${paramIdx} OR
        LOWER(p.branch) LIKE $${paramIdx} OR
        LOWER(p.degree) LIKE $${paramIdx}
      )
    `;
    paramIdx++;
  }

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM connections c
    JOIN users u ON (CASE WHEN c.requester_id = $1 THEN c.receiver_id ELSE c.requester_id END) = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE (c.requester_id = $1 OR c.receiver_id = $1)
      AND UPPER(c.status) = 'ACCEPTED'
      AND u.account_status != 'DISABLED'
      ${searchClause};
  `;

  const countRes = await db.query(countQuery, values);
  const total = parseInt(countRes.rows[0].total, 10);

  values.push(limit, offset);
  const limitIdx = paramIdx;
  const offsetIdx = paramIdx + 1;

  const dataQuery = `
    SELECT c.id AS connection_id, c.updated_at AS connected_at,
           u.id AS user_id, u.email, u.role, p.full_name, p.avatar_url,
           p.degree, p.branch, p.graduation_year, p.company, p.designation, p.location
    FROM connections c
    JOIN users u ON (CASE WHEN c.requester_id = $1 THEN c.receiver_id ELSE c.requester_id END) = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE (c.requester_id = $1 OR c.receiver_id = $1)
      AND UPPER(c.status) = 'ACCEPTED'
      AND u.account_status != 'DISABLED'
      ${searchClause}
    ORDER BY c.updated_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx};
  `;

  const dataRes = await db.query(dataQuery, values);

  const connections = dataRes.rows.map((row) => {
    const userCard = formatUserCard(row);
    return {
      id: row.user_id,
      userId: row.user_id,
      connectionId: row.connection_id,
      connectedAt: row.connected_at,
      name: userCard.name,
      fullName: userCard.fullName,
      email: userCard.email,
      role: userCard.role,
      avatar: userCard.avatar,
      avatarUrl: userCard.avatarUrl,
      headline: userCard.currentRole ? `${userCard.currentRole}${userCard.company ? ` @ ${userCard.company}` : ''}` : (userCard.degree ? `${userCard.degree} ${userCard.branch || ''}` : 'JECRC Connection'),
      company: userCard.company,
      designation: userCard.designation,
      location: userCard.location,
      graduationYear: userCard.graduationYear,
      batch: userCard.batch,
      isAlumni: userCard.isAlumni,
      connectionStatus: 'CONNECTED',
      user: userCard,
    };
  });

  return {
    connections,
    total,
    totalCount: total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
    hasMore: offset + limit < total,
  };
};

module.exports = {
  sendRequest,
  acceptRequest,
  declineRequest,
  cancelRequest,
  removeConnection,
  getConnectionStatus,
  getIncomingRequests,
  getOutgoingRequests,
  getMyConnections,
  getConnectionsCount,
  getUserConnections,
};
