const db = require('../config/db');
const { logAdminAction } = require('./adminAuditService');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const parseList = (input) => {
  if (Array.isArray(input)) return input.filter(Boolean);
  if (!input || typeof input !== 'string') return [];
  return input.split(/\s*,\s*/).filter(Boolean);
};

// ============================================================================
// 1. ADMIN JOBS MANAGEMENT
// ============================================================================

const getAdminJobs = async ({ status, search, page = 1, pageSize = 20 } = {}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  const whereClauses = [];
  const queryParams = [];

  if (status && status !== 'all') {
    queryParams.push(status.toUpperCase());
    whereClauses.push(`j.status = $${queryParams.length}`);
  }

  if (search && search.trim()) {
    queryParams.push(`%${search.trim().toLowerCase()}%`);
    whereClauses.push(`(
      LOWER(j.title) LIKE $${queryParams.length} OR
      LOWER(j.company) LIKE $${queryParams.length} OR
      LOWER(j.location) LIKE $${queryParams.length}
    )`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count
  const countQuery = `SELECT COUNT(*) AS total FROM jobs j ${whereSql};`;
  const countRes = await db.query(countQuery, queryParams);
  const totalCount = parseInt(countRes.rows[0]?.total, 10) || 0;
  const totalPages = Math.ceil(totalCount / parsedLimit) || 1;

  // Data
  const limitIdx = queryParams.length + 1;
  const offsetIdx = queryParams.length + 2;
  const dataQueryParams = [...queryParams, parsedLimit, offset];

  const dataQuery = `
    SELECT
      j.*,
      u.email AS poster_email,
      u.role AS poster_role,
      p.full_name AS poster_name,
      p.avatar_url AS poster_avatar,
      (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) AS applicants_count
    FROM jobs j
    LEFT JOIN users u ON j.posted_by = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ${whereSql}
    ORDER BY j.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx};
  `;

  const result = await db.query(dataQuery, dataQueryParams);

  const jobs = result.rows.map((row) => ({
    id: row.id,
    jobId: row.id,
    title: row.title,
    company: row.company,
    type: row.type || 'Full-time',
    location: row.location,
    salary: row.salary || 'Disclosed on application',
    description: row.description,
    requirements: row.requirements || null,
    skills: parseList(row.skills),
    applicationUrl: row.application_url || null,
    status: row.status || 'OPEN',
    applicantsCount: parseInt(row.applicants_count || '0', 10),
    postedBy: {
      id: row.posted_by,
      name: row.poster_name || (row.poster_email ? row.poster_email.split('@')[0] : 'Administrator'),
      email: row.poster_email,
      role: (row.poster_role || 'ADMIN').toLowerCase(),
      avatar: row.poster_avatar || null,
      isOfficial: (row.poster_role || '').toUpperCase() === 'ADMIN',
    },
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  }));

  return {
    jobs,
    totalCount,
    page: parsedPage,
    pageSize: parsedLimit,
    totalPages,
    hasNext: parsedPage < totalPages,
    hasPrev: parsedPage > 1,
  };
};

const createAdminJob = async (adminUser, jobData) => {
  const title = (jobData.title || '').trim();
  const company = (jobData.company || 'JECRC University').trim();
  const type = (jobData.type || 'Full-time').trim();
  const location = (jobData.location || 'Jaipur, Rajasthan').trim();
  const salary = (jobData.salary || 'Disclosed on application').trim();
  const description = (jobData.description || '').trim();
  const requirements = (jobData.requirements || '').trim();
  const skills = Array.isArray(jobData.skills) ? jobData.skills.join(', ') : (jobData.skills || '');
  const applicationUrl = (jobData.applicationUrl || '').trim();
  const status = (jobData.status || 'OPEN').toUpperCase();

  if (!title || !description) {
    const err = new Error('Job title and description are required');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const query = `
    INSERT INTO jobs (
      title,
      company,
      type,
      location,
      salary,
      description,
      requirements,
      skills,
      application_url,
      status,
      posted_by,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
    RETURNING *;
  `;

  const values = [
    title,
    company,
    type,
    location,
    salary,
    description,
    requirements || null,
    skills || null,
    applicationUrl || null,
    status,
    adminUser.id,
  ];

  const res = await db.query(query, values);
  const newJob = res.rows[0];

  logAdminAction({
    adminUserId: adminUser.id,
    action: 'JOB_CREATED',
    targetEntity: 'JOB',
    targetId: newJob.id,
    details: { title, company, status },
  }).catch((err) => console.error('Failed to log JOB_CREATED audit:', err));

  return newJob;
};

const getAdminJobById = async (jobId) => {
  if (!UUID_REGEX.test(jobId)) {
    const err = new Error('Invalid Job ID format');
    err.statusCode = 400;
    err.errorCode = 'INVALID_ID_FORMAT';
    throw err;
  }

  const query = `
    SELECT
      j.*,
      u.email AS poster_email,
      u.role AS poster_role,
      p.full_name AS poster_name,
      p.avatar_url AS poster_avatar,
      (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) AS applicants_count
    FROM jobs j
    LEFT JOIN users u ON j.posted_by = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE j.id = $1;
  `;

  const res = await db.query(query, [jobId]);
  if (res.rows.length === 0) {
    const err = new Error('Job posting not found');
    err.statusCode = 404;
    err.errorCode = 'NOT_FOUND';
    throw err;
  }

  const row = res.rows[0];

  // Fetch applicants
  const appQuery = `
    SELECT
      ja.id AS application_id,
      ja.status AS application_status,
      ja.cover_note,
      ja.resume_url,
      ja.created_at AS applied_at,
      u.id AS applicant_id,
      u.email AS applicant_email,
      u.role AS applicant_role,
      p.full_name AS applicant_name,
      p.avatar_url AS applicant_avatar,
      p.university_roll_number AS applicant_roll_number,
      p.course AS applicant_course,
      p.branch AS applicant_branch,
      p.graduation_year AS applicant_grad_year
    FROM job_applications ja
    JOIN users u ON ja.applicant_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE ja.job_id = $1
    ORDER BY ja.created_at DESC;
  `;

  const appRes = await db.query(appQuery, [jobId]);

  return {
    id: row.id,
    jobId: row.id,
    title: row.title,
    company: row.company,
    type: row.type || 'Full-time',
    location: row.location,
    salary: row.salary,
    description: row.description,
    requirements: row.requirements,
    skills: parseList(row.skills),
    applicationUrl: row.application_url,
    status: row.status,
    applicantsCount: parseInt(row.applicants_count || '0', 10),
    postedBy: {
      id: row.posted_by,
      name: row.poster_name || (row.poster_email ? row.poster_email.split('@')[0] : 'Administrator'),
      email: row.poster_email,
      role: (row.poster_role || 'ADMIN').toLowerCase(),
      avatar: row.poster_avatar || null,
      isOfficial: (row.poster_role || '').toUpperCase() === 'ADMIN',
    },
    applicants: appRes.rows.map((app) => ({
      id: app.application_id,
      applicantId: app.applicant_id,
      name: app.applicant_name || app.applicant_email.split('@')[0],
      email: app.applicant_email,
      role: app.applicant_role,
      rollNumber: app.applicant_roll_number || 'N/A',
      course: app.applicant_course || 'N/A',
      branch: app.applicant_branch || 'N/A',
      graduationYear: app.applicant_grad_year || 'N/A',
      coverNote: app.cover_note || null,
      resumeUrl: app.resume_url || null,
      status: app.application_status || 'APPLIED',
      appliedAt: app.applied_at ? new Date(app.applied_at).toISOString() : null,
    })),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
};

const updateAdminJob = async (adminUser, jobId, jobData) => {
  const existing = await getAdminJobById(jobId);

  const title = (jobData.title !== undefined ? jobData.title : existing.title).trim();
  const company = (jobData.company !== undefined ? jobData.company : existing.company).trim();
  const type = (jobData.type !== undefined ? jobData.type : existing.type).trim();
  const location = (jobData.location !== undefined ? jobData.location : existing.location).trim();
  const salary = (jobData.salary !== undefined ? jobData.salary : existing.salary).trim();
  const description = (jobData.description !== undefined ? jobData.description : existing.description).trim();
  const requirements = (jobData.requirements !== undefined ? jobData.requirements : (existing.requirements || '')).trim();
  const skills = Array.isArray(jobData.skills) ? jobData.skills.join(', ') : (jobData.skills !== undefined ? jobData.skills : (existing.skills ? existing.skills.join(', ') : ''));
  const applicationUrl = (jobData.applicationUrl !== undefined ? jobData.applicationUrl : (existing.applicationUrl || '')).trim();
  const status = (jobData.status !== undefined ? jobData.status : existing.status).toUpperCase();

  const query = `
    UPDATE jobs
    SET
      title = $1,
      company = $2,
      type = $3,
      location = $4,
      salary = $5,
      description = $6,
      requirements = $7,
      skills = $8,
      application_url = $9,
      status = $10
    WHERE id = $11
    RETURNING *;
  `;

  const values = [
    title,
    company,
    type,
    location,
    salary,
    description,
    requirements || null,
    skills || null,
    applicationUrl || null,
    status,
    jobId,
  ];

  const res = await db.query(query, values);

  logAdminAction({
    adminUserId: adminUser.id,
    action: 'JOB_UPDATED',
    targetEntity: 'JOB',
    targetId: jobId,
    details: { title, status },
  }).catch((err) => console.error('Failed to log JOB_UPDATED audit:', err));

  return res.rows[0];
};

const updateAdminJobStatus = async (adminUser, jobId, status) => {
  const validStatuses = ['DRAFT', 'OPEN', 'CLOSED', 'EXPIRED'];
  const formattedStatus = (status || '').toUpperCase();
  if (!validStatuses.includes(formattedStatus)) {
    const err = new Error(`Invalid status "${status}". Allowed values: ${validStatuses.join(', ')}`);
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const query = `
    UPDATE jobs
    SET status = $1
    WHERE id = $2
    RETURNING *;
  `;

  const res = await db.query(query, [formattedStatus, jobId]);
  if (res.rows.length === 0) {
    const err = new Error('Job posting not found');
    err.statusCode = 404;
    err.errorCode = 'NOT_FOUND';
    throw err;
  }

  logAdminAction({
    adminUserId: adminUser.id,
    action: 'JOB_STATUS_UPDATED',
    targetEntity: 'JOB',
    targetId: jobId,
    details: { status: formattedStatus },
  }).catch((err) => console.error('Failed to log JOB_STATUS_UPDATED audit:', err));

  return res.rows[0];
};

// ============================================================================
// 2. ADMIN EVENTS MANAGEMENT
// ============================================================================

const getAdminEvents = async ({ status, search, page = 1, pageSize = 20 } = {}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  const whereClauses = [];
  const queryParams = [];

  if (status && status !== 'all') {
    queryParams.push(status.toUpperCase());
    whereClauses.push(`e.status = $${queryParams.length}`);
  }

  if (search && search.trim()) {
    queryParams.push(`%${search.trim().toLowerCase()}%`);
    whereClauses.push(`(
      LOWER(e.title) LIKE $${queryParams.length} OR
      LOWER(e.speaker) LIKE $${queryParams.length} OR
      LOWER(e.location) LIKE $${queryParams.length}
    )`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count
  const countQuery = `SELECT COUNT(*) AS total FROM events e ${whereSql};`;
  const countRes = await db.query(countQuery, queryParams);
  const totalCount = parseInt(countRes.rows[0]?.total, 10) || 0;
  const totalPages = Math.ceil(totalCount / parsedLimit) || 1;

  // Data
  const limitIdx = queryParams.length + 1;
  const offsetIdx = queryParams.length + 2;
  const dataQueryParams = [...queryParams, parsedLimit, offset];

  const dataQuery = `
    SELECT
      e.*,
      u.email AS creator_email,
      u.role AS creator_role,
      p.full_name AS creator_name,
      p.avatar_url AS creator_avatar,
      (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status = 'REGISTERED') AS registered_count
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ${whereSql}
    ORDER BY e.start_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx};
  `;

  const result = await db.query(dataQuery, dataQueryParams);

  const events = result.rows.map((row) => {
    const regCount = parseInt(row.registered_count || '0', 10);
    const cap = row.capacity ? parseInt(row.capacity, 10) : null;
    const seatsLeft = cap !== null ? Math.max(0, cap - regCount) : 'Unlimited';

    return {
      id: row.id,
      eventId: row.id,
      title: row.title,
      description: row.description,
      category: row.category || 'Workshops',
      eventType: row.event_type || 'ALUMNI_MEETUP',
      speaker: row.speaker || 'JECRC Leadership',
      location: row.location,
      isOnline: Boolean(row.is_online),
      meetingUrl: row.meeting_url || null,
      startAt: row.start_at ? new Date(row.start_at).toISOString() : null,
      endAt: row.end_at ? new Date(row.end_at).toISOString() : null,
      registrationDeadline: row.registration_deadline ? new Date(row.registration_deadline).toISOString() : null,
      registeredCount: regCount,
      capacity: cap,
      seatsLeft,
      status: row.status || 'PUBLISHED',
      imageUrl: row.image_url || null,
      createdBy: {
        id: row.created_by,
        name: row.creator_name || (row.creator_email ? row.creator_email.split('@')[0] : 'Administrator'),
        email: row.creator_email,
        role: (row.creator_role || 'ADMIN').toLowerCase(),
        avatar: row.creator_avatar || null,
      },
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    };
  });

  return {
    events,
    totalCount,
    page: parsedPage,
    pageSize: parsedLimit,
    totalPages,
    hasNext: parsedPage < totalPages,
    hasPrev: parsedPage > 1,
  };
};

const createAdminEvent = async (adminUser, eventData) => {
  const title = (eventData.title || '').trim();
  const description = (eventData.description || '').trim();
  const category = (eventData.category || 'Workshops').trim();
  const eventType = (eventData.eventType || 'ALUMNI_MEETUP').trim();
  const speaker = (eventData.speaker || 'JECRC Leadership').trim();
  const location = (eventData.location || 'JECRC Campus, Jaipur').trim();
  const isOnline = Boolean(eventData.isOnline);
  const meetingUrl = (eventData.meetingUrl || '').trim();
  const startAt = eventData.startAt ? new Date(eventData.startAt) : new Date(Date.now() + 86400000 * 7);
  const endAt = eventData.endAt ? new Date(eventData.endAt) : new Date(startAt.getTime() + 7200000);
  const registrationDeadline = eventData.registrationDeadline ? new Date(eventData.registrationDeadline) : startAt;
  const capacity = eventData.capacity ? parseInt(eventData.capacity, 10) : 100;
  const status = (eventData.status || 'PUBLISHED').toUpperCase();
  const imageUrl = (eventData.imageUrl || '').trim();

  if (!title || !description) {
    const err = new Error('Event title and description are required');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const query = `
    INSERT INTO events (
      title,
      description,
      category,
      event_type,
      speaker,
      location,
      is_online,
      meeting_url,
      start_at,
      end_at,
      registration_deadline,
      capacity,
      status,
      image_url,
      created_by,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
    RETURNING *;
  `;

  const values = [
    title,
    description,
    category,
    eventType,
    speaker,
    location,
    isOnline,
    meetingUrl || null,
    startAt,
    endAt,
    registrationDeadline,
    capacity,
    status,
    imageUrl || null,
    adminUser.id,
  ];

  const res = await db.query(query, values);
  const newEvent = res.rows[0];

  logAdminAction({
    adminUserId: adminUser.id,
    action: 'EVENT_CREATED',
    targetEntity: 'EVENT',
    targetId: newEvent.id,
    details: { title, category, status },
  }).catch((err) => console.error('Failed to log EVENT_CREATED audit:', err));

  return newEvent;
};

const getAdminEventById = async (eventId) => {
  if (!UUID_REGEX.test(eventId)) {
    const err = new Error('Invalid Event ID format');
    err.statusCode = 400;
    err.errorCode = 'INVALID_ID_FORMAT';
    throw err;
  }

  const query = `
    SELECT
      e.*,
      u.email AS creator_email,
      u.role AS creator_role,
      p.full_name AS creator_name,
      p.avatar_url AS creator_avatar,
      (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status = 'REGISTERED') AS registered_count
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE e.id = $1;
  `;

  const res = await db.query(query, [eventId]);
  if (res.rows.length === 0) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    err.errorCode = 'NOT_FOUND';
    throw err;
  }

  const row = res.rows[0];

  // Fetch attendees
  const regQuery = `
    SELECT
      er.id AS registration_id,
      er.status AS registration_status,
      er.id AS registered_at,
      u.id AS attendee_id,
      u.email AS attendee_email,
      u.role AS attendee_role,
      p.full_name AS attendee_name,
      p.avatar_url AS attendee_avatar,
      p.university_roll_number AS attendee_roll_number,
      p.course AS attendee_course,
      p.branch AS attendee_branch,
      p.graduation_year AS attendee_grad_year
    FROM event_registrations er
    JOIN users u ON er.user_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE er.event_id = $1;
  `;

  const regRes = await db.query(regQuery, [eventId]);

  const regCount = parseInt(row.registered_count || '0', 10);
  const cap = row.capacity ? parseInt(row.capacity, 10) : null;
  const seatsLeft = cap !== null ? Math.max(0, cap - regCount) : 'Unlimited';

  return {
    id: row.id,
    eventId: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    eventType: row.event_type,
    speaker: row.speaker,
    location: row.location,
    isOnline: Boolean(row.is_online),
    meetingUrl: row.meeting_url,
    startAt: row.start_at ? new Date(row.start_at).toISOString() : null,
    endAt: row.end_at ? new Date(row.end_at).toISOString() : null,
    registrationDeadline: row.registration_deadline ? new Date(row.registration_deadline).toISOString() : null,
    registeredCount: regCount,
    capacity: cap,
    seatsLeft,
    status: row.status,
    imageUrl: row.image_url,
    createdBy: {
      id: row.created_by,
      name: row.creator_name || (row.creator_email ? row.creator_email.split('@')[0] : 'Administrator'),
      email: row.creator_email,
      role: (row.creator_role || 'ADMIN').toLowerCase(),
      avatar: row.creator_avatar || null,
    },
    attendees: regRes.rows.map((att) => ({
      id: att.registration_id,
      attendeeId: att.attendee_id,
      name: att.attendee_name || att.attendee_email.split('@')[0],
      email: att.attendee_email,
      role: att.attendee_role,
      rollNumber: att.attendee_roll_number || 'N/A',
      course: att.attendee_course || 'N/A',
      branch: att.attendee_branch || 'N/A',
      graduationYear: att.attendee_grad_year || 'N/A',
      status: att.registration_status || 'REGISTERED',
      registeredAt: att.registered_at && !isNaN(new Date(att.registered_at).getTime()) ? new Date(att.registered_at).toISOString() : null,
    })),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
};

const updateAdminEventStatus = async (adminUser, eventId, status) => {
  const validStatuses = ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'];
  const formattedStatus = (status || '').toUpperCase();
  if (!validStatuses.includes(formattedStatus)) {
    const err = new Error(`Invalid status "${status}". Allowed values: ${validStatuses.join(', ')}`);
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const query = `
    UPDATE events
    SET status = $1
    WHERE id = $2
    RETURNING *;
  `;

  const res = await db.query(query, [formattedStatus, eventId]);
  if (res.rows.length === 0) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    err.errorCode = 'NOT_FOUND';
    throw err;
  }

  logAdminAction({
    adminUserId: adminUser.id,
    action: 'EVENT_STATUS_UPDATED',
    targetEntity: 'EVENT',
    targetId: eventId,
    details: { status: formattedStatus },
  }).catch((err) => console.error('Failed to log EVENT_STATUS_UPDATED audit:', err));

  return res.rows[0];
};

// ============================================================================
// 3. FEED MODERATION & CONNECTIONS & MENTORSHIP
// ============================================================================

const getAdminPosts = async ({ search, page = 1, pageSize = 20 } = {}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  const whereClauses = [];
  const queryParams = [];

  if (search && search.trim()) {
    queryParams.push(`%${search.trim().toLowerCase()}%`);
    whereClauses.push(`(
      LOWER(p.content) LIKE $${queryParams.length} OR
      LOWER(u.email) LIKE $${queryParams.length} OR
      LOWER(prof.full_name) LIKE $${queryParams.length}
    )`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN user_profiles prof ON u.id = prof.user_id
    ${whereSql};
  `;
  const countRes = await db.query(countQuery, queryParams);
  const totalCount = parseInt(countRes.rows[0]?.total, 10) || 0;
  const totalPages = Math.ceil(totalCount / parsedLimit) || 1;

  const limitIdx = queryParams.length + 1;
  const offsetIdx = queryParams.length + 2;
  const dataQueryParams = [...queryParams, parsedLimit, offset];

  const dataQuery = `
    SELECT
      p.id,
      p.content,
      p.created_at,
      u.id AS author_id,
      u.email AS author_email,
      u.role AS author_role,
      prof.full_name AS author_name,
      prof.avatar_url AS author_avatar,
      (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS likes_count,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN user_profiles prof ON u.id = prof.user_id
    ${whereSql}
    ORDER BY p.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx};
  `;

  const res = await db.query(dataQuery, dataQueryParams);

  const posts = res.rows.map((row) => ({
    id: row.id,
    postId: row.id,
    content: row.content,
    mediaUrl: row.media_url || null,
    likesCount: parseInt(row.likes_count || '0', 10),
    commentsCount: parseInt(row.comments_count || '0', 10),
    author: {
      id: row.author_id,
      name: row.author_name || (row.author_email ? row.author_email.split('@')[0] : 'Member'),
      email: row.author_email,
      role: (row.author_role || 'STUDENT').toLowerCase(),
      avatar: row.author_avatar || null,
    },
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  }));

  return {
    posts,
    totalCount,
    page: parsedPage,
    pageSize: parsedLimit,
    totalPages,
    hasNext: parsedPage < totalPages,
    hasPrev: parsedPage > 1,
  };
};

const getAdminConnections = async ({ status, search, page = 1, pageSize = 20 } = {}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  const whereClauses = [];
  const queryParams = [];

  if (status && status !== 'all') {
    queryParams.push(status.toUpperCase());
    whereClauses.push(`c.status = $${queryParams.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) AS total FROM connections c ${whereSql};`;
  const countRes = await db.query(countQuery, queryParams);
  const totalCount = parseInt(countRes.rows[0]?.total, 10) || 0;
  const totalPages = Math.ceil(totalCount / parsedLimit) || 1;

  const limitIdx = queryParams.length + 1;
  const offsetIdx = queryParams.length + 2;
  const dataQueryParams = [...queryParams, parsedLimit, offset];

  const dataQuery = `
    SELECT
      c.id,
      c.status,
      c.created_at,
      u1.id AS requester_id,
      u1.email AS requester_email,
      u1.role AS requester_role,
      p1.full_name AS requester_name,
      p1.avatar_url AS requester_avatar,
      u2.id AS receiver_id,
      u2.email AS receiver_email,
      u2.role AS receiver_role,
      p2.full_name AS receiver_name,
      p2.avatar_url AS receiver_avatar
    FROM connections c
    JOIN users u1 ON c.requester_id = u1.id
    LEFT JOIN user_profiles p1 ON u1.id = p1.user_id
    JOIN users u2 ON c.receiver_id = u2.id
    LEFT JOIN user_profiles p2 ON u2.id = p2.user_id
    ${whereSql}
    ORDER BY c.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx};
  `;

  const res = await db.query(dataQuery, dataQueryParams);

  const connections = res.rows.map((row) => ({
    id: row.id,
    status: row.status,
    requester: {
      id: row.requester_id,
      name: row.requester_name || row.requester_email.split('@')[0],
      email: row.requester_email,
      role: row.requester_role,
      avatar: row.requester_avatar || null,
    },
    receiver: {
      id: row.receiver_id,
      name: row.receiver_name || row.receiver_email.split('@')[0],
      email: row.receiver_email,
      role: row.receiver_role,
      avatar: row.receiver_avatar || null,
    },
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  }));

  return {
    connections,
    totalCount,
    page: parsedPage,
    pageSize: parsedLimit,
    totalPages,
    hasNext: parsedPage < totalPages,
    hasPrev: parsedPage > 1,
  };
};

const getAdminMentorship = async ({ status, search, page = 1, pageSize = 20 } = {}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  const whereClauses = [];
  const queryParams = [];

  if (status && status !== 'all') {
    queryParams.push(status.toUpperCase());
    whereClauses.push(`m.status = $${queryParams.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) AS total FROM mentorship_requests m ${whereSql};`;
  const countRes = await db.query(countQuery, queryParams);
  const totalCount = parseInt(countRes.rows[0]?.total, 10) || 0;
  const totalPages = Math.ceil(totalCount / parsedLimit) || 1;

  const limitIdx = queryParams.length + 1;
  const offsetIdx = queryParams.length + 2;
  const dataQueryParams = [...queryParams, parsedLimit, offset];

  const dataQuery = `
    SELECT
      m.id,
      m.topic,
      m.message,
      m.status,
      m.created_at,
      m.updated_at,
      u1.id AS student_id,
      u1.email AS student_email,
      p1.full_name AS student_name,
      p1.avatar_url AS student_avatar,
      u2.id AS mentor_id,
      u2.email AS mentor_email,
      p2.full_name AS mentor_name,
      p2.avatar_url AS mentor_avatar
    FROM mentorship_requests m
    JOIN users u1 ON m.student_id = u1.id
    LEFT JOIN user_profiles p1 ON u1.id = p1.user_id
    JOIN users u2 ON m.mentor_id = u2.id
    LEFT JOIN user_profiles p2 ON u2.id = p2.user_id
    ${whereSql}
    ORDER BY m.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx};
  `;

  const res = await db.query(dataQuery, dataQueryParams);

  const mentorships = res.rows.map((row) => ({
    id: row.id,
    topic: row.topic || 'General Guidance',
    message: row.message || null,
    status: row.status,
    student: {
      id: row.student_id,
      name: row.student_name || row.student_email.split('@')[0],
      email: row.student_email,
      avatar: row.student_avatar || null,
    },
    mentor: {
      id: row.mentor_id,
      name: row.mentor_name || row.mentor_email.split('@')[0],
      email: row.mentor_email,
      avatar: row.mentor_avatar || null,
    },
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  }));

  return {
    mentorships,
    totalCount,
    page: parsedPage,
    pageSize: parsedLimit,
    totalPages,
    hasNext: parsedPage < totalPages,
    hasPrev: parsedPage > 1,
  };
};

module.exports = {
  getAdminJobs,
  createAdminJob,
  getAdminJobById,
  updateAdminJob,
  updateAdminJobStatus,
  getAdminEvents,
  createAdminEvent,
  getAdminEventById,
  updateAdminEventStatus,
  getAdminPosts,
  getAdminConnections,
  getAdminMentorship,
};
