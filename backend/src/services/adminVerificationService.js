const db = require('../config/db');

/**
 * Formats a raw database row into an API-ready verification record
 */
const formatVerificationRecord = (row) => ({
  id: row.id,
  userId: row.user_id,
  name: row.full_name || (row.email ? row.email.split('@')[0] : 'Alumni Candidate'),
  email: row.email || null,
  avatar: row.avatar_url || null,
  currentRole: row.designation || null,
  designation: row.designation || null,
  company: row.company || null,
  degree: row.degree || 'B.Tech',
  course: row.course || null,
  branch: row.branch || null,
  universityRollNumber: row.university_roll_number || null,
  joiningYear: row.joining_year || null,
  graduationYear: row.graduation_year || null,
  batch: row.graduation_year || row.current_year || null,
  location: row.location || null,
  linkedinUrl: row.linkedin_url || null,
  proofDocument: row.proof_document_url ? row.proof_document_url.split('/').pop() : 'Degree Certificate',
  proofDocumentUrl: row.proof_document_url || null,
  status: row.status,
  rejectionReason: row.rejection_reason || null,
  submittedAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
  reviewedBy: row.reviewed_by || null,
  reviewerName: row.reviewer_name || null,
});

/**
 * Fetch verification queue records with search, filtering, and pagination
 */
