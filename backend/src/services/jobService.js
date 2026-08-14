const crypto = require('crypto');
const db = require('../config/db');
const notificationService = require('./notificationService');

const parseList = (input) => {
  if (Array.isArray(input)) return input.filter(Boolean);
  if (!input || typeof input !== 'string') return [];
  return input.split(/\s*,\s*/).filter(Boolean);
};

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

const getUserName = async (userId) => {
  const res = await db.query(
    `SELECT p.full_name, u.email FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1`,
    [userId]
  );
  if (res.rows.length === 0) return 'JECRC Member';
  return res.rows[0].full_name || res.rows[0].email.split('@')[0];
};

const formatJobDTO = (row, authUserId = null) => {
  const isPosterAlumni = (row.poster_role || '').toUpperCase() === 'ALUMNI';
  const gradYr = row.poster_graduation_year ? parseInt(row.poster_graduation_year, 10) : null;
  const posterName = row.poster_name || (row.poster_email ? row.poster_email.split('@')[0] : 'JECRC Alumni');

  const postedByObj = {
    id: row.posted_by,
    userId: row.posted_by,
    name: posterName,
    email: row.poster_email,
    role: (row.poster_role || 'ALUMNI').toLowerCase(),
    avatar: row.poster_avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    headline: row.poster_designation ? `${row.poster_designation} @ ${row.poster_company || row.company}` : 'JECRC Alumni',
    company: row.poster_company || row.company,
    designation: row.poster_designation || null,
  };

  const skills = parseList(row.skills);
  const isBookmarked = row.is_bookmarked_by_user === true || row.is_bookmarked_by_user === 'true' || row.is_bookmarked_by_user === 1;
  const hasApplied = row.has_applied_by_user === true || row.has_applied_by_user === 'true' || row.has_applied_by_user === 1;
  const isMyPosting = authUserId && row.posted_by === authUserId;

  return {
    id: row.id,
    jobId: row.id,
    postedById: row.posted_by,
    postedBy: posterName,
    poster: postedByObj,
    title: row.title,
    company: row.company,
    type: row.type || 'Full-time',
    location: row.location,
    salary: row.salary || 'Disclosed on application',
    stipend: row.salary || 'Disclosed on application',
    description: row.description,
    requirements: row.requirements || null,
    skills: skills.length > 0 ? skills : ['Java', 'Spring Boot', 'SQL'],
    tags: skills.length > 0 ? skills : ['Java', 'Spring Boot', 'SQL'],
    applicationUrl: row.application_url || null,
    status: row.status || 'OPEN',
    applicantsCount: parseInt(row.applicants_count || '0', 10),
    isMyPosting: isMyPosting,
    isBookmarked: isBookmarked,
    isSaved: isBookmarked,
    hasApplied: hasApplied,
    applicationStatus: row.application_status_by_user || null,
    createdAt: formatTimeAgo(row.created_at),
    createdAtRaw: row.created_at,
  };
};

