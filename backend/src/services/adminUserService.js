const db = require('../config/db');
const { logAdminAction, AUDIT_ACTIONS } = require('./adminAuditService');

const parseList = (str) => {
  if (!str || typeof str !== 'string' || str.trim() === '') return [];
  return str.split(/\s*,\s*/).filter(Boolean);
};

const formatAdminUserSummary = (row) => {
  const roleFormatted = row.role === 'ALUMNI' ? 'Alumni' : (row.role === 'STUDENT' ? 'Student' : 'Admin');
  const daysAgo = row.last_updated_days_ago !== null ? Math.max(0, parseInt(row.last_updated_days_ago, 10)) : 0;
  
  let profileStatus = 'Incomplete';
  if (daysAgo > 365) {
    profileStatus = 'Needs Update';
  } else if (row.is_profile_complete) {
    profileStatus = 'Complete';
  }

  const missingFields = [];
  if (!row.email || !String(row.email).trim()) missingFields.push('email');
  if (!row.phone || !String(row.phone).trim()) missingFields.push('phone');
  if (row.role === 'ALUMNI' && (!row.company || !String(row.company).trim())) missingFields.push('company');
  if (!row.location || !String(row.location).trim()) missingFields.push('location');

  return {
    id: row.id,
    name: row.full_name || (row.email ? row.email.split('@')[0] : 'User'),
    email: row.email || null,
    phone: row.phone || null,
    role: roleFormatted,
    branch: row.branch || null,
    batch: row.graduation_year || row.current_year || null,
    graduationYear: row.graduation_year || null,
    degree: row.degree || 'B.Tech',
    institution: 'JECRC University',
    company: row.company || null,
    designation: row.designation || null,
    city: row.location ? row.location.split(',')[0].trim() : null,
    location: row.location || null,
    profileStatus,
    lastUpdatedDaysAgo: daysAgo,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    missingFields,
  };
};

const formatAdminUserDetails = (row) => {
  const roleFormatted = row.role === 'ALUMNI' ? 'Alumni' : (row.role === 'STUDENT' ? 'Student' : 'Admin');
  const daysAgo = row.last_updated_days_ago !== null ? Math.max(0, parseInt(row.last_updated_days_ago, 10)) : 0;
  
  let profileStatus = 'Incomplete';
  if (daysAgo > 365) {
    profileStatus = 'Needs Update';
  } else if (row.is_profile_complete) {
    profileStatus = 'Complete';
  }

  const missingFields = [];
  if (!row.email || !String(row.email).trim()) missingFields.push('email');
  if (!row.phone || !String(row.phone).trim()) missingFields.push('phone');
  if (row.role === 'ALUMNI' && (!row.company || !String(row.company).trim())) missingFields.push('company');
  if (!row.location || !String(row.location).trim()) missingFields.push('location');

  return {
    id: row.id,
    userId: row.id,
    name: row.full_name || (row.email ? row.email.split('@')[0] : 'User'),
    email: row.email || null,
    phone: row.phone || null,
    role: roleFormatted,
    profileStatus,
    institution: 'JECRC University',
    degree: row.degree || 'B.Tech',
    branch: row.branch || null,
    batch: row.graduation_year || row.current_year || null,
    graduationYear: row.graduation_year || null,
    currentYear: row.current_year || null,
    company: row.company || null,
    designation: row.designation || null,
    industry: row.role === 'ALUMNI' && row.company ? 'Technology & Software' : null,
    location: row.location || null,
    city: row.location ? row.location.split(',')[0].trim() : null,
    country: 'India',
    skills: parseList(row.skills),
    interests: parseList(row.interests),
    bio: row.bio || null,
    avatar: row.avatar_url || null,
    avatarUrl: row.avatar_url || null,
    linkedin: row.linkedin_url || null,
    github: row.github_url || null,
    portfolio: row.website_url || null,
    isAvailableForMentorship: row.is_available_for_mentorship !== false,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    lastUpdatedDaysAgo: daysAgo,
    missingFields,
  };
};

/**
 * Helper to build parameterized WHERE clause for user directory queries
 */
