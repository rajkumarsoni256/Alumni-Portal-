const crypto = require('crypto');
const db = require('../config/db');
const notificationService = require('./notificationService');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const formatRequestDTO = (row) => {
  return {
    id: row.id,
    requestId: row.id,
    studentId: row.student_id,
    mentorId: row.mentor_id,
    topic: row.topic,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    respondedAt: row.responded_at,
    student: {
      id: row.student_id,
      name: row.student_name || (row.student_email ? row.student_email.split('@')[0] : 'Student User'),
      email: row.student_email,
      role: 'student',
      avatar: row.student_avatar || null,
      branch: row.student_branch || 'B.Tech CSE',
      degree: row.student_degree || 'B.Tech',
      graduationYear: row.student_graduation_year || 2026,
    },
    mentor: {
      id: row.mentor_id,
      name: row.mentor_name || (row.mentor_email ? row.mentor_email.split('@')[0] : 'Alumni Mentor'),
      email: row.mentor_email,
      role: 'alumni',
      avatar: row.mentor_avatar || null,
      company: row.mentor_company || 'Tech Leader',
      designation: row.mentor_designation || 'Alumnus',
      location: row.mentor_location || 'Jaipur, India',
    },
  };
};

const getMentorshipRequests = async (user, queryParams = {}) => {
  const roleUpper = (user.role || '').toUpperCase();
  const whereClauses = [];
  const values = [];
  let paramIndex = 1;

  if (roleUpper === 'STUDENT') {
    whereClauses.push(`mr.student_id = $${paramIndex}`);
    values.push(user.id);
    paramIndex++;
  } else if (roleUpper === 'ALUMNI') {
    whereClauses.push(`mr.mentor_id = $${paramIndex}`);
    values.push(user.id);
    paramIndex++;
  } else if (roleUpper === 'ADMIN') {
    if (queryParams.studentId) {
      whereClauses.push(`mr.student_id = $${paramIndex}`);
      values.push(queryParams.studentId);
      paramIndex++;
    }
    if (queryParams.mentorId) {
      whereClauses.push(`mr.mentor_id = $${paramIndex}`);
      values.push(queryParams.mentorId);
      paramIndex++;
    }
  }

  if (queryParams.status) {
    whereClauses.push(`mr.status = $${paramIndex}`);
    values.push(queryParams.status.toUpperCase());
    paramIndex++;
  }

  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const queryText = `
    SELECT mr.*,
           su.email AS student_email, sp.full_name AS student_name, sp.avatar_url AS student_avatar,
           sp.branch AS student_branch, sp.degree AS student_degree, sp.graduation_year AS student_graduation_year,
           mu.email AS mentor_email, mp.full_name AS mentor_name, mp.avatar_url AS mentor_avatar,
           mp.company AS mentor_company, mp.designation AS mentor_designation, mp.location AS mentor_location
    FROM mentorship_requests mr
    JOIN users su ON mr.student_id = su.id
    LEFT JOIN user_profiles sp ON su.id = sp.user_id
    JOIN users mu ON mr.mentor_id = mu.id
    LEFT JOIN user_profiles mp ON mu.id = mp.user_id
    ${whereString}
    ORDER BY mr.created_at DESC;
  `;

  const result = await db.query(queryText, values);
  const requests = result.rows.map(formatRequestDTO);
  return { requests, total: requests.length };
};

