const db = require('../config/db');

const parseList = (str) => {
  if (!str || typeof str !== 'string' || str.trim() === '') return [];
  return str.split(/\s*,\s*/).filter(Boolean);
};

const formatPublicUser = (row, authUserId = null) => {
  const isAlumni = (row.role || '').toUpperCase() === 'ALUMNI';
  const graduationYr = row.graduation_year ? parseInt(row.graduation_year, 10) : null;
  const currentAcademicYr = row.current_year ? parseInt(row.current_year, 10) : null;

  let connectionStatus = 'none';
  let connectionId = row.conn_id || null;

  if (row.conn_id && row.conn_status) {
    if (row.conn_status === 'ACCEPTED') {
      connectionStatus = 'connected';
    } else if (row.conn_status === 'PENDING') {
      if (row.conn_requester === authUserId) {
        connectionStatus = 'pending_outgoing';
      } else if (row.conn_receiver === authUserId) {
        connectionStatus = 'pending_incoming';
      } else {
        connectionStatus = 'pending';
      }
    }
  }

  return {
    id: row.user_id,
    userId: row.user_id,
    profileId: row.profile_id || null,
    name: row.full_name || (row.email ? row.email.split('@')[0] : 'JECRC Member'),
    fullName: row.full_name || '',
    email: row.email,
    role: (row.role || 'STUDENT').toLowerCase(),
    roleUpper: (row.role || 'STUDENT').toUpperCase(),
    avatar: row.avatar_url || (isAlumni
      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'),
    avatarUrl: row.avatar_url || null,
    degree: row.degree || null,
    branch: row.branch || null,
    batch: graduationYr ? String(graduationYr) : (isAlumni ? 'Alumni' : 'Student'),
    graduationYear: graduationYr,
    currentYear: currentAcademicYr,
    currentAcademicYear: currentAcademicYr,
    company: row.company || null,
    designation: row.designation || null,
    currentRole: row.designation || null,
    headline: isAlumni
      ? `${row.designation || 'Alumnus'}${row.company ? ` @ ${row.company}` : ''}`
      : `${row.degree || 'B.Tech'} ${row.branch || ''}${graduationYr ? ` • Class of ${graduationYr}` : ''}`.trim(),
    location: row.location || null,
    bio: row.bio || null,
    about: row.bio || null,
    skills: parseList(row.skills),
    interests: parseList(row.interests),
    linkedin: row.linkedin_url || null,
    linkedinUrl: row.linkedin_url || null,
    github: row.github_url || null,
    githubUrl: row.github_url || null,
    websiteUrl: row.website_url || null,
    isAvailableForMentorship: row.is_available_for_mentorship !== false,
    verified: true,
    isAlumni: isAlumni,
    isDataComplete: !!row.is_profile_complete,
    profileCompleted: !!row.is_profile_complete,
    connectionStatus: connectionStatus,
    connectionId: connectionId,
    connectionsCount: 42,
    profileViewsCount: 120,
  };
};

const discoverUsers = async (queryParams, authUserId = null) => {
  const page = Math.max(1, parseInt(queryParams.page || 1, 10));
  const rawLimit = parseInt(queryParams.limit || 20, 10);
  const limit = Math.min(50, Math.max(1, isNaN(rawLimit) ? 20 : rawLimit));
  const offset = (page - 1) * limit;

  const whereClauses = [`UPPER(u.role) != 'ADMIN'`, `u.account_status != 'DISABLED'`];
  const values = [];
  let paramIndex = 1;

  // Exclude current logged in user from network discovery & suggestions
  if (authUserId) {
    whereClauses.push(`u.id != $${paramIndex}`);
    values.push(authUserId);
    paramIndex++;
  }

  // 1. Role Filter (type or role parameter)
  const roleFilter = queryParams.role || queryParams.type;
  if (roleFilter && roleFilter.toLowerCase() !== 'all') {
    whereClauses.push(`UPPER(u.role) = $${paramIndex}`);
    values.push(roleFilter.toUpperCase());
    paramIndex++;
  }

  // 2. Branch Filter
  if (queryParams.branch && queryParams.branch.toLowerCase() !== 'all') {
    whereClauses.push(`LOWER(p.branch) LIKE $${paramIndex}`);
    values.push(`%${queryParams.branch.toLowerCase()}%`);
    paramIndex++;
  }

  // 3. Batch / Graduation Year Filter
  const gradYear = queryParams.graduationYear || queryParams.batch;
  if (gradYear && String(gradYear).toLowerCase() !== 'all') {
    const yrNum = parseInt(gradYear, 10);
    if (!isNaN(yrNum)) {
      whereClauses.push(`p.graduation_year = $${paramIndex}`);
      values.push(yrNum);
      paramIndex++;
    }
  }

  // 4. Search Query Filter
  if (queryParams.query && queryParams.query.trim() !== '') {
    const q = `%${queryParams.query.trim().toLowerCase()}%`;
    whereClauses.push(`(
      LOWER(p.full_name) LIKE $${paramIndex} OR
      LOWER(p.company) LIKE $${paramIndex} OR
      LOWER(p.designation) LIKE $${paramIndex} OR
      LOWER(p.location) LIKE $${paramIndex} OR
      LOWER(p.branch) LIKE $${paramIndex} OR
      LOWER(p.degree) LIKE $${paramIndex} OR
      LOWER(p.skills) LIKE $${paramIndex}
    )`);
    values.push(q);
    paramIndex++;
  }

  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count Query
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ${whereString};
  `;
  const countResult = await db.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);
  const pages = Math.ceil(total / limit) || 1;

  // Data Query with Connection JOIN
  let authParamIndex = null;
  let connJoinClause = '';
  if (authUserId) {
    authParamIndex = paramIndex;
    values.push(authUserId);
    paramIndex++;
    connJoinClause = `
      LEFT JOIN connections c ON (
        (c.requester_id = $${authParamIndex} AND c.receiver_id = u.id) OR
        (c.receiver_id = $${authParamIndex} AND c.requester_id = u.id)
      )
    `;
  }

  const dataQuery = `
    SELECT u.id AS user_id, u.email, u.role, p.id AS profile_id, p.full_name,
           p.phone, p.avatar_url, p.bio, p.degree, p.branch, p.graduation_year,
           p.current_year, p.company, p.designation, p.location,
           p.is_available_for_mentorship, p.linkedin_url, p.github_url,
           p.website_url, p.skills, p.interests, p.is_profile_complete,
           p.created_at, p.updated_at
           ${authUserId ? ', c.id AS conn_id, c.requester_id AS conn_requester, c.receiver_id AS conn_receiver, c.status AS conn_status' : ''}
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ${connJoinClause}
    ${whereString}
    ORDER BY COALESCE(p.updated_at, u.created_at) DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
  `;

  const dataValues = [...values, limit, offset];
  const dataResult = await db.query(dataQuery, dataValues);

  const users = dataResult.rows.map((row) => formatPublicUser(row, authUserId));

  return {
    users,
    total,
    page,
    limit,
    pages,
    totalCount: total,
    totalPages: pages,
    hasMore: offset + limit < total,
  };
};

const getPublicUserById = async (targetUserId, authUserId = null) => {
  let connSelect = '';
  let connJoin = '';
  const params = [targetUserId];

  if (authUserId) {
    params.push(authUserId);
    connSelect = ', c.id AS conn_id, c.requester_id AS conn_requester, c.receiver_id AS conn_receiver, c.status AS conn_status';
    connJoin = `
      LEFT JOIN connections c ON (
        (c.requester_id = $2 AND c.receiver_id = u.id) OR
        (c.receiver_id = $2 AND c.requester_id = u.id)
      )
    `;
  }

  const queryText = `
    SELECT u.id AS user_id, u.email, u.role, u.account_status, p.id AS profile_id,
           p.full_name, p.phone, p.avatar_url, p.bio, p.degree, p.branch,
           p.graduation_year, p.current_year, p.company, p.designation,
           p.location, p.is_available_for_mentorship, p.linkedin_url,
           p.github_url, p.website_url, p.skills, p.interests,
           p.is_profile_complete, p.created_at, p.updated_at
           ${connSelect}
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ${connJoin}
    WHERE u.id = $1 AND u.account_status != 'DISABLED';
  `;

  const result = await db.query(queryText, params);

  if (result.rows.length === 0) {
    const error = new Error(`User not found with ID '${targetUserId}'`);
    error.statusCode = 404;
    error.errorCode = 'RESOURCE_NOT_FOUND';
    throw error;
  }

  const formattedUser = formatPublicUser(result.rows[0], authUserId);
  return {
    user: formattedUser,
    ...formattedUser,
  };
};

module.exports = {
  discoverUsers,
  getPublicUserById,
};