const buildUserQueryFilters = (options = {}) => {
  const {
    q,
    role,
    branch,
    batch,
    batchFrom,
    batchTo,
    city,
    company,
    status,
    profileStatus,
    missing,
    missingFields,
    lastUpdated,
  } = options;

  const whereClauses = [];
  const queryParams = [];

  // 1. Search Query Filter (q)
  if (q && String(q).trim()) {
    queryParams.push(`%${String(q).trim()}%`);
    const idx = queryParams.length;
    whereClauses.push(`(
      p.full_name ILIKE $${idx} OR
      u.email ILIKE $${idx} OR
      p.phone ILIKE $${idx} OR
      p.company ILIKE $${idx} OR
      p.designation ILIKE $${idx} OR
      p.branch ILIKE $${idx} OR
      p.location ILIKE $${idx}
    )`);
  }

  // 2. Role Filter
  const activeRole = role || '';
  if (activeRole && activeRole !== 'all') {
    const upperRole = activeRole.trim().toUpperCase();
    if (['STUDENT', 'ALUMNI', 'ADMIN'].includes(upperRole)) {
      queryParams.push(upperRole);
      whereClauses.push(`u.role = $${queryParams.length}`);
    }
  }

  // 3. Branch Filter
  if (branch && branch !== 'all') {
    queryParams.push(`%${String(branch).trim()}%`);
    whereClauses.push(`p.branch ILIKE $${queryParams.length}`);
  }

  // 4. Batch Filter (exact year)
  if (batch && batch !== 'all') {
    const batchInt = parseInt(batch, 10);
    if (!isNaN(batchInt)) {
      queryParams.push(batchInt);
      whereClauses.push(`(p.graduation_year = $${queryParams.length} OR p.current_year = $${queryParams.length})`);
    }
  }

  // 5. Batch Range: From
  if (batchFrom) {
    const fromInt = parseInt(batchFrom, 10);
    if (!isNaN(fromInt)) {
      queryParams.push(fromInt);
      whereClauses.push(`p.graduation_year >= $${queryParams.length}`);
    }
  }

  // 6. Batch Range: To
  if (batchTo) {
    const toInt = parseInt(batchTo, 10);
    if (!isNaN(toInt)) {
      queryParams.push(toInt);
      whereClauses.push(`p.graduation_year <= $${queryParams.length}`);
    }
  }

  // 7. City / Location Filter
  if (city && city !== 'all') {
    queryParams.push(`%${String(city).trim()}%`);
    whereClauses.push(`p.location ILIKE $${queryParams.length}`);
  }

  // 8. Company Filter
  if (company && String(company).trim()) {
    queryParams.push(`%${String(company).trim()}%`);
    whereClauses.push(`p.company ILIKE $${queryParams.length}`);
  }

  // 9. Profile / Account Status Filter
  const activeStatus = profileStatus || status || '';
  if (activeStatus && activeStatus !== 'all') {
    const upperStatus = activeStatus.toUpperCase().trim();
    if (['ACTIVE', 'PENDING_APPROVAL', 'REJECTED', 'DISABLED'].includes(upperStatus)) {
      queryParams.push(upperStatus);
      whereClauses.push(`u.account_status = $${queryParams.length}`);
    } else {
      const normStatus = activeStatus.toLowerCase().trim();
      if (normStatus === 'complete') {
        whereClauses.push(`p.is_profile_complete = true AND (NOW() - COALESCE(p.updated_at, u.updated_at)) <= INTERVAL '365 days'`);
      } else if (normStatus === 'incomplete') {
        whereClauses.push(`(p.is_profile_complete IS NOT TRUE) AND (NOW() - COALESCE(p.updated_at, u.updated_at)) <= INTERVAL '365 days'`);
      } else if (normStatus === 'needs update' || normStatus === 'needs_update') {
        whereClauses.push(`(NOW() - COALESCE(p.updated_at, u.updated_at)) > INTERVAL '365 days'`);
      }
    }
  }

  // 10. Missing Fields Filter
  const rawMissing = missingFields || missing || [];
  let missingList = [];
  if (Array.isArray(rawMissing)) {
    missingList = rawMissing;
  } else if (typeof rawMissing === 'string' && rawMissing.trim()) {
    missingList = rawMissing.split(',').map((s) => s.trim().toLowerCase());
  }

  if (missingList.length > 0) {
    const missingConditions = [];
    missingList.forEach((f) => {
      if (f === 'email') missingConditions.push(`(u.email IS NULL OR TRIM(u.email) = '')`);
      if (f === 'phone') missingConditions.push(`(p.phone IS NULL OR TRIM(p.phone) = '')`);
      if (f === 'company') missingConditions.push(`(u.role = 'ALUMNI' AND (p.company IS NULL OR TRIM(p.company) = ''))`);
      if (f === 'location' || f === 'city') missingConditions.push(`(p.location IS NULL OR TRIM(p.location) = '')`);
    });
    if (missingConditions.length > 0) {
      whereClauses.push(`(${missingConditions.join(' OR ')})`);
    }
  }

  // 11. Last Updated Freshness Filter
  if (lastUpdated && lastUpdated !== 'all') {
    if (lastUpdated === '30days') whereClauses.push(`COALESCE(p.updated_at, u.updated_at) >= NOW() - INTERVAL '30 days'`);
    else if (lastUpdated === '3months') whereClauses.push(`COALESCE(p.updated_at, u.updated_at) >= NOW() - INTERVAL '90 days'`);
    else if (lastUpdated === '6months') whereClauses.push(`COALESCE(p.updated_at, u.updated_at) >= NOW() - INTERVAL '180 days'`);
    else if (lastUpdated === '1year') whereClauses.push(`COALESCE(p.updated_at, u.updated_at) >= NOW() - INTERVAL '365 days'`);
    else if (lastUpdated === 'more1year') whereClauses.push(`COALESCE(p.updated_at, u.updated_at) < NOW() - INTERVAL '365 days'`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  return { whereClauses, queryParams, whereSql };
};

/**
 * Fetch filtered, searched, sorted, and paginated users directory
 */
const getUsers = async (options = {}) => {
  const {
    page = 1,
    pageSize,
    limit,
    sortBy = 'lastUpdated',
    sortOrder = 'desc',
  } = options;

  const { queryParams, whereSql } = buildUserQueryFilters(options);

  // 12. Whitelisted Sorting
  const sortFieldMap = {
    name: 'p.full_name',
    batch: 'p.graduation_year',
    lastupdated: 'COALESCE(p.updated_at, u.updated_at)',
    createdat: 'u.created_at',
  };

  const safeSortBy = sortFieldMap[String(sortBy).toLowerCase()] || 'COALESCE(p.updated_at, u.updated_at)';
  const safeSortOrder = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // 13. Pagination Calculation
  const parsedPage = parseInt(page, 10);
  const validatedPage = !isNaN(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const parsedPageSize = parseInt(pageSize || limit, 10);
  const validatedPageSize = !isNaN(parsedPageSize) && parsedPageSize >= 1 ? Math.min(100, parsedPageSize) : 20;
  const offset = (validatedPage - 1) * validatedPageSize;

  // Execute Count Query
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ${whereSql};
  `;
  const countResult = await db.query(countQuery, queryParams);
  const totalCount = parseInt(countResult.rows[0].total, 10) || 0;
  const totalPages = Math.ceil(totalCount / validatedPageSize) || 1;

  // Execute Paginated Data Query
  const dataQueryParams = [...queryParams, validatedPageSize, offset];
  const limitIndex = queryParams.length + 1;
  const offsetIndex = queryParams.length + 2;

  const dataQuery = `
    SELECT 
        u.id,
        u.email,
        u.role,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        p.full_name,
        p.phone,
        p.avatar_url,
        p.degree,
        p.branch,
        p.graduation_year,
        p.current_year,
        p.company,
        p.designation,
        p.location,
        p.is_profile_complete,
        COALESCE(p.updated_at, u.updated_at) AS updated_at,
        ROUND(EXTRACT(EPOCH FROM (NOW() - COALESCE(p.updated_at, u.updated_at))) / 86400) AS last_updated_days_ago
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ${whereSql}
    ORDER BY ${safeSortBy} ${safeSortOrder} NULLS LAST, u.created_at DESC
    LIMIT $${limitIndex} OFFSET $${offsetIndex};
  `;

  const dataResult = await db.query(dataQuery, dataQueryParams);
  const users = dataResult.rows.map(formatAdminUserSummary);

  return {
    users,
    totalCount,
    page: validatedPage,
    pageSize: validatedPageSize,
    totalPages,
    hasNext: validatedPage < totalPages,
    hasPrev: validatedPage > 1,
  };
};

/**
 * Fetch complete user profile by User UUID
 */
const getUserById = async (userId) => {
  const query = `
    SELECT 
        u.id,
        u.email,
        u.role,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        p.full_name,
        p.phone,
        p.avatar_url,
        p.bio,
        p.degree,
        p.branch,
        p.graduation_year,
        p.current_year,
        p.company,
        p.designation,
        p.location,
        p.is_available_for_mentorship,
        p.linkedin_url,
        p.github_url,
        p.website_url,
        p.skills,
        p.interests,
        p.is_profile_complete,
        COALESCE(p.updated_at, u.updated_at) AS updated_at,
        ROUND(EXTRACT(EPOCH FROM (NOW() - COALESCE(p.updated_at, u.updated_at))) / 86400) AS last_updated_days_ago
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE u.id = $1;
  `;

  const result = await db.query(query, [userId]);
  if (result.rows.length === 0) {
    return null;
  }

  return formatAdminUserDetails(result.rows[0]);
};

/**
 * Enable or Disable user account (updates users.account_status) with transaction and audit logging
 */
const updateUserStatus = async (adminUserId, targetUserId, accountStatus) => {
  const normStatus = String(accountStatus).toUpperCase().trim();
  if (!['ACTIVE', 'DISABLED'].includes(normStatus)) {
    const error = new Error('Invalid account status. Allowed values: ACTIVE, DISABLED');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  // Prevent admin self-deactivation
  if (adminUserId && adminUserId === targetUserId && normStatus === 'DISABLED') {
    const error = new Error('Administrators cannot deactivate their own account.');
    error.statusCode = 400;
    error.errorCode = 'SELF_DEACTIVATION_PROHIBITED';
    throw error;
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const userCheck = await client.query(
      `SELECT u.id, u.email, u.role, u.account_status, p.full_name
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = $1 FOR UPDATE OF u`,
      [targetUserId]
    );

    if (userCheck.rows.length === 0) {
      const error = new Error(`User not found with ID: ${targetUserId}`);
      error.statusCode = 404;
      error.errorCode = 'USER_NOT_FOUND';
      throw error;
    }

    const prevUser = userCheck.rows[0];

    const updateRes = await client.query(
      `UPDATE users
       SET account_status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, role, account_status;`,
      [targetUserId, normStatus]
    );

    const auditAction = normStatus === 'DISABLED' ? AUDIT_ACTIONS.USER_DEACTIVATED : AUDIT_ACTIONS.USER_REACTIVATED;

    await logAdminAction({
      client,
      adminUserId,
      action: auditAction,
      targetEntity: 'USER',
      targetId: targetUserId,
      details: {
        targetUserId,
        targetUserName: prevUser.full_name || prevUser.email,
        previousStatus: prevUser.account_status,
        newStatus: normStatus,
      },
    });

    await client.query('COMMIT');

    if (normStatus === 'DISABLED') {
      const sessionService = require('./sessionService');
      await sessionService.revokeAllUserSessions(targetUserId, 'ACCOUNT_DEACTIVATED').catch(() => {});
    }

    return updateRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Promote Student to Alumni (updates users.role = 'ALUMNI') with transaction and audit logging
 */
const updateUserRole = async (adminUserId, targetUserId, newRole) => {
  const normRole = String(newRole).toUpperCase().trim();
  if (normRole !== 'ALUMNI') {
    const error = new Error('Invalid role transition. Only promotion to ALUMNI is supported.');
    error.statusCode = 400;
    error.errorCode = 'INVALID_ROLE_TRANSITION';
    throw error;
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const userCheck = await client.query(
      `SELECT u.id, u.email, u.role, u.account_status, p.full_name
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = $1 FOR UPDATE OF u`,
      [targetUserId]
    );

    if (userCheck.rows.length === 0) {
      const error = new Error(`User not found with ID: ${targetUserId}`);
      error.statusCode = 404;
      error.errorCode = 'USER_NOT_FOUND';
      throw error;
    }

    const targetUser = userCheck.rows[0];

    if (targetUser.role === 'ALUMNI') {
      const error = new Error(`User '${targetUser.full_name || targetUser.email}' is already an Alumni.`);
      error.statusCode = 409;
      error.errorCode = 'ALREADY_ALUMNI';
      throw error;
    }

    if (targetUser.role !== 'STUDENT') {
      const error = new Error(`Cannot promote user with role '${targetUser.role}'. Only STUDENT can be promoted to ALUMNI.`);
      error.statusCode = 400;
      error.errorCode = 'INVALID_ROLE_TRANSITION';
      throw error;
    }

    const updateRes = await client.query(
      `UPDATE users
       SET role = 'ALUMNI', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, role, account_status;`,
      [targetUserId]
    );

    await logAdminAction({
      client,
      adminUserId,
      action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
      targetEntity: 'USER',
      targetId: targetUserId,
      details: {
        targetUserId,
        targetUserName: targetUser.full_name || targetUser.email,
        previousRole: targetUser.role,
        newRole: 'ALUMNI',
      },
    });

    await client.query('COMMIT');
    return updateRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Permanently delete user from PostgreSQL database with audit logging
 */
const deleteUser = async (adminUserId, targetUserId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const userCheck = await client.query(
      `SELECT u.id, u.email, u.role, p.full_name
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = $1 FOR UPDATE OF u`,
      [targetUserId]
    );

    if (userCheck.rows.length === 0) {
      const error = new Error(`User not found with ID: ${targetUserId}`);
      error.statusCode = 404;
      error.errorCode = 'USER_NOT_FOUND';
      throw error;
    }

    const targetUser = userCheck.rows[0];

    if (targetUser.role === 'ADMIN') {
      const error = new Error('Admin users cannot be deleted via user directory.');
      error.statusCode = 403;
      error.errorCode = 'CANNOT_DELETE_ADMIN';
      throw error;
    }

    // Clean dependent records
    await client.query(`DELETE FROM auth_sessions WHERE user_id = $1`, [targetUserId]);
    await client.query(`DELETE FROM user_profiles WHERE user_id = $1`, [targetUserId]);
    await client.query(`DELETE FROM alumni_verifications WHERE user_id = $1`, [targetUserId]);
    await client.query(`DELETE FROM verification_codes WHERE user_id = $1 OR email = $2`, [targetUserId, targetUser.email]);
    await client.query(`DELETE FROM notifications WHERE user_id = $1`, [targetUserId]);
    await client.query(`DELETE FROM users WHERE id = $1`, [targetUserId]);

    await logAdminAction({
      client,
      adminUserId,
      action: 'USER_DELETED',
      targetUserId,
      details: { deletedEmail: targetUser.email, deletedName: targetUser.full_name, role: targetUser.role },
    });

    await client.query('COMMIT');
    return { success: true, message: `User '${targetUser.full_name || targetUser.email}' deleted successfully.` };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getUserStats = async () => {
  const query = `
    SELECT
      COUNT(*) AS total_users,
      COUNT(*) FILTER (WHERE role = 'STUDENT') AS students,
      COUNT(*) FILTER (WHERE role = 'ALUMNI') AS alumni,
      COUNT(*) FILTER (WHERE role = 'ADMIN') AS administrators,
      COUNT(*) FILTER (WHERE account_status = 'PENDING_APPROVAL') AS pending_approvals,
      COUNT(*) FILTER (WHERE account_status = 'ACTIVE') AS active_users,
      COUNT(*) FILTER (WHERE account_status = 'DISABLED') AS disabled_users
    FROM users;
  `;
  const result = await db.query(query);
  const row = result.rows[0] || {};
  return {
    totalUsers: parseInt(row.total_users || 0, 10),
    students: parseInt(row.students || 0, 10),
    alumni: parseInt(row.alumni || 0, 10),
    administrators: parseInt(row.administrators || 0, 10),
    pendingApprovals: parseInt(row.pending_approvals || 0, 10),
    activeUsers: parseInt(row.active_users || 0, 10),
    disabledUsers: parseInt(row.disabled_users || 0, 10),
  };
};

module.exports = {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getUserStats,
  buildUserQueryFilters,
};
