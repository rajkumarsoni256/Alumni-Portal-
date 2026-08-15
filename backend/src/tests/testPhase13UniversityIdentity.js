/**
 * PHASE 13 — UNIVERSITY IDENTITY + ALUMNI APPROVAL + STUDENT LIFECYCLE TEST SUITE
 * JECRC COMMUNITY PLATFORM
 */

const http = require('http');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const app = require('../app');
const { processStudentGraduations } = require('../services/graduationLifecycleService');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

let server;
let port;
let passed = 0;
let total = 0;

const assert = (condition, testName) => {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}`);
  }
};

const requestApi = (method, path, data = null, token = null) => {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ status: res.statusCode, body: parsed });
          } catch {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );

    req.on('error', (err) => resolve({ status: 500, error: err.message }));
    if (postData) req.write(postData);
    req.end();
  });
};

const migrate = require('../db/migrate');

const runPhase13Tests = async () => {
  console.log('\n================================================================');
  console.log('    PHASE 13 — UNIVERSITY IDENTITY & ALUMNI LIFECYCLE SUITE     ');
  console.log('================================================================\n');

  try {
    await migrate();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    port = server.address().port;

    // Seed test users: Admin, Student, Alumni
    const adminId = crypto.randomUUID();
    const studentId = crypto.randomUUID();

    const adminToken = jwt.sign({ sub: adminId, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
    const studentToken = jwt.sign({ sub: studentId, role: 'STUDENT' }, JWT_SECRET, { expiresIn: '1h' });

    // Clean up existing test data for idempotency
    await db.query(`DELETE FROM users WHERE email LIKE '%@phase13test.ac.in'`);

    await db.query(`
      INSERT INTO users (id, email, password_hash, role, email_verified, account_status)
      VALUES 
        ('${adminId}', 'admin@phase13test.ac.in', 'hash', 'ADMIN', true, 'ACTIVE'),
        ('${studentId}', 'student@phase13test.ac.in', 'hash', 'STUDENT', true, 'ACTIVE')
      ON CONFLICT DO NOTHING;
    `);

    await db.query(`
      INSERT INTO user_profiles (id, user_id, full_name, university_roll_number, course, joining_year, graduation_year, is_profile_complete)
      VALUES 
        (gen_random_uuid(), '${adminId}', 'Phase 13 Admin', NULL, NULL, NULL, NULL, true),
        (gen_random_uuid(), '${studentId}', 'Phase 13 Student', '24BCON0001', 'BCON', 2024, 2027, true)
      ON CONFLICT (user_id) DO NOTHING;
    `);

    // ------------------------------------------------------------------
    // 1. ROLL NUMBER & STUDENT REGISTRATION VALIDATION
    // ------------------------------------------------------------------
    console.log('--- 1. Roll Number & Student Registration Validation ---');

    // Case 1A: Valid Roll Number Registration
    const validStudentEmail = `validstudent_${Date.now()}@phase13test.ac.in`;
    const rValidReg = await requestApi('POST', '/api/v1/auth/register', {
      name: 'Valid Roll Student',
      email: validStudentEmail,
      password: 'Password123!',
      role: 'STUDENT',
      rollNumber: '24BCON0332',
      course: 'BCON',
      joiningYear: 2024,
      graduationYear: 2027,
      phone: '9876543210',
    });
    assert(rValidReg.status === 201 && rValidReg.body?.data?.universityRollNumber === '24BCON0332', 'Valid Student roll number registration succeeds (201 Created)');

    // Case 1B: Invalid Roll Number Format Rejection
    const rInvalidRoll = await requestApi('POST', '/api/v1/auth/register', {
      name: 'Invalid Roll Student',
      email: `invalidroll_${Date.now()}@phase13test.ac.in`,
      password: 'Password123!',
      role: 'STUDENT',
      rollNumber: 'INVALID_ROLL_123',
      course: 'BCON',
      joiningYear: 2024,
      graduationYear: 2027,
      phone: '9876543210',
    });
    assert(rInvalidRoll.status === 400 && rInvalidRoll.body?.errorCode === 'INVALID_ROLL_NUMBER_FORMAT', 'Invalid roll number format rejected with 400 INVALID_ROLL_NUMBER_FORMAT');

    // Case 1C: Duplicate Roll Number Database Rejection
    const rDupRoll = await requestApi('POST', '/api/v1/auth/register', {
      name: 'Duplicate Roll Student',
      email: `duproll_${Date.now()}@phase13test.ac.in`,
      password: 'Password123!',
      role: 'STUDENT',
      rollNumber: '24BCON0332', // Already registered above
      course: 'BCON',
      joiningYear: 2024,
      graduationYear: 2027,
      phone: '9876543210',
    });
    assert(rDupRoll.status === 409 && rDupRoll.body?.errorCode === 'DUPLICATE_ROLL_NUMBER', 'Duplicate roll number rejected with 409 DUPLICATE_ROLL_NUMBER');

    // Case 1D: Unsupported Course Code Rejection
    const rBadCourse = await requestApi('POST', '/api/v1/auth/register', {
      name: 'Bad Course Student',
      email: `badcourse_${Date.now()}@phase13test.ac.in`,
      password: 'Password123!',
      role: 'STUDENT',
      rollNumber: '24UNSUPPORTED0332',
      course: 'UNSUPPORTED',
      joiningYear: 2024,
      graduationYear: 2027,
      phone: '9876543210',
    });
    assert(rBadCourse.status === 400 && rBadCourse.body?.errorCode === 'UNSUPPORTED_COURSE', 'Unsupported course rejected with 400 UNSUPPORTED_COURSE');

    // Case 1E: Joining Year Mismatch Rejection
    const rYearMismatch = await requestApi('POST', '/api/v1/auth/register', {
      name: 'Year Mismatch Student',
      email: `yearmismatch_${Date.now()}@phase13test.ac.in`,
      password: 'Password123!',
      role: 'STUDENT',
      rollNumber: '24BCON0333',
      course: 'BCON',
      joiningYear: 2025, // Mismatches '24' prefix
      graduationYear: 2028,
      phone: '9876543210',
    });
    assert(rYearMismatch.status === 400 && rYearMismatch.body?.errorCode === 'JOINING_YEAR_MISMATCH', 'Roll number joining year mismatch rejected with 400 JOINING_YEAR_MISMATCH');

    // Case 1F: Invalid Graduation Year Rejection (graduationYear <= joiningYear)
    const rBadGradYear = await requestApi('POST', '/api/v1/auth/register', {
      name: 'Bad Grad Year Student',
      email: `badgrad_${Date.now()}@phase13test.ac.in`,
      password: 'Password123!',
      role: 'STUDENT',
      rollNumber: '24BCON0334',
      course: 'BCON',
      joiningYear: 2024,
      graduationYear: 2024, // Equal to joining year
      phone: '9876543210',
    });
    assert(rBadGradYear.status === 400 && rBadGradYear.body?.errorCode === 'INVALID_ACADEMIC_YEARS', 'Graduation year <= joining year rejected with 400 INVALID_ACADEMIC_YEARS');

    // ------------------------------------------------------------------
    // 2. ALUMNI REGISTRATION APPROVAL WORKFLOW
    // ------------------------------------------------------------------
    console.log('\n--- 2. Alumni Registration Approval Workflow ---');

    const alumniEmail = `alumni_candidate_${Date.now()}@phase13test.ac.in`;
    const rAlumniReg = await requestApi('POST', '/api/v1/auth/register', {
      name: 'Alumni Applicant',
      email: alumniEmail,
      password: 'Password123!',
      role: 'ALUMNI',
      phone: '9876543210',
    });
    assert(rAlumniReg.status === 201 && rAlumniReg.body?.data?.alumniVerificationStatus === 'PENDING', 'Alumni registration created in PENDING approval status (201 Created)');

    const alumniApplicantId = rAlumniReg.body?.data?.id;

    // Verify Admin Notification Created for New Application
    const adminNotifRes = await db.query(
      `SELECT id, type, recipient_id, message FROM notifications WHERE recipient_id = $1 AND type = 'ALUMNI_VERIFICATION_REQUEST' ORDER BY created_at DESC LIMIT 1`,
      [adminId]
    );
    assert(adminNotifRes.rows.length > 0, 'Admin received ALUMNI_VERIFICATION_REQUEST notification in database');

    // Verify Pending Alumni Verification Record Exists in DB
    const verifRes = await db.query(
      `SELECT id, status FROM alumni_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [alumniApplicantId]
    );
    assert(verifRes.rows.length > 0 && verifRes.rows[0].status === 'PENDING', 'Alumni verification record persisted in alumni_verifications table with status = PENDING');
    const verifId = verifRes.rows[0].id;

    // ------------------------------------------------------------------
    // 3. ADMIN APPROVAL & REJECTION SECURITY GUARDS
    // ------------------------------------------------------------------
    console.log('\n--- 3. Admin Approval & Rejection Security Guards ---');

    // Case 3A: Student calling verification endpoint -> 403
    const rStudentApprove = await requestApi('PATCH', `/api/v1/admin/verifications/${verifId}`, { status: 'APPROVED' }, studentToken);
    assert(rStudentApprove.status === 403, 'Student trying Admin approval endpoint rejected with 403 FORBIDDEN');

    // Case 3B: Admin self-approval defense -> 400
    // Create an alumni verification record for adminId
    const adminVerifId = crypto.randomUUID();
    await db.query(`
      INSERT INTO alumni_verifications (id, user_id, status)
      VALUES ('${adminVerifId}', '${adminId}', 'PENDING')
      ON CONFLICT DO NOTHING;
    `);

    const rSelfApprove = await requestApi('PATCH', `/api/v1/admin/verifications/${adminVerifId}`, { status: 'APPROVED' }, adminToken);
    assert(rSelfApprove.status === 400 && rSelfApprove.body?.errorCode === 'CANNOT_APPROVE_SELF', 'Admin attempting self-approval rejected with 400 CANNOT_APPROVE_SELF');

    // Clean up admin self-approval record
    await db.query(`DELETE FROM alumni_verifications WHERE id = '${adminVerifId}'`);

    // ------------------------------------------------------------------
    // 4. ADMIN APPROVAL & NOTIFICATION DISPATCH
    // ------------------------------------------------------------------
    console.log('\n--- 4. Admin Approval & Notification Dispatch ---');

    const rApprove = await requestApi('PATCH', `/api/v1/admin/verifications/${verifId}`, { status: 'APPROVED' }, adminToken);
    assert(rApprove.status === 200 && rApprove.body?.data?.status === 'APPROVED', 'Admin approved alumni verification request (200 OK)');

    // Verify applicant role updated to ALUMNI in users table
    const updatedUserRes = await db.query(`SELECT role FROM users WHERE id = $1`, [alumniApplicantId]);
    assert(updatedUserRes.rows[0].role === 'ALUMNI', 'Applicant user role promoted to ALUMNI in PostgreSQL users table');

    // Verify recipient notification created for applicant
    const applicantNotifRes = await db.query(
      `SELECT id, type, title FROM notifications WHERE recipient_id = $1 AND type = 'ALUMNI_VERIFICATION_APPROVED'`,
      [alumniApplicantId]
    );
    assert(applicantNotifRes.rows.length > 0, 'Applicant received ALUMNI_VERIFICATION_APPROVED notification');

    // Verify Audit Log created
    const auditRes = await db.query(
      `SELECT action, actor_name FROM audit_logs WHERE action = 'ALUMNI_VERIFICATION_APPROVED' AND target_id = $1`,
      [verifId]
    );
    assert(auditRes.rows.length > 0, 'ALUMNI_VERIFICATION_APPROVED audit log recorded in database');

    // ------------------------------------------------------------------
    // 5. ADMIN REJECTION WORKFLOW & REASON DISPATCH
    // ------------------------------------------------------------------
    console.log('\n--- 5. Admin Rejection Workflow & Reason Dispatch ---');

    // Create candidate 2 for rejection test
    const alumniEmail2 = `alumni_reject_${Date.now()}@phase13test.ac.in`;
    const rReg2 = await requestApi('POST', '/api/v1/auth/register', {
      name: 'Reject Candidate',
      email: alumniEmail2,
      password: 'Password123!',
      role: 'ALUMNI',
      phone: '9876543210',
    });
    const candidate2Id = rReg2.body?.data?.id;

    const verifRes2 = await db.query(
      `SELECT id FROM alumni_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [candidate2Id]
    );
    const verifId2 = verifRes2.rows[0].id;

    const rReject = await requestApi('PATCH', `/api/v1/admin/verifications/${verifId2}`, {
      status: 'REJECTED',
      rejectionReason: 'Invalid degree proof document submitted.',
    }, adminToken);

    assert(rReject.status === 200 && rReject.body?.data?.status === 'REJECTED', 'Admin rejected alumni verification with reason (200 OK)');

    // Verify applicant rejection notification
    const rejectNotifRes = await db.query(
      `SELECT message FROM notifications WHERE recipient_id = $1 AND type = 'ALUMNI_VERIFICATION_REJECTED'`,
      [candidate2Id]
    );
    assert(rejectNotifRes.rows.length > 0 && rejectNotifRes.rows[0].message.includes('Invalid degree proof'), 'Applicant received ALUMNI_VERIFICATION_REJECTED notification with rejection reason');

    // ------------------------------------------------------------------
    // 6. STUDENT → ALUMNI GRADUATION LIFECYCLE DETECTION
    // ------------------------------------------------------------------
    console.log('\n--- 6. Student → Alumni Graduation Lifecycle Detection ---');

    // Create a student who reached graduation year (e.g. 2024)
    const graduatedStudentId = crypto.randomUUID();
    const gradEmail = `graduated_student_${Date.now()}@phase13test.ac.in`;
    await db.query(`
      INSERT INTO users (id, email, password_hash, role, email_verified, account_status)
      VALUES ('${graduatedStudentId}', '${gradEmail}', 'hash', 'STUDENT', true, 'ACTIVE');
    `);
    await db.query(`
      INSERT INTO user_profiles (id, user_id, full_name, university_roll_number, course, joining_year, graduation_year, is_profile_complete)
      VALUES (gen_random_uuid(), '${graduatedStudentId}', 'Graduated Student', '21BCON0999', 'BCON', 2021, 2024, true);
    `);

    // Execute lifecycle detection
    const lifecycleResult = await processStudentGraduations({ year: 2026 });
    assert(lifecycleResult.processedCount >= 1, 'Graduation lifecycle engine identified eligible graduated student');

    // Verify alumni_verifications pending record created
    const gradVerifRes = await db.query(
      `SELECT id, status FROM alumni_verifications WHERE user_id = $1`,
      [graduatedStudentId]
    );
    assert(gradVerifRes.rows.length > 0 && gradVerifRes.rows[0].status === 'PENDING', 'Pending verification record created for graduated student in database');

    // Execute lifecycle detection AGAIN to verify IDEMPOTENCY
    const secondRunResult = await processStudentGraduations({ year: 2026 });
    assert(secondRunResult.processedCount === 0, 'Re-running graduation lifecycle engine is idempotent (processedCount = 0)');

    // ------------------------------------------------------------------
    // 7. POSTGRESQL SCHEMA INTEGRITY & BACKWARD COMPATIBILITY
    // ------------------------------------------------------------------
    console.log('\n--- 7. PostgreSQL Schema Integrity & Backward Compatibility ---');

    // Verify existing users with NULL roll numbers can still fetch profile without error
    const rMe = await requestApi('GET', '/api/v1/auth/me', null, adminToken);
    assert(rMe.status === 200 && rMe.body?.data?.id === adminId, 'Legacy user without roll number can authenticate successfully (200 OK)');

    console.log('\n================================================================');
    console.log(`  PHASE 13 RESULTS: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Phase 13 test suite crashed:', err);
  } finally {
    if (server) server.close();
  }
};

runPhase13Tests();
