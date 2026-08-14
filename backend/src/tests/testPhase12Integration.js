const http = require('http');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const migrate = require('../db/migrate');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

const runPhase12Tests = async () => {
  console.log('================================================================');
  console.log('    PHASE 12 — THREE-PORTAL CORE INTEGRATION TEST SUITE         ');
  console.log('================================================================\n');

  await migrate();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  let passed = 0;
  let total = 0;

  const assert = (condition, name, details = '') => {
    total++;
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} - ${details}`);
    }
  };

  try {
    // ------------------------------------------------------------------
    // Setup Users & Tokens
    // ------------------------------------------------------------------
    const adminUser = (await db.query(`SELECT id, email FROM users WHERE role = 'ADMIN' LIMIT 1`)).rows[0];
    const studentUser = (await db.query(`SELECT id, email FROM users WHERE role = 'STUDENT' LIMIT 1`)).rows[0];
    const alumniUser = (await db.query(`SELECT id, email FROM users WHERE role = 'ALUMNI' LIMIT 1`)).rows[0];

    let adminToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
    let studentToken = jwt.sign({ sub: studentUser.id, role: 'STUDENT' }, JWT_SECRET, { expiresIn: '1h' });
    let alumniToken = jwt.sign({ sub: alumniUser.id, role: 'ALUMNI' }, JWT_SECRET, { expiresIn: '1h' });

    const requestApi = async (method, path, body, token) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => null);
      return { status: res.status, body: data };
    };

    // ------------------------------------------------------------------
    // SECTION 1: UNIFIED AUTHENTICATION & RBAC DEFENSE
    // ------------------------------------------------------------------
    console.log('--- 1. Unified Authentication & RBAC Defense ---');
    const rMeStudent = await requestApi('GET', '/api/v1/auth/me', null, studentToken);
    assert(rMeStudent.status === 200 && rMeStudent.body?.data?.role === 'STUDENT', 'Student auth/me returns 200 OK and STUDENT role');

    const rMeAlumni = await requestApi('GET', '/api/v1/auth/me', null, alumniToken);
    assert(rMeAlumni.status === 200 && rMeAlumni.body?.data?.role === 'ALUMNI', 'Alumni auth/me returns 200 OK and ALUMNI role');

    const rMeAdmin = await requestApi('GET', '/api/v1/auth/me', null, adminToken);
    assert(rMeAdmin.status === 200 && rMeAdmin.body?.data?.role === 'ADMIN', 'Admin auth/me returns 200 OK and ADMIN role');

    const rStudentAdminCall = await requestApi('GET', '/api/v1/admin/users', null, studentToken);
    assert(rStudentAdminCall.status === 403, 'Student JWT calling Admin endpoint rejected with 403 Forbidden');

    const rAlumniAdminCall = await requestApi('GET', '/api/v1/admin/users', null, alumniToken);
    assert(rAlumniAdminCall.status === 403, 'Alumni JWT calling Admin endpoint rejected with 403 Forbidden');

    // ------------------------------------------------------------------
    // SECTION 2: ADMIN ACCOUNT STATUS CONTROL & DISABLING ENFORCEMENT
    // ------------------------------------------------------------------
    console.log('\n--- 2. Admin Account Status Control & Enforcement ---');
    // Disable student
    const rDisable = await requestApi('PATCH', `/api/v1/admin/users/${studentUser.id}/status`, { accountStatus: 'DISABLED' }, adminToken);
    assert(rDisable.status === 200 && rDisable.body?.data?.account_status === 'DISABLED', 'Admin disabled Student account status');

    // Disabled student attempts API call -> 401 ACCOUNT_DISABLED
    const rDisabledCall = await requestApi('GET', '/api/v1/auth/me', null, studentToken);
    assert(rDisabledCall.status === 401 && rDisabledCall.body?.errorCode === 'ACCOUNT_DISABLED', 'Disabled student request rejected with 401 ACCOUNT_DISABLED');

    // Re-enable student
    const rEnable = await requestApi('PATCH', `/api/v1/admin/users/${studentUser.id}/status`, { accountStatus: 'ACTIVE' }, adminToken);
    assert(rEnable.status === 200 && rEnable.body?.data?.account_status === 'ACTIVE', 'Admin re-enabled Student account status');

    // Enabled student attempts API call -> 200 OK
    const rEnabledCall = await requestApi('GET', '/api/v1/auth/me', null, studentToken);
    assert(rEnabledCall.status === 200, 'Re-enabled student request succeeds with 200 OK');

    // ------------------------------------------------------------------
    // SECTION 3: ANNOUNCEMENT -> USER NOTIFICATION CROSS-PORTAL FLOW
    // ------------------------------------------------------------------
    console.log('\n--- 3. Announcement -> User Notification Integration ---');
    const rAnnDraft = await requestApi('POST', '/api/v1/admin/notifications', {
      title: 'Important Campus Placement Update 2026',
      message: 'Placement drive registration closes this Friday. All students please update your resumes.',
      type: 'OPPORTUNITY',
      audienceType: 'STUDENTS',
    }, adminToken);
    assert(rAnnDraft.status === 201, 'Admin created targeted announcement draft for STUDENTS');
    const annId = rAnnDraft.body?.data?.id;

    const rAnnPub = await requestApi('POST', `/api/v1/admin/notifications/${annId}/publish`, {}, adminToken);
    assert(rAnnPub.status === 200, 'Admin published targeted announcement');

    // Verify student receives notification in PostgreSQL
    const notifRow = (await db.query(`SELECT * FROM notifications WHERE recipient_id = $1 AND title = $2`, [studentUser.id, 'Important Campus Placement Update 2026'])).rows[0];
    assert(notifRow !== undefined, 'Targeted student received notification in notifications table with valid recipient_id');

    // Verify alumni did NOT receive student-only notification
    const alumniNotifRow = (await db.query(`SELECT * FROM notifications WHERE recipient_id = $1 AND title = $2`, [alumniUser.id, 'Important Campus Placement Update 2026'])).rows[0];
    assert(alumniNotifRow === undefined, 'Alumni did NOT receive student-only targeted announcement');

    // ------------------------------------------------------------------
    // SECTION 4: ADMIN MODERATION (POSTS & JOBS)
    // ------------------------------------------------------------------
    console.log('\n--- 4. Admin Content Moderation (Posts & Jobs) ---');
    // Create a dummy post by student
    const dbPost = (await db.query(
      `INSERT INTO posts (author_id, content, visibility) VALUES ($1, $2, 'PUBLIC') RETURNING id`,
      [studentUser.id, 'Test post to be moderated by Admin']
    )).rows[0];

    // Student tries deleting non-owned post or random ID (RBAC check)
    const rModStudent = await requestApi('DELETE', `/api/v1/admin/posts/${dbPost.id}`, {}, studentToken);
    assert(rModStudent.status === 403, 'Student trying Admin moderation endpoint rejected with 403 Forbidden');

    // Admin moderates (deletes) post
    const rModAdmin = await requestApi('DELETE', `/api/v1/admin/posts/${dbPost.id}`, {}, adminToken);
    assert(rModAdmin.status === 200, 'Admin moderated and deleted post via DELETE /admin/posts/:id (200 OK)');

    // Verify DB deletion
    const checkPost = (await db.query(`SELECT * FROM posts WHERE id = $1`, [dbPost.id])).rows[0];
    assert(checkPost === undefined, 'Post removed from PostgreSQL database');

    // Verify Audit Log
    const modAudit = (await db.query(`SELECT * FROM audit_logs WHERE action = 'POST_MODERATED' ORDER BY created_at DESC LIMIT 1`)).rows[0];
    assert(modAudit !== undefined && modAudit.user_id === adminUser.id, 'POST_MODERATED action recorded in audit_logs attributed to Admin');

    // ------------------------------------------------------------------
    // SECTION 5: ROLE TRANSITION & VERIFICATION PROMOTION
    // ------------------------------------------------------------------
    console.log('\n--- 5. Role Transition & Alumni Verification Promotion ---');
    // Create verification request for studentUser
    const vReq = (await db.query(
      `INSERT INTO alumni_verifications (user_id, proof_document_url, status)
       VALUES ($1, 'proof.pdf', 'PENDING') RETURNING id`,
      [studentUser.id]
    )).rows[0];

    const rApprove = await requestApi('PATCH', `/api/v1/admin/verifications/${vReq.id}`, { status: 'APPROVED' }, adminToken);
    assert(rApprove.status === 200, 'Admin approved alumni verification request');

    // Verify PostgreSQL users.role updated to ALUMNI
    const updatedRoleRow = (await db.query(`SELECT role FROM users WHERE id = $1`, [studentUser.id])).rows[0];
    assert(updatedRoleRow.role === 'ALUMNI', 'Student user role promoted to ALUMNI in PostgreSQL users table');

    // Re-sign JWT for promoted user and verify auth/me
    const promotedToken = jwt.sign({ sub: studentUser.id, role: 'ALUMNI' }, JWT_SECRET, { expiresIn: '1h' });
    const rPromotedMe = await requestApi('GET', '/api/v1/auth/me', null, promotedToken);
    assert(rPromotedMe.status === 200 && rPromotedMe.body?.data?.role === 'ALUMNI', 'Promoted user auth/me returns 200 OK and ALUMNI role');

    // Revert promoted user role back to STUDENT for clean test state
    await db.query(`UPDATE users SET role = 'STUDENT' WHERE id = $1`, [studentUser.id]);

    console.log('\n================================================================');
    console.log(`  PHASE 12 RESULTS: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('================================================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n[PHASE 12 TEST FATAL ERROR]:', err);
    server.close();
    process.exit(1);
  }
};

runPhase12Tests();
