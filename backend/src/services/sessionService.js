const crypto = require('crypto');
const db = require('../config/db');
const { logAdminAction } = require('./adminAuditService');

// Default 10 days (864,000,000 ms)
const getSessionMaxLifetimeMs = () => {
  if (process.env.TEST_SESSION_MAX_LIFETIME_MS) {
    const parsed = parseInt(process.env.TEST_SESSION_MAX_LIFETIME_MS, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 10 * 24 * 60 * 60 * 1000;
};

/**
 * SHA-256 Hash helper for raw refresh token strings
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(String(token || '').trim()).digest('hex');
};

/**
 * Simple user agent parser for session management UI
 */
const parseUserAgent = (uaInput) => {
  const uaString = String(uaInput || '');
  let browser = 'Unknown Browser';
  if (uaString.includes('Firefox')) browser = 'Firefox';
  else if (uaString.includes('Edg')) browser = 'Edge';
  else if (uaString.includes('Chrome')) browser = 'Chrome';
  else if (uaString.includes('Safari')) browser = 'Safari';

  let os = 'Unknown OS';
  if (uaString.includes('Windows')) os = 'Windows';
  else if (uaString.includes('Macintosh') || uaString.includes('Mac OS')) os = 'macOS';
  else if (uaString.includes('Android')) os = 'Android';
  else if (uaString.includes('iPhone') || uaString.includes('iPad')) os = 'iOS';
  else if (uaString.includes('Linux')) os = 'Linux';

  return `${browser} on ${os}`;
};

/**
 * Creates a server-side session with an absolute 10-day lifetime
 */
const createSession = async ({ userId, ipAddress = null, userAgent = null }) => {
  const rawRefreshToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawRefreshToken);
  const maxLifetimeMs = getSessionMaxLifetimeMs();
  const expiresAt = new Date(Date.now() + maxLifetimeMs);
  const sessionId = crypto.randomUUID();

  const query = `
    INSERT INTO auth_sessions (
      id, user_id, refresh_token_hash, created_at, expires_at, last_used_at, ip_address, user_agent
    )
    VALUES ($1, $2, $3, NOW(), $4, NOW(), $5, $6)
    RETURNING *;
  `;

  const result = await db.query(query, [sessionId, userId, tokenHash, expiresAt, ipAddress, userAgent]);
  const session = result.rows[0];

  // Log audit event
  await logAdminAction({
    adminUserId: userId,
    actorName: null,
    action: 'SESSION_CREATED',
    targetEntity: 'AUTH_SESSION',
    targetId: session.id,
    details: { expiresAt: session.expires_at, ipAddress, userAgent },
  }).catch(() => {});

  return {
    rawRefreshToken,
    session,
  };
};

/**
 * Refreshes an active session by validating and rotating the refresh token.
 * Maintains strict 10-day absolute expiration cap without extending expires_at.
 */
const refreshSession = async ({ rawRefreshToken, ipAddress = null, userAgent = null }) => {
  if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
    const err = new Error('Refresh token is required');
    err.statusCode = 401;
    err.errorCode = 'MISSING_REFRESH_TOKEN';
    throw err;
  }

  const tokenHash = hashToken(rawRefreshToken);

  // Search for matching token hash in auth_sessions
  const sessionRes = await db.query(
    `SELECT s.*, u.role, u.account_status, u.email
     FROM auth_sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.refresh_token_hash = $1 OR s.prev_refresh_token_hash = $1`,
    [tokenHash]
  );

  if (sessionRes.rows.length === 0) {
    const err = new Error('Invalid or non-existent refresh session');
    err.statusCode = 401;
    err.errorCode = 'INVALID_REFRESH_TOKEN';
    throw err;
  }

  const session = sessionRes.rows[0];

  // Token Reuse Detection Safeguard:
  // If session is revoked OR the presented token matches prev_refresh_token_hash, treat as token reuse attack!
  const isTokenReused = session.revoked_at || session.prev_refresh_token_hash === tokenHash;
  if (isTokenReused) {
    console.warn(`[SECURITY ALERT] Reused rotated/revoked refresh token for user ${session.user_id}! Revoking all sessions.`);
    
    // Revoke all active sessions for this user
    await db.query(
      `UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [session.user_id]
    );

    // Audit log security violation
    await logAdminAction({
      adminUserId: session.user_id,
      action: 'REFRESH_TOKEN_REUSE',
      targetEntity: 'AUTH_SESSION',
      targetId: session.id,
      details: {
        securityNotice: 'Attempted reuse of a rotated/revoked refresh token. All user sessions revoked.',
        ipAddress,
        userAgent,
      },
    }).catch(() => {});

    const err = new Error('Security violation: Attempted reuse of an invalid refresh token. All active sessions have been revoked for safety.');
    err.statusCode = 401;
    err.errorCode = 'REFRESH_TOKEN_REUSE';
    throw err;
  }

  // Check 10-day absolute expiration
  const now = new Date();
  if (new Date(session.expires_at) <= now) {
    await db.query(`UPDATE auth_sessions SET revoked_at = NOW() WHERE id = $1`, [session.id]);
    
    await logAdminAction({
      adminUserId: session.user_id,
      action: 'SESSION_EXPIRED',
      targetEntity: 'AUTH_SESSION',
      targetId: session.id,
      details: { expiresAt: session.expires_at },
    }).catch(() => {});

    const err = new Error('Your session has expired after reaching its maximum lifetime of 10 days. Please log in again.');
    err.statusCode = 401;
    err.errorCode = 'SESSION_EXPIRED';
    throw err;
  }

  // Check account status
  if (session.account_status !== 'ACTIVE') {
    await db.query(`UPDATE auth_sessions SET revoked_at = NOW() WHERE id = $1`, [session.id]);
    
    const err = new Error('Account is disabled or suspended');
    err.statusCode = 401;
    err.errorCode = 'ACCOUNT_DISABLED';
    throw err;
  }

  // Rotate Refresh Token: generate new raw token & hash
  const newRawRefreshToken = crypto.randomBytes(32).toString('hex');
  const newTokenHash = hashToken(newRawRefreshToken);

  // Update session row: save previous token hash, set new token hash & rotated_at (expires_at remains unchanged!)
  await db.query(
    `UPDATE auth_sessions
     SET prev_refresh_token_hash = refresh_token_hash,
         refresh_token_hash = $1,
         rotated_at = NOW(),
         last_used_at = NOW(),
         ip_address = COALESCE($2, ip_address),
         user_agent = COALESCE($3, user_agent)
     WHERE id = $4`,
    [newTokenHash, ipAddress, userAgent, session.id]
  );

  // Log session refreshed event
  await logAdminAction({
    adminUserId: session.user_id,
    action: 'SESSION_REFRESHED',
    targetEntity: 'AUTH_SESSION',
    targetId: session.id,
    details: { ipAddress, userAgent },
  }).catch(() => {});

  return {
    newRawRefreshToken,
    session: {
      ...session,
      last_used_at: new Date(),
    },
    user: {
      id: session.user_id,
      email: session.email,
      role: session.role,
    },
  };
};

/**
 * Revokes a single session by session ID
 */
const revokeSession = async (sessionId, userId = null) => {
  const result = await db.query(
    `UPDATE auth_sessions SET revoked_at = NOW() WHERE id = $1 ${userId ? 'AND user_id = $2' : ''} RETURNING *`,
    userId ? [sessionId, userId] : [sessionId]
  );

  if (result.rows.length > 0) {
    const s = result.rows[0];
    await logAdminAction({
      adminUserId: s.user_id,
      action: 'SESSION_REVOKED',
      targetEntity: 'AUTH_SESSION',
      targetId: s.id,
      details: { revokedAt: s.revoked_at },
    }).catch(() => {});
  }

  return result.rows[0] || null;
};

/**
 * Revokes all active sessions belonging to a specific user (logout-all, password change, deactivation)
 */
const revokeAllUserSessions = async (userId, reason = 'LOGOUT_ALL') => {
  const result = await db.query(
    `UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL RETURNING id`,
    [userId]
  );

  await logAdminAction({
    adminUserId: userId,
    action: 'LOGOUT_ALL',
    targetEntity: 'USER_SESSIONS',
    targetId: userId,
    details: { revokedCount: result.rows.length, reason },
  }).catch(() => {});

  return result.rows.length;
};

/**
 * Fetches user's active sessions for Session Management UI
 */
const getUserSessions = async (userId, currentRefreshToken = null) => {
  const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;
  const result = await db.query(
    `SELECT id, created_at, expires_at, last_used_at, ip_address, user_agent, refresh_token_hash
     FROM auth_sessions
     WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
     ORDER BY last_used_at DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    device: parseUserAgent(row.user_agent),
    ipAddress: row.ip_address || '127.0.0.1',
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    lastUsedAt: row.last_used_at,
    isCurrent: currentHash ? row.refresh_token_hash === currentHash : false,
  }));
};

/**
 * Gets session details for /api/v1/auth/session endpoint
 */
const getSessionDetails = async (userId, rawRefreshToken = null) => {
  if (!rawRefreshToken) {
    const res = await db.query(
      `SELECT expires_at FROM auth_sessions WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1`,
      [userId]
    );
    return res.rows[0] ? { expiresAt: res.rows[0].expires_at } : null;
  }

  const tokenHash = hashToken(rawRefreshToken);
  const res = await db.query(
    `SELECT id, created_at, expires_at, last_used_at FROM auth_sessions WHERE refresh_token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );
  return res.rows[0] ? { id: res.rows[0].id, expiresAt: res.rows[0].expires_at, createdAt: res.rows[0].created_at } : null;
};

module.exports = {
  createSession,
  refreshSession,
  revokeSession,
  revokeAllUserSessions,
  getUserSessions,
  getSessionDetails,
  hashToken,
};
