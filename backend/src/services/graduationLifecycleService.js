const db = require('../config/db');

/**
 * Student → Alumni Graduation Lifecycle Detection Service
 * Identifies active students whose graduation year has arrived/passed
 * and creates pending Alumni Verification requests idempotently.
 */
const processStudentGraduations = async (options = {}) => {
  const targetYear = options.year || new Date().getFullYear();

  // 1. Find active students with graduation_year <= targetYear
  const eligibleStudentsQuery = `
    SELECT u.id AS user_id, u.email, p.full_name, p.graduation_year, p.course
    FROM users u
    JOIN user_profiles p ON u.id = p.user_id
    WHERE u.role = 'STUDENT'
      AND u.account_status = 'ACTIVE'
      AND p.graduation_year IS NOT NULL
      AND p.graduation_year <= $1;
  `;

  const eligibleRes = await db.query(eligibleStudentsQuery, [targetYear]);
  const eligibleStudents = eligibleRes.rows;

  let processedCount = 0;
  let skippedCount = 0;
  const processedRecords = [];

  for (const student of eligibleStudents) {
    // 2. Check if verification request already exists
    const checkRes = await db.query(
      `SELECT id, status FROM alumni_verifications WHERE user_id = $1 LIMIT 1`,
      [student.user_id]
    );

    if (checkRes.rows.length > 0) {
      skippedCount++;
      continue; // Idempotently skip student with existing verification record
    }

    // 3. Create pending verification request
    const verRes = await db.query(
      `INSERT INTO alumni_verifications (id, user_id, proof_document_url, status, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, 'Graduation Year Reached', 'PENDING', NOW(), NOW())
       RETURNING id, status, created_at;`,
      [student.user_id]
    );

    const verRecord = verRes.rows[0];
    processedCount++;
    processedRecords.push({
      userId: student.user_id,
      email: student.email,
      name: student.full_name,
      graduationYear: student.graduation_year,
      verificationId: verRecord.id,
    });

    // 4. Notify active Admins
    const adminRes = await db.query(
      `SELECT id FROM users WHERE role = 'ADMIN' AND account_status = 'ACTIVE'`
    );

    for (const adminRow of adminRes.rows) {
      await db.query(
        `INSERT INTO notifications (id, recipient_id, user_id, type, title, message, actor_name, created_at)
         VALUES (gen_random_uuid(), $1, $2, 'ALUMNI_VERIFICATION_REQUEST', 'Graduation Transition Eligible', $3, $4, NOW());`,
        [
          adminRow.id,
          student.user_id,
          `Student ${student.full_name} (${student.email}) has reached graduation year ${student.graduation_year} and is eligible for Alumni verification.`,
          student.full_name || 'System Lifecycle',
        ]
      );
    }
  }

  return {
    targetYear,
    totalEligibleStudents: eligibleStudents.length,
    processedCount,
    skippedCount,
    processedRecords,
  };
};

module.exports = {
  processStudentGraduations,
};
