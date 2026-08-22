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

const isBlockedPair = async (userAId, userBId) => {
  if (!userAId || !userBId) return false;
  const res = await db.query(
    `SELECT 1 FROM user_blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1) LIMIT 1`,
    [userAId, userBId]
  ).catch(() => ({ rows: [] }));
  return res.rows.length > 0;
};

const safeEmitToUser = (userId, event, payload) => {
  try {
    const { emitToUser } = require('../socket/socketServer');
    emitToUser(userId, event, payload);
  } catch (err) {
    // Non-blocking socket error catch
  }
};

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

  if (await isBlockedPair(user.id, targetUserId)) {
    const err = new Error('Cannot connect to this user due to block settings');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  if (!isUUID(targetUserId)) {
    return {
      id: `conn_${Date.now()}`,
      status: 'PENDING_SENT',
      statusNormalized: 'PENDING_SENT',
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
    try {
      const connId = crypto.randomUUID();
      const created = await db.query(
        `INSERT INTO connections (id, requester_id, receiver_id, status)
         VALUES ($1, $2, $3, 'PENDING') RETURNING *`,
        [connId, user.id, targetUserId]
      );
      createdConnId = created.rows[0].id;
    } catch (dbErr) {
      if (dbErr.code === '23505') {
        const raceConn = await findConnectionByPairOrId(user, targetUserId);
        if (raceConn) {
          if (raceConn.status === 'ACCEPTED') {
            const err = new Error('You are already connected with this user');
            err.statusCode = 409;
            err.errorCode = 'CONFLICT';
            throw err;
          }
          if (raceConn.status === 'PENDING') {
            const err = new Error('Connection request already exists');
            err.statusCode = 409;
            err.errorCode = 'CONFLICT';
            throw err;
          }
        }
      }
      throw dbErr;
    }
  }

  // Trigger Notification & Socket Events
  const senderName = await getUserName(user.id);
  const senderProfileRes = await db.query(
    `SELECT u.email, u.role, p.full_name, p.avatar_url, p.degree, p.branch, p.graduation_year, p.company, p.designation, p.location
     FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1`,
    [user.id]
  ).catch(() => ({ rows: [] }));
  const senderRow = senderProfileRes.rows[0] || {};
  const senderCard = formatUserCard({ user_id: user.id, ...senderRow });

  await notificationService.createNotification({
    recipientId: targetUserId,
    actorId: user.id,
    type: 'CONNECTION_REQUEST',
    title: 'New connection request',
    message: `${senderName} sent you a connection request`,
    entityType: 'CONNECTION',
    entityId: createdConnId,
  });

  // Emit Socket.IO real-time connection events
  safeEmitToUser(targetUserId, 'connection:request_received', {
    connectionId: createdConnId,
    requestId: createdConnId,
    fromUserId: user.id,
    requester: senderCard,
    user: senderCard,
    status: 'PENDING_RECEIVED',
    direction: 'INCOMING',
    message: `${senderName} sent you a connection request`,
  });

  safeEmitToUser(user.id, 'connection:request_sent', {
    connectionId: createdConnId,
    requestId: createdConnId,
    targetUserId,
    status: 'PENDING_SENT',
    direction: 'OUTGOING',
  });

  return {
    connectionId: createdConnId,
    status: 'PENDING_SENT',
    statusNormalized: 'PENDING_SENT',
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
  const receiverProfileRes = await db.query(
    `SELECT u.email, u.role, p.full_name, p.avatar_url, p.degree, p.branch, p.graduation_year, p.company, p.designation, p.location
     FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1`,
    [user.id]
  ).catch(() => ({ rows: [] }));
  const receiverCard = formatUserCard({ user_id: user.id, ...(receiverProfileRes.rows[0] || {}) });

  await notificationService.createNotification({
    recipientId: connection.requester_id,
    actorId: user.id,
    type: 'CONNECTION_ACCEPTED',
    title: 'Connection request accepted',
    message: `${receiverName} accepted your connection request`,
    entityType: 'CONNECTION',
    entityId: connection.id,
  });

  // Emit Socket.IO real-time accepted events to both requester and receiver
  safeEmitToUser(connection.requester_id, 'connection:accepted', {
    connectionId: connection.id,
    partnerId: user.id,
    partner: receiverCard,
    status: 'CONNECTED',
    statusNormalized: 'CONNECTED',
    message: `${receiverName} accepted your connection request`,
  });

  safeEmitToUser(user.id, 'connection:accepted', {
    connectionId: connection.id,
    partnerId: connection.requester_id,
    status: 'CONNECTED',
    statusNormalized: 'CONNECTED',
  });

  return {
    connection: updated.rows[0],
    connectionId: updated.rows[0].id,
    status: 'CONNECTED',
    statusNormalized: 'CONNECTED',
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

  // Emit Socket.IO real-time rejected events
  safeEmitToUser(connection.requester_id, 'connection:rejected', {
    connectionId: connection.id,
    partnerId: user.id,
    status: 'NONE',
    statusNormalized: 'NONE',
    message: `${receiverName} declined your connection request`,
  });

  safeEmitToUser(user.id, 'connection:rejected', {
    connectionId: connection.id,
    partnerId: connection.requester_id,
    status: 'NONE',
    statusNormalized: 'NONE',
  });

  return {
    connection: updated.rows[0],
    connectionId: updated.rows[0].id,
    status: 'NONE',
    statusNormalized: 'NONE',
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

  // Emit Socket.IO cancelled events
  safeEmitToUser(connection.receiver_id, 'connection:cancelled', {
    connectionId: connection.id,
    partnerId: user.id,
    status: 'NONE',
    statusNormalized: 'NONE',
  });

  safeEmitToUser(user.id, 'connection:cancelled', {
    connectionId: connection.id,
    partnerId: connection.receiver_id,
    status: 'NONE',
    statusNormalized: 'NONE',
  });

  return {
    connection: updated.rows[0],
    connectionId: updated.rows[0].id,
    status: 'NONE',
    statusNormalized: 'NONE',
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

  const partnerId = connection.requester_id === user.id ? connection.receiver_id : connection.requester_id;

  // Emit Socket.IO removed events to both users
  safeEmitToUser(partnerId, 'connection:removed', {
    connectionId: connection.id,
    partnerId: user.id,
    status: 'NONE',
    statusNormalized: 'NONE',
  });

  safeEmitToUser(user.id, 'connection:removed', {
    connectionId: connection.id,
    partnerId: partnerId,
    status: 'NONE',
    statusNormalized: 'NONE',
  });

  return {
    connection: updated.rows[0],
    connectionId: updated.rows[0].id,
    status: 'NONE',
    statusNormalized: 'NONE',
  };
};

const getConnectionStatus = async (user, targetUserId) => {
  if (!targetUserId) return { status: 'NONE', statusNormalized: 'NONE', connectionId: null };

  if (user.id === targetUserId) {
    return { status: 'SELF', statusNormalized: 'SELF', connectionId: null };
  }

  if (await isBlockedPair(user.id, targetUserId)) {
    return { status: 'BLOCKED', statusNormalized: 'BLOCKED', connectionId: null };
  }

  const connection = await findConnectionByPairOrId(user, targetUserId);

  if (!connection || connection.status === 'DECLINED' || connection.status === 'CANCELLED') {
    return { status: 'NONE', statusNormalized: 'NONE', connectionId: connection ? connection.id : null };
  }

  if (connection.status === 'ACCEPTED') {
    return { status: 'CONNECTED', statusNormalized: 'CONNECTED', connectionId: connection.id };
  }

  if (connection.status === 'PENDING') {
    if (connection.requester_id === user.id) {
      return { status: 'PENDING_SENT', statusNormalized: 'PENDING_SENT', connectionId: connection.id, direction: 'OUTGOING' };
    } else {
      return { status: 'PENDING_RECEIVED', statusNormalized: 'PENDING_RECEIVED', connectionId: connection.id, direction: 'INCOMING' };
    }
  }

  return { status: 'NONE', statusNormalized: 'NONE', connectionId: null };
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

  const requests = result.rows.map((row) => {
    const userCard = formatUserCard(row);
    userCard.mutualCount = 0;
    userCard.mutualConnectionsCount = 0;

    return {
      id: row.request_id,
      requestId: row.request_id,
      fromUserId: row.user_id,
      user: userCard,
      requestedAt: row.requested_at,
      fromUser: userCard,
      mutualCount: 0,
      mutualConnectionsCount: 0,
    };
  });

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
    WITH user_conns AS (
      SELECT receiver_id AS friend_id, id AS connection_id, updated_at AS connected_at
      FROM connections
      WHERE requester_id = $1 AND status = 'ACCEPTED'
      UNION ALL
      SELECT requester_id AS friend_id, id AS connection_id, updated_at AS connected_at
      FROM connections
      WHERE receiver_id = $1 AND status = 'ACCEPTED'
    )
    SELECT uc.connection_id, uc.connected_at,
           u.id AS user_id, u.email, u.role, p.full_name, p.avatar_url,
           p.degree, p.branch, p.graduation_year, p.company, p.designation, p.location
    FROM user_conns uc
    JOIN users u ON uc.friend_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ORDER BY uc.connected_at DESC;
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
     WHERE (requester_id = $1 OR receiver_id = $1) AND status = 'ACCEPTED'`,
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

  values.push(limit, offset);
  const limitIdx = paramIdx;
  const offsetIdx = paramIdx + 1;

  const dataQuery = `
    WITH user_conns AS (
      SELECT receiver_id AS friend_id, id AS connection_id, updated_at AS connected_at
      FROM connections
      WHERE requester_id = $1 AND status = 'ACCEPTED'
      UNION ALL
      SELECT requester_id AS friend_id, id AS connection_id, updated_at AS connected_at
      FROM connections
      WHERE receiver_id = $1 AND status = 'ACCEPTED'
    )
    SELECT uc.connection_id, uc.connected_at,
           u.id AS user_id, u.email, u.role, p.full_name, p.avatar_url,
           p.degree, p.branch, p.graduation_year, p.company, p.designation, p.location,
           COUNT(*) OVER() AS total_count
    FROM user_conns uc
    JOIN users u ON uc.friend_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE u.account_status != 'DISABLED'
      ${searchClause}
    ORDER BY uc.connected_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx};
  `;

  const dataRes = await db.query(dataQuery, values);
  const total = dataRes.rows.length > 0 ? parseInt(dataRes.rows[0].total_count, 10) : 0;

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

const getMutualConnectionsCount = async (userAId, userBId) => {
  if (!userAId || !userBId || userAId === userBId) return 0;
  try {
    const res = await db.query(
      `SELECT COUNT(*) AS mutual_count
       FROM (
         SELECT receiver_id AS friend_id FROM connections WHERE requester_id = $1 AND status = 'ACCEPTED'
         UNION ALL
         SELECT requester_id AS friend_id FROM connections WHERE receiver_id = $1 AND status = 'ACCEPTED'
       ) a
       JOIN (
         SELECT receiver_id AS friend_id FROM connections WHERE requester_id = $2 AND status = 'ACCEPTED'
         UNION ALL
         SELECT requester_id AS friend_id FROM connections WHERE receiver_id = $2 AND status = 'ACCEPTED'
       ) b ON a.friend_id = b.friend_id
       WHERE a.friend_id != $1 AND a.friend_id != $2`,
      [userAId, userBId]
    );
    return parseInt(res.rows[0]?.mutual_count || '0', 10);
  } catch {
    return 0;
  }
};

const getSuggestions = async (user, queryParams = {}) => {
  const limit = Math.min(20, Math.max(1, parseInt(queryParams.limit || 6, 10)));
  
  const selfProfileRes = await db.query(
    `SELECT branch, graduation_year, degree FROM user_profiles WHERE user_id = $1`,
    [user.id]
  ).catch(() => ({ rows: [] }));
  
  const selfProfile = selfProfileRes.rows[0] || {};
  const selfBranch = (selfProfile.branch || '').toLowerCase();
  const selfGradYear = selfProfile.graduation_year || 0;

  const query = `
    SELECT u.id AS user_id, u.email, u.role, p.full_name, p.avatar_url,
           p.degree, p.branch, p.graduation_year, p.company, p.designation, p.location,
           (
             CASE
               WHEN LOWER(COALESCE(p.branch, '')) = $2 AND $2 != '' THEN 3
               ELSE 0
             END +
             CASE
               WHEN p.graduation_year = $3 AND $3 > 0 THEN 2
               ELSE 0
             END
           ) AS relevance_score
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE u.id != $1
      AND UPPER(u.role) != 'ADMIN'
      AND u.account_status = 'ACTIVE'
      AND NOT EXISTS (
        SELECT 1 FROM connections c
        WHERE ((c.requester_id = $1 AND c.receiver_id = u.id) OR (c.receiver_id = $1 AND c.requester_id = u.id))
          AND UPPER(c.status) IN ('ACCEPTED', 'PENDING')
      )
      AND NOT EXISTS (
        SELECT 1 FROM user_blocks ub
        WHERE (ub.blocker_id = $1 AND ub.blocked_id = u.id) OR (ub.blocker_id = u.id AND ub.blocked_id = $1)
      )
    ORDER BY relevance_score DESC, u.created_at DESC
    LIMIT $4;
  `;

  const res = await db.query(query, [user.id, selfBranch, selfGradYear, limit]);

  const suggestions = res.rows.map((row) => {
    const userCard = formatUserCard(row);
    return {
      id: row.user_id,
      userId: row.user_id,
      name: userCard.name,
      fullName: userCard.fullName,
      email: userCard.email,
      role: userCard.role,
      avatar: userCard.avatar,
      avatarUrl: userCard.avatarUrl,
      headline: userCard.currentRole ? `${userCard.currentRole}${userCard.company ? ` @ ${userCard.company}` : ''}` : (userCard.degree ? `${userCard.degree} ${userCard.branch || ''}` : 'JECRC Member'),
      company: userCard.company,
      designation: userCard.designation,
      branch: userCard.branch,
      graduationYear: userCard.graduationYear,
      batch: userCard.batch,
      isAlumni: userCard.isAlumni,
      connectionStatus: 'none',
      mutualCount: 0,
      mutualConnectionsCount: 0,
    };
  });

  return { suggestions, total: suggestions.length };
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
  getSuggestions,
  getMutualConnectionsCount,
};