const getMentorshipRequestById = async (user, requestId) => {
  if (!UUID_REGEX.test(requestId)) {
    const err = new Error('Invalid mentorship request ID format');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const queryText = `
    SELECT mr.*,
           su.email AS student_email, sp.full_name AS student_name, sp.avatar_url AS student_avatar,
           sp.branch AS student_branch, sp.degree AS student_degree, sp.graduation_year AS student_graduation_year,
           mu.email AS mentor_email, mp.full_name AS mentor_name, mp.avatar_url AS mentor_avatar,
           mp.company AS mentor_company, mp.designation AS mentor_designation, mp.location AS mentor_location
    FROM mentorship_requests mr
    JOIN users su ON mr.student_id = su.id
    LEFT JOIN user_profiles sp ON su.id = sp.user_id
    JOIN users mu ON mr.mentor_id = mu.id
    LEFT JOIN user_profiles mp ON mu.id = mp.user_id
    WHERE mr.id = $1;
  `;

  const result = await db.query(queryText, [requestId]);
  if (result.rows.length === 0) {
    const err = new Error(`Mentorship request not found with ID '${requestId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const reqRow = result.rows[0];
  const roleUpper = (user.role || '').toUpperCase();
  const isParticipant = reqRow.student_id === user.id || reqRow.mentor_id === user.id;

  if (!isParticipant && roleUpper !== 'ADMIN') {
    const err = new Error('You do not have authorization to view this mentorship request');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  return { request: formatRequestDTO(reqRow) };
};

const createMentorshipRequest = async (user, requestData) => {
  if (user.account_status === 'DISABLED') {
    const err = new Error('Disabled accounts cannot send mentorship requests');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  const roleUpper = (user.role || '').toUpperCase();
  if (roleUpper !== 'STUDENT') {
    const err = new Error('Only Student accounts can request 1-on-1 mentorship');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const { mentorId } = requestData;
  const topic = (requestData.topic || requestData.category || '').trim();
  const message = (requestData.message || requestData.reason || '').trim();

  if (!mentorId || !UUID_REGEX.test(mentorId)) {
    const err = new Error('Valid mentor ID is required');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  if (!topic || !message) {
    const err = new Error('Mentorship topic and message are required');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  if (user.id === mentorId) {
    const err = new Error('You cannot request mentorship from yourself');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  // Query PostgreSQL for mentor user & profile eligibility
  const mentorCheck = await db.query(
    `SELECT u.id, u.role, u.account_status, p.is_available_for_mentorship, p.full_name
     FROM users u
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE u.id = $1`,
    [mentorId]
  );

  if (mentorCheck.rows.length === 0) {
    const err = new Error(`Mentor not found with ID '${mentorId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const mentorUser = mentorCheck.rows[0];
  if ((mentorUser.role || '').toUpperCase() !== 'ALUMNI') {
    const err = new Error('Mentorship requests can only be sent to registered Alumni mentors');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  if (mentorUser.account_status !== 'ACTIVE') {
    const err = new Error('This Alumni mentor account is currently inactive');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  if (mentorUser.is_available_for_mentorship === false) {
    const err = new Error('This Alumni mentor is currently not accepting new mentorship requests');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  // Duplicate Active Request Protection (PENDING or ACCEPTED)
  const activeCheck = await db.query(
    `SELECT id, status FROM mentorship_requests
     WHERE student_id = $1 AND mentor_id = $2 AND status IN ('PENDING', 'ACCEPTED')`,
    [user.id, mentorId]
  );

  if (activeCheck.rows.length > 0) {
    const err = new Error('You already have an active or pending mentorship request with this Alumni mentor');
    err.statusCode = 409;
    err.errorCode = 'CONFLICT';
    throw err;
  }

  const requestId = crypto.randomUUID();
  await db.query(
    `INSERT INTO mentorship_requests (id, student_id, mentor_id, topic, message, status)
     VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
    [requestId, user.id, mentorId, topic, message]
  );

  // Fetch Student Name for notification
  const studentProfileRes = await db.query('SELECT full_name FROM user_profiles WHERE user_id = $1', [user.id]);
  const studentName = studentProfileRes.rows[0]?.full_name || (user.email ? user.email.split('@')[0] : 'A student');

  // Trigger Notification to Mentor
  await notificationService.createNotification({
    recipientId: mentorId,
    actorId: user.id,
    type: 'MENTORSHIP_REQUEST',
    title: 'New mentorship request',
    message: `${studentName} requested 1-on-1 mentorship: "${topic}"`,
    entityType: 'MENTORSHIP_REQUEST',
    entityId: requestId,
  });

  const createdReq = await getMentorshipRequestById(user, requestId);
  return createdReq;
};

const updateMentorshipRequestStatus = async (user, requestId, { status }) => {
  if (!UUID_REGEX.test(requestId)) {
    const err = new Error('Invalid mentorship request ID format');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const targetStatus = (status || '').toUpperCase();
  const validStatuses = ['ACCEPTED', 'DECLINED', 'CANCELLED'];
  if (!validStatuses.includes(targetStatus)) {
    const err = new Error(`Invalid status '${status}'. Must be ACCEPTED, DECLINED, or CANCELLED`);
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  if (user.account_status === 'DISABLED') {
    const err = new Error('Disabled accounts cannot perform mentorship actions');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const reqRes = await client.query(
      'SELECT * FROM mentorship_requests WHERE id = $1 FOR UPDATE',
      [requestId]
    );

    if (reqRes.rows.length === 0) {
      await client.query('ROLLBACK');
      const err = new Error(`Mentorship request not found with ID '${requestId}'`);
      err.statusCode = 404;
      err.errorCode = 'RESOURCE_NOT_FOUND';
      throw err;
    }

    const reqRow = reqRes.rows[0];

    // Status Transition Guard: Only PENDING requests can transition
    if (reqRow.status !== 'PENDING') {
      await client.query('ROLLBACK');
      const err = new Error(`Cannot update request status from '${reqRow.status}' to '${targetStatus}'`);
      err.statusCode = 400;
      err.errorCode = 'BAD_REQUEST';
      throw err;
    }

    // Ownership Guards
    if (targetStatus === 'ACCEPTED' || targetStatus === 'DECLINED') {
      if (reqRow.mentor_id !== user.id) {
        await client.query('ROLLBACK');
        const err = new Error('Only the assigned Alumni mentor can accept or decline this mentorship request');
        err.statusCode = 403;
        err.errorCode = 'FORBIDDEN';
        throw err;
      }
    } else if (targetStatus === 'CANCELLED') {
      if (reqRow.student_id !== user.id) {
        await client.query('ROLLBACK');
        const err = new Error('Only the requesting student can cancel this mentorship request');
        err.statusCode = 403;
        err.errorCode = 'FORBIDDEN';
        throw err;
      }
    }

    await client.query(
      `UPDATE mentorship_requests
       SET status = $1, responded_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [targetStatus, requestId]
    );

    await client.query('COMMIT');

    // Fetch Mentor Name for Notification
    const mentorProfileRes = await db.query('SELECT full_name FROM user_profiles WHERE user_id = $1', [reqRow.mentor_id]);
    const mentorName = mentorProfileRes.rows[0]?.full_name || 'Alumni Mentor';

    // Trigger Notification for Student when Accepted or Declined
    if (targetStatus === 'ACCEPTED') {
      await notificationService.createNotification({
        recipientId: reqRow.student_id,
        actorId: reqRow.mentor_id,
        type: 'MENTORSHIP_ACCEPTED',
        title: 'Mentorship request accepted',
        message: `${mentorName} accepted your 1-on-1 mentorship request!`,
        entityType: 'MENTORSHIP_REQUEST',
        entityId: requestId,
      });
    } else if (targetStatus === 'DECLINED') {
      await notificationService.createNotification({
        recipientId: reqRow.student_id,
        actorId: reqRow.mentor_id,
        type: 'MENTORSHIP_DECLINED',
        title: 'Mentorship request status update',
        message: `${mentorName} declined your mentorship request.`,
        entityType: 'MENTORSHIP_REQUEST',
        entityId: requestId,
      });
    }

    const updated = await getMentorshipRequestById(user, requestId);
    return updated;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  getMentorshipRequests,
  getMentorshipRequestById,
  createMentorshipRequest,
  updateMentorshipRequestStatus,
};