const getVerifications = async (options = {}) => {
  const {
    status,
    q,
    page = 1,
    pageSize,
    limit,
  } = options;

  const whereClauses = [];
  const queryParams = [];

  // 1. Status Filter
  if (status && status !== 'all') {
    const upperStatus = String(status).trim().toUpperCase();
    if (['PENDING', 'APPROVED', 'REJECTED'].includes(upperStatus)) {
      queryParams.push(upperStatus);
      whereClauses.push(`av.status = $${queryParams.length}`);
    }
  }

  // 2. Search Query Filter
  if (q && String(q).trim()) {
    queryParams.push(`%${String(q).trim()}%`);
    const idx = queryParams.length;
    whereClauses.push(`(
      p.full_name ILIKE $${idx} OR
      u.email ILIKE $${idx} OR
      p.company ILIKE $${idx} OR
      p.designation ILIKE $${idx} OR
      p.branch ILIKE $${idx} OR
      p.university_roll_number ILIKE $${idx}
    )`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const parsedPage = parseInt(page, 10);
  const validatedPage = !isNaN(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const parsedPageSize = parseInt(pageSize || limit, 10);
  const validatedPageSize = !isNaN(parsedPageSize) && parsedPageSize >= 1 ? Math.min(100, parsedPageSize) : 20;
  const offset = (validatedPage - 1) * validatedPageSize;

  // Count Query
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM alumni_verifications av
    JOIN users u ON av.user_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ${whereSql};
  `;
  const countResult = await db.query(countQuery, queryParams);
  const totalCount = parseInt(countResult.rows[0]?.total, 10) || 0;
  const totalPages = Math.ceil(totalCount / validatedPageSize) || 1;

  // Data Query
  const dataQueryParams = [...queryParams, validatedPageSize, offset];
  const limitIdx = queryParams.length + 1;
  const offsetIdx = queryParams.length + 2;

  const dataQuery = `
    SELECT
        av.id,
        av.user_id,
        av.proof_document_url,
        av.status,
        av.rejection_reason,
        av.reviewed_by,
        av.reviewed_at,
        av.created_at,
        av.updated_at,
        u.email,
        u.role,
        p.full_name,
        p.avatar_url,
        p.degree,
        p.course,
        p.branch,
        p.university_roll_number,
        p.joining_year,
        p.graduation_year,
        p.current_year,
        p.company,
        p.designation,
        p.location,
        p.linkedin_url,
        COALESCE(rp.full_name, ru.email) AS reviewer_name
    FROM alumni_verifications av
    JOIN users u ON av.user_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    LEFT JOIN users ru ON av.reviewed_by = ru.id
    LEFT JOIN user_profiles rp ON ru.id = rp.user_id
    ${whereSql}
    ORDER BY 
        CASE WHEN av.status = 'PENDING' THEN 0 ELSE 1 END,
        av.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx};
  `;

  const result = await db.query(dataQuery, dataQueryParams);
  const verifications = result.rows.map(formatVerificationRecord);

  return {
    verifications,
    totalCount,
    page: validatedPage,
    pageSize: validatedPageSize,
    totalPages,
    hasNext: validatedPage < totalPages,
    hasPrev: validatedPage > 1,
  };
};

/**
 * Updates verification record status (APPROVED / REJECTED) inside a transaction
 */
const updateVerificationStatus = async (id, { status, rejectionReason, reviewerId }) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock and inspect verification row (by verification ID or user ID)
    let checkRes = await client.query(
      `SELECT id, user_id, status FROM alumni_verifications WHERE id = $1 FOR UPDATE;`,
      [id]
    );

    if (checkRes.rows.length === 0) {
      checkRes = await client.query(
        `SELECT id, user_id, status FROM alumni_verifications WHERE user_id = $1 FOR UPDATE;`,
        [id]
      );
    }

    if (checkRes.rows.length === 0) {
      const userRes = await client.query(
        `SELECT id, account_status FROM users WHERE id = $1 FOR UPDATE;`,
        [id]
      );
      if (userRes.rows.length > 0) {
        await client.query('ROLLBACK');
        client.release();
        if (String(status).toUpperCase() === 'APPROVED') {
          return await approveUserById(id, reviewerId);
        } else if (String(status).toUpperCase() === 'REJECTED') {
          return await rejectUserById(id, { rejectionReason, reviewerId });
        }
      }

      const err = new Error(`Verification record not found with ID: ${id}`);
      err.statusCode = 404;
      err.errorCode = 'VERIFICATION_NOT_FOUND';
      throw err;
    }

    const currentRecord = checkRes.rows[0];

    // Self-approval defense
    if (currentRecord.user_id === reviewerId) {
      const err = new Error('Admin users cannot approve their own verification request.');
      err.statusCode = 400;
      err.errorCode = 'CANNOT_APPROVE_SELF';
      throw err;
    }

    // 2. Validate state transition
    if (currentRecord.status !== 'PENDING') {
      const err = new Error(`Verification record is already in ${currentRecord.status} status and cannot be modified.`);
      err.statusCode = 409;
      err.errorCode = 'INVALID_STATE_TRANSITION';
      throw err;
    }

    const normStatus = String(status).trim().toUpperCase();
    if (!['APPROVED', 'REJECTED'].includes(normStatus)) {
      const err = new Error(`Invalid verification status: "${status}". Must be APPROVED or REJECTED.`);
      err.statusCode = 400;
      err.errorCode = 'INVALID_STATUS';
      throw err;
    }

    if (normStatus === 'REJECTED') {
      if (!rejectionReason || !String(rejectionReason).trim()) {
        const err = new Error('Rejection reason is required when rejecting a verification request.');
        err.statusCode = 400;
        err.errorCode = 'MISSING_REJECTION_REASON';
        throw err;
      }
      if (String(rejectionReason).length > 1000) {
        const err = new Error('Rejection reason must be 1000 characters or less.');
        err.statusCode = 400;
        err.errorCode = 'INVALID_REJECTION_REASON';
        throw err;
      }
    }

    // 3. Update Verification Record
    const updateQuery = `
      UPDATE alumni_verifications
      SET status = $1,
          reviewed_by = $2,
          reviewed_at = CURRENT_TIMESTAMP,
          rejection_reason = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4;
    `;
    await client.query(updateQuery, [
      normStatus,
      reviewerId,
      normStatus === 'REJECTED' ? String(rejectionReason).trim() : null,
      id,
    ]);

    // 4. Update related user profile role & account_status
    if (normStatus === 'APPROVED') {
      await client.query(
        `UPDATE users SET role = 'ALUMNI', account_status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
        [currentRecord.user_id]
      );
    } else if (normStatus === 'REJECTED') {
      await client.query(
        `UPDATE users SET account_status = 'REJECTED', updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
        [currentRecord.user_id]
      );
    }

    // 5. Send notification to recipient user
    const notifType = normStatus === 'APPROVED' ? 'ALUMNI_VERIFICATION_APPROVED' : 'ALUMNI_VERIFICATION_REJECTED';
    const notifTitle = normStatus === 'APPROVED' ? 'Alumni Account Approved' : 'Alumni Verification Rejected';
    const notifMsg = normStatus === 'APPROVED'
      ? 'Your Alumni account has been approved by administrator. Welcome to the Alumni Network!'
      : `Your Alumni verification request was rejected. Reason: ${String(rejectionReason).trim()}`;

    await client.query(
      `INSERT INTO notifications (id, recipient_id, user_id, type, title, message, actor_name, created_at)
       VALUES (gen_random_uuid(), $1, $1, $2, $3, $4, 'System Admin', NOW());`,
      [currentRecord.user_id, notifType, notifTitle, notifMsg]
    );

    // Send transactional email (non-blocking)
    const emailService = require('../email/emailService');
    const recipientUserRes = await client.query('SELECT email FROM users WHERE id = $1', [currentRecord.user_id]);
    const recipientProfileRes = await client.query('SELECT full_name FROM user_profiles WHERE user_id = $1', [currentRecord.user_id]);
    const recipientEmail = recipientUserRes.rows[0]?.email;
    const recipientName = recipientProfileRes.rows[0]?.full_name || 'Alumni Candidate';

    if (recipientEmail) {
      if (normStatus === 'APPROVED') {
        emailService.sendAlumniApprovedEmail(recipientEmail, recipientName, currentRecord.user_id)
          .catch((err) => console.warn('[Alumni Approved Email Dispatch Warning]', err.message));
      } else if (normStatus === 'REJECTED') {
        emailService.sendAlumniRejectedEmail(recipientEmail, recipientName, rejectionReason, currentRecord.user_id)
          .catch((err) => console.warn('[Alumni Rejected Email Dispatch Warning]', err.message));
      }
    }

    // 6. Fetch updated verification record
    const fetchUpdatedQuery = `
      SELECT
          av.id,
          av.user_id,
          av.proof_document_url,
          av.status,
          av.rejection_reason,
          av.reviewed_by,
          av.reviewed_at,
          av.created_at,
          av.updated_at,
          u.email,
          u.role,
          p.full_name,
          p.avatar_url,
          p.degree,
          p.course,
          p.branch,
          p.university_roll_number,
          p.joining_year,
          p.graduation_year,
          p.current_year,
          p.company,
          p.designation,
          p.location,
          p.linkedin_url,
          COALESCE(rp.full_name, ru.email) AS reviewer_name
      FROM alumni_verifications av
      JOIN users u ON av.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN users ru ON av.reviewed_by = ru.id
      LEFT JOIN user_profiles rp ON ru.id = rp.user_id
      WHERE av.id = $1;
    `;
    const updatedRes = await client.query(fetchUpdatedQuery, [id]);
    const updatedRow = updatedRes.rows[0];

    // 7. Record Transactional Audit Event
    const { logAdminAction } = require('./adminAuditService');
    await logAdminAction({
      client,
      adminUserId: reviewerId,
      actorName: updatedRow.reviewer_name,
      action: normStatus === 'APPROVED' ? 'ALUMNI_VERIFICATION_APPROVED' : 'ALUMNI_VERIFICATION_REJECTED',
      targetEntity: 'VERIFICATION',
      targetId: id,
      details: {
        targetUserId: currentRecord.user_id,
        targetUserName: updatedRow.full_name,
        previousStatus: 'PENDING',
        newStatus: normStatus,
        rejectionReason: normStatus === 'REJECTED' ? String(rejectionReason).trim() : undefined,
      },
    });

    await client.query('COMMIT');

    return formatVerificationRecord(updatedRow);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const approveUserById = async (userId, reviewerId) => {
  const verRes = await db.query(`SELECT id FROM alumni_verifications WHERE user_id = $1 AND status = 'PENDING' ORDER BY created_at DESC LIMIT 1`, [userId]);
  let verId;
  if (verRes.rows.length === 0) {
    const insertRes = await db.query(
      `INSERT INTO alumni_verifications (id, user_id, status, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, 'PENDING', NOW(), NOW()) RETURNING id`,
      [userId]
    );
    verId = insertRes.rows[0].id;
  } else {
    verId = verRes.rows[0].id;
  }

  return await updateVerificationStatus(verId, {
    status: 'APPROVED',
    reviewerId,
  });
};

const rejectUserById = async (userId, { rejectionReason, reviewerId }) => {
  const verRes = await db.query(`SELECT id FROM alumni_verifications WHERE user_id = $1 AND status = 'PENDING' ORDER BY created_at DESC LIMIT 1`, [userId]);
  let verId;
  if (verRes.rows.length === 0) {
    const insertRes = await db.query(
      `INSERT INTO alumni_verifications (id, user_id, status, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, 'PENDING', NOW(), NOW()) RETURNING id`,
      [userId]
    );
    verId = insertRes.rows[0].id;
  } else {
    verId = verRes.rows[0].id;
  }

  return await updateVerificationStatus(verId, {
    status: 'REJECTED',
    rejectionReason: rejectionReason || 'Registration request not approved by administration.',
    reviewerId,
  });
};

module.exports = {
  getVerifications,
  updateVerificationStatus,
  approveUserById,
  rejectUserById,
};