const createJob = async (user, jobData) => {
  if (user.account_status === 'DISABLED') {
    const err = new Error('Disabled accounts cannot post jobs');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  if ((user.role || '').toUpperCase() !== 'ALUMNI') {
    const err = new Error('Only Alumni members are authorized to post job referrals and opportunities');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const title = (jobData.title || '').trim();
  const company = (jobData.company || '').trim();
  const location = (jobData.location || '').trim();
  const description = (jobData.description || '').trim();

  if (!title || !company || !location || !description) {
    const err = new Error('Job title, company, location, and description are required fields');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const type = jobData.type || 'Full-time';
  const salary = jobData.salary || jobData.stipend || '₹18 - ₹24 LPA';
  const requirements = jobData.requirements || null;
  const skillsStr = Array.isArray(jobData.skills) ? jobData.skills.join(',') : (jobData.skills || jobData.tags || 'Java, Spring Boot');
  const applicationUrl = jobData.applicationUrl || null;
  const status = jobData.status || 'OPEN';

  const jobId = crypto.randomUUID();
  await db.query(
    `INSERT INTO jobs (id, posted_by, title, company, type, location, salary, description, requirements, skills, application_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [jobId, user.id, title, company, type, location, salary, description, requirements, skillsStr, applicationUrl, status]
  );

  return getJobById(user.id, jobId);
};

const getJobs = async (authUserId, queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page || 1, 10));
  const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit || 10, 10)));
  const offset = (page - 1) * limit;

  const whereClauses = [`u.account_status != 'DISABLED'`];
  const values = [];
  let paramIndex = 1;

  if (queryParams.status) {
    whereClauses.push(`j.status = $${paramIndex}`);
    values.push(queryParams.status.toUpperCase());
    paramIndex++;
  } else {
    whereClauses.push(`j.status = 'OPEN'`);
  }

  if (queryParams.type && queryParams.type !== 'All') {
    whereClauses.push(`j.type = $${paramIndex}`);
    values.push(queryParams.type);
    paramIndex++;
  }

  if (queryParams.location && queryParams.location !== 'All') {
    whereClauses.push(`j.location ILIKE $${paramIndex}`);
    values.push(`%${queryParams.location}%`);
    paramIndex++;
  }

  if (queryParams.myPosts === 'true' || queryParams.myPosts === true) {
    whereClauses.push(`j.posted_by = $${paramIndex}`);
    values.push(authUserId);
    paramIndex++;
  }

  if (queryParams.search && queryParams.search.trim() !== '') {
    const q = `%${queryParams.search.trim().toLowerCase()}%`;
    whereClauses.push(`(
      LOWER(j.title) LIKE $${paramIndex} OR
      LOWER(j.company) LIKE $${paramIndex} OR
      LOWER(j.skills) LIKE $${paramIndex} OR
      LOWER(j.description) LIKE $${paramIndex}
    )`);
    values.push(q);
    paramIndex++;
  }

  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM jobs j
    JOIN users u ON j.posted_by = u.id
    ${whereString};
  `;
  const countResult = await db.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);
  const pages = Math.ceil(total / limit) || 1;

  values.push(authUserId);
  const authUserIdParamIdx = paramIndex;
  paramIndex++;

  values.push(limit, offset);
  const limitParamIdx = paramIndex;
  const offsetParamIdx = paramIndex + 1;

  const dataQuery = `
    SELECT j.*,
           u.email AS poster_email, u.role AS poster_role,
           p.full_name AS poster_name, p.avatar_url AS poster_avatar,
           p.graduation_year AS poster_graduation_year,
           p.company AS poster_company, p.designation AS poster_designation,
           (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) AS applicants_count,
           EXISTS (
             SELECT 1 FROM job_bookmarks jb WHERE jb.job_id = j.id AND jb.user_id = $${authUserIdParamIdx}
           ) AS is_bookmarked_by_user,
           EXISTS (
             SELECT 1 FROM job_applications ja2 WHERE ja2.job_id = j.id AND ja2.applicant_id = $${authUserIdParamIdx}
           ) AS has_applied_by_user,
           (
             SELECT ja3.status FROM job_applications ja3 WHERE ja3.job_id = j.id AND ja3.applicant_id = $${authUserIdParamIdx} LIMIT 1
           ) AS application_status_by_user
    FROM jobs j
    JOIN users u ON j.posted_by = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ${whereString}
    ORDER BY j.created_at DESC
    LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx};
  `;

  const dataResult = await db.query(dataQuery, values);
  const jobs = dataResult.rows.map((row) => formatJobDTO(row, authUserId));

  return {
    jobs,
    total,
    page,
    limit,
    pages,
    totalCount: total,
    totalPages: pages,
    hasMore: offset + limit < total,
  };
};

const getJobById = async (authUserId, jobId) => {
  const queryText = `
    SELECT j.*,
           u.email AS poster_email, u.role AS poster_role,
           p.full_name AS poster_name, p.avatar_url AS poster_avatar,
           p.graduation_year AS poster_graduation_year,
           p.company AS poster_company, p.designation AS poster_designation,
           (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) AS applicants_count,
           EXISTS (
             SELECT 1 FROM job_bookmarks jb WHERE jb.job_id = j.id AND jb.user_id = $2
           ) AS is_bookmarked_by_user,
           EXISTS (
             SELECT 1 FROM job_applications ja2 WHERE ja2.job_id = j.id AND ja2.applicant_id = $2
           ) AS has_applied_by_user,
           (
             SELECT ja3.status FROM job_applications ja3 WHERE ja3.job_id = j.id AND ja3.applicant_id = $2 LIMIT 1
           ) AS application_status_by_user
    FROM jobs j
    JOIN users u ON j.posted_by = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE j.id = $1;
  `;

  const result = await db.query(queryText, [jobId, authUserId]);

  if (result.rows.length === 0) {
    const err = new Error(`Job posting not found with ID '${jobId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const job = formatJobDTO(result.rows[0], authUserId);
  return { job };
};

const updateJob = async (user, jobId, updateData) => {
  const jobRes = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
  if (jobRes.rows.length === 0) {
    const err = new Error(`Job posting not found with ID '${jobId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const job = jobRes.rows[0];
  if (job.posted_by !== user.id) {
    const err = new Error('Only the alumnus who posted this job opportunity can edit it');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const title = (updateData.title || job.title).trim();
  const company = (updateData.company || job.company).trim();
  const location = (updateData.location || job.location).trim();
  const description = (updateData.description || job.description).trim();
  const salary = updateData.salary || updateData.stipend || job.salary;
  const type = updateData.type || job.type;
  const status = updateData.status || job.status;
  const skillsStr = Array.isArray(updateData.skills) ? updateData.skills.join(',') : (updateData.skills || job.skills);

  await db.query(
    `UPDATE jobs 
     SET title = $1, company = $2, location = $3, description = $4, salary = $5, type = $6, status = $7, skills = $8, updated_at = NOW() 
     WHERE id = $9`,
    [title, company, location, description, salary, type, status, skillsStr, jobId]
  );

  return getJobById(user.id, jobId);
};

const deleteJob = async (user, jobId) => {
  const jobRes = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
  if (jobRes.rows.length === 0) {
    const err = new Error(`Job posting not found with ID '${jobId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const job = jobRes.rows[0];
  if (job.posted_by !== user.id) {
    const err = new Error('Only the alumnus who posted this job opportunity can delete it');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  await db.query('DELETE FROM jobs WHERE id = $1', [jobId]);
  return { success: true, message: 'Job posting deleted successfully' };
};

const toggleBookmarkJob = async (user, jobId) => {
  if (user.account_status === 'DISABLED') {
    const err = new Error('Disabled accounts cannot bookmark jobs');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  const jobRes = await db.query('SELECT id FROM jobs WHERE id = $1', [jobId]);
  if (jobRes.rows.length === 0) {
    const err = new Error(`Job posting not found with ID '${jobId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const existing = await db.query('SELECT id FROM job_bookmarks WHERE job_id = $1 AND user_id = $2', [jobId, user.id]);
  let isBookmarked = false;

  if (existing.rows.length > 0) {
    await db.query('DELETE FROM job_bookmarks WHERE job_id = $1 AND user_id = $2', [jobId, user.id]);
    isBookmarked = false;
  } else {
    await db.query(
      `INSERT INTO job_bookmarks (job_id, user_id) VALUES ($1, $2) ON CONFLICT (job_id, user_id) DO NOTHING`,
      [jobId, user.id]
    );
    isBookmarked = true;
  }

  return {
    jobId,
    isBookmarked,
    isSaved: isBookmarked,
    savedByCurrentUser: isBookmarked,
  };
};

const applyForJob = async (user, jobId, applicationData = {}) => {
  if (user.account_status === 'DISABLED') {
    const err = new Error('Disabled accounts cannot submit job applications');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  const jobRes = await db.query('SELECT id, posted_by, title, status FROM jobs WHERE id = $1', [jobId]);
  if (jobRes.rows.length === 0) {
    const err = new Error(`Job posting not found with ID '${jobId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const job = jobRes.rows[0];

  if ((job.status || '').toUpperCase() !== 'OPEN') {
    const err = new Error('This job opening is currently closed and no longer accepting applications');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  const existingApp = await db.query('SELECT id FROM job_applications WHERE job_id = $1 AND applicant_id = $2', [jobId, user.id]);
  if (existingApp.rows.length > 0) {
    const err = new Error('You have already submitted an application/referral request for this job');
    err.statusCode = 409;
    err.errorCode = 'CONFLICT';
    throw err;
  }

  const appId = crypto.randomUUID();
  const resumeUrl = applicationData.resumeUrl || null;
  const coverNote = (applicationData.coverNote || applicationData.message || '').trim();

  await db.query(
    `INSERT INTO job_applications (id, job_id, applicant_id, resume_url, cover_note, status)
     VALUES ($1, $2, $3, $4, $5, 'APPLIED')`,
    [appId, jobId, user.id, resumeUrl, coverNote]
  );

  // Trigger Notification to Job Poster
  const applicantName = await getUserName(user.id);
  await notificationService.createNotification({
    recipientId: job.posted_by,
    actorId: user.id,
    type: 'JOB_APPLICATION',
    title: 'New job referral request',
    message: `${applicantName} applied for your job opening: ${job.title}`,
    entityType: 'JOB',
    entityId: jobId,
  });

  const countRes = await db.query('SELECT COUNT(*) AS count FROM job_applications WHERE job_id = $1', [jobId]);
  const applicantsCount = parseInt(countRes.rows[0].count, 10);

  return {
    application: {
      id: appId,
      jobId,
      applicantId: user.id,
      resumeUrl,
      coverNote,
      status: 'APPLIED',
      createdAt: new Date().toISOString(),
    },
    applicantsCount,
    hasApplied: true,
    applicationStatus: 'APPLIED',
  };
};

const getMyApplications = async (user) => {
  const query = `
    SELECT ja.id AS application_id, ja.status AS application_status, ja.created_at AS applied_at,
           j.id AS job_id, j.title, j.company, j.location, j.type, j.salary, j.status AS job_status,
           u.id AS poster_id, p.full_name AS poster_name
    FROM job_applications ja
    JOIN jobs j ON ja.job_id = j.id
    JOIN users u ON j.posted_by = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE ja.applicant_id = $1
    ORDER BY ja.created_at DESC;
  `;

  const result = await db.query(query, [user.id]);
  return { applications: result.rows };
};

const getMyBookmarks = async (user) => {
  const query = `
    SELECT j.*,
           u.email AS poster_email, u.role AS poster_role,
           p.full_name AS poster_name, p.avatar_url AS poster_avatar,
           p.graduation_year AS poster_graduation_year,
           p.company AS poster_company, p.designation AS poster_designation,
           (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) AS applicants_count
    FROM job_bookmarks jb
    JOIN jobs j ON jb.job_id = j.id
    JOIN users u ON j.posted_by = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE jb.user_id = $1
    ORDER BY jb.created_at DESC;
  `;

  const result = await db.query(query, [user.id]);
  const jobs = result.rows.map((row) => formatJobDTO(row, user.id));
  return { jobs };
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  toggleBookmarkJob,
  applyForJob,
  getMyApplications,
  getMyBookmarks,
};
