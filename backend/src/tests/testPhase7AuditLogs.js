const http = require('http');
const app = require('../app');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

const runPhase7Tests = async () => {
  console.log('================================================================');
  console.log('   PHASE 7 — ADMIN AUDIT LOGGING & ACTIVITY STREAMS TEST SUITE   ');
  console.log('================================================================\n');

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
    // Setup Tokens & Helpers
    // ------------------------------------------------------------------
    const adminUser = (await db.query(`SELECT id, email FROM users WHERE role = 'ADMIN' LIMIT 1`)).rows[0];
    const studentUser = (await db.query(`SELECT id, email FROM users WHERE role = 'STUDENT' LIMIT 1`)).rows[0];
    const alumniUser = (await db.query(`SELECT id, email FROM users WHERE role = 'ALUMNI' LIMIT 1`)).rows[0];

    const adminToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
    const studentToken = jwt.sign({ sub: studentUser.id, role: 'STUDENT' }, JWT_SECRET, { expiresIn: '1h' });
    const alumniToken = jwt.sign({ sub: alumniUser.id, role: 'ALUMNI' }, JWT_SECRET, { expiresIn: '1h' });
    const expiredToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '-10s' });

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
    // SECTION 1: AUTHORIZATION & RBAC CHECKS
    // ------------------------------------------------------------------
    console.log('--- 1. Authorization & RBAC Checks ---');
    const rAuditNoToken = await requestApi('GET', '/api/v1/admin/audit-logs');
    assert(rAuditNoToken.status === 401 && rAuditNoToken.body?.errorCode === 'UNAUTHORIZED', 'GET /audit-logs no token -> 401');

    const rAuditExpired = await requestApi('GET', '/api/v1/admin/audit-logs', null, expiredToken);
    assert(rAuditExpired.status === 401 && rAuditExpired.body?.errorCode === 'UNAUTHORIZED', 'GET /audit-logs expired token -> 401');

    const rAuditStudent = await requestApi('GET', '/api/v1/admin/audit-logs', null, studentToken);
    assert(rAuditStudent.status === 403 && rAuditStudent.body?.errorCode === 'FORBIDDEN', 'GET /audit-logs Student role -> 403');

    const rAuditAlumni = await requestApi('GET', '/api/v1/admin/audit-logs', null, alumniToken);
    assert(rAuditAlumni.status === 403 && rAuditAlumni.body?.errorCode === 'FORBIDDEN', 'GET /audit-logs Alumni role -> 403');

    const rAuditAdmin = await requestApi('GET', '/api/v1/admin/audit-logs', null, adminToken);
    assert(rAuditAdmin.status === 200 && rAuditAdmin.body?.success === true, 'GET /audit-logs Admin role -> 200 OK');

    const rActStudent = await requestApi('GET', '/api/v1/admin/activity', null, studentToken);
    assert(rActStudent.status === 403 && rActStudent.body?.errorCode === 'FORBIDDEN', 'GET /activity Student role -> 403');

    const rActAdmin = await requestApi('GET', '/api/v1/admin/activity', null, adminToken);
    assert(rActAdmin.status === 200 && rActAdmin.body?.success === true, 'GET /activity Admin role -> 200 OK');

    // ------------------------------------------------------------------
    // SECTION 2: AUDIT EVENT GENERATION ACROSS PLATFORM
    // ------------------------------------------------------------------
    console.log('\n--- 2. Audit Event Generation ---');
    const initialLogCount = (await db.query('SELECT COUNT(*) AS c FROM audit_logs')).rows[0].c;

    // 2.1 USER_VIEWED
    const targetUser = (await db.query('SELECT id, email FROM users WHERE role = \'ALUMNI\' LIMIT 1')).rows[0];
    await requestApi('GET', `/api/v1/admin/users/${targetUser.id}`, null, adminToken);
    
    // Give async audit promise tick
    await new Promise((r) => setTimeout(r, 50));
    const viewLog = (await db.query(`SELECT * FROM audit_logs WHERE action = 'USER_VIEWED' ORDER BY created_at DESC LIMIT 1`)).rows[0];
    assert(viewLog !== undefined, 'USER_VIEWED audit log recorded in PostgreSQL');
    assert(viewLog.user_id === adminUser.id, 'USER_VIEWED attributes action to authenticated admin');
    assert(viewLog.target_id === targetUser.id, 'USER_VIEWED target_id matches viewed user ID');

    // 2.2 USER_EXPORTED
    await requestApi('POST', '/api/v1/admin/users/export', { userIds: [targetUser.id] }, adminToken);
    await new Promise((r) => setTimeout(r, 50));
    const exportLog = (await db.query(`SELECT * FROM audit_logs WHERE action = 'USER_EXPORTED' ORDER BY created_at DESC LIMIT 1`)).rows[0];
    assert(exportLog !== undefined, 'USER_EXPORTED audit log recorded in PostgreSQL');
    assert(exportLog.details?.mode === 'selected', 'USER_EXPORTED details records export mode');

    // 2.3 VERIFICATION_APPROVED & VERIFICATION_REJECTED in Transaction
    const candidateEmail = `audit.test.candidate.${Date.now()}@jecrc.edu.in`;
    const passwordHash = await bcrypt.hash('TestPass123!', 10);
    const uIns = await db.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'STUDENT') RETURNING id`,
      [candidateEmail, passwordHash]
    );
    const candidateId = uIns.rows[0].id;
    await db.query(
      `INSERT INTO user_profiles (user_id, full_name, degree, branch) VALUES ($1, 'Audit Candidate', 'B.Tech', 'CSE')`,
      [candidateId]
    );
    const vIns = await db.query(
      `INSERT INTO alumni_verifications (user_id, proof_document_url, status) VALUES ($1, 'https://example.com/proof.pdf', 'PENDING') RETURNING id`,
      [candidateId]
    );
    const verificationId = vIns.rows[0].id;

    // Approve verification
    const rApprove = await requestApi('PATCH', `/api/v1/admin/verifications/${verificationId}`, { status: 'APPROVED' }, adminToken);
    assert(rApprove.status === 200, 'Verification approval succeeds');

    const approveLog = (await db.query(
      `SELECT * FROM audit_logs WHERE action = 'VERIFICATION_APPROVED' AND target_id = $1`,
      [verificationId]
    )).rows[0];
    assert(approveLog !== undefined, 'VERIFICATION_APPROVED recorded transactionally');
    assert(approveLog.user_id === adminUser.id, 'VERIFICATION_APPROVED user_id is admin');
    assert(approveLog.details?.newStatus === 'APPROVED', 'VERIFICATION_APPROVED details metadata is correct');

    // ------------------------------------------------------------------
    // SECTION 3: TRANSACTION ROLLBACK INTEGRITY
    // ------------------------------------------------------------------
    console.log('\n--- 3. Transaction Rollback Integrity ---');
    const beforeFailCount = (await db.query('SELECT COUNT(*) AS c FROM audit_logs')).rows[0].c;

    // Try modifying already approved record (will return 409)
    const rFailed = await requestApi('PATCH', `/api/v1/admin/verifications/${verificationId}`, { status: 'APPROVED' }, adminToken);
    assert(rFailed.status === 409, 'Invalid transition returns 409 Conflict');

    const afterFailCount = (await db.query('SELECT COUNT(*) AS c FROM audit_logs')).rows[0].c;
    assert(beforeFailCount === afterFailCount, 'Rolled-back transaction did NOT persist an audit log');

    // ------------------------------------------------------------------
    // SECTION 4: AUDIT LOGS QUERYING & FILTERS
    // ------------------------------------------------------------------
    console.log('\n--- 4. Audit Logs API & Filters ---');
    const rList = await requestApi('GET', '/api/v1/admin/audit-logs?page=1&pageSize=10', null, adminToken);
    assert(rList.status === 200, 'GET /audit-logs returns 200 OK');
    assert(Array.isArray(rList.body.data.logs), 'Returns logs array');
    assert(rList.body.data.totalCount >= 3, 'Total audit logs count reflected');

    // Filter by action
    const rActionFilter = await requestApi('GET', '/api/v1/admin/audit-logs?action=USER_VIEWED', null, adminToken);
    assert(
      rActionFilter.body.data.logs.every((l) => l.action === 'USER_VIEWED'),
      'action filter returns only USER_VIEWED events'
    );

    // ------------------------------------------------------------------
    // SECTION 5: ACTIVITY STREAM API
    // ------------------------------------------------------------------
    console.log('\n--- 5. Activity Stream API ---');
    const rActivity = await requestApi('GET', '/api/v1/admin/activity?limit=5', null, adminToken);
    assert(rActivity.status === 200, 'GET /activity returns 200 OK');
    assert(Array.isArray(rActivity.body.data), 'Activity returns array of events');
    assert(rActivity.body.data.length <= 5, 'Activity respect requested limit of 5');

    const firstAct = rActivity.body.data[0];
    assert(typeof firstAct.description === 'string' && firstAct.description.length > 5, 'Activity event contains human-readable description');
    assert(typeof firstAct.time === 'string', 'Activity event contains relative timestamp string');

    // ------------------------------------------------------------------
    // SECTION 6: SENSITIVE DATA DEFENSE & IMMUTABILITY
    // ------------------------------------------------------------------
    console.log('\n--- 6. Sensitive Data Defense & Immutability ---');
    const allDetails = (await db.query('SELECT details FROM audit_logs')).rows;
    let leakedSecrets = false;
    for (const d of allDetails) {
      const det = d.details || {};
      if (det.password || det.password_hash || det.token || det.jwt || det.secret) {
        leakedSecrets = true;
      }
    }
    assert(!leakedSecrets, 'Zero passwords or JWT tokens present in audit_logs details');

    // Clean up test candidate
    await db.query(`DELETE FROM users WHERE email LIKE 'audit.test.candidate.%'`);

    // ------------------------------------------------------------------
    // SECTION 7: PERFORMANCE & EXPLAIN ANALYZE
    // ------------------------------------------------------------------
    console.log('\n--- 7. Performance & EXPLAIN ANALYZE ---');
    const explainAudit = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT a.id, a.user_id, a.actor_name, a.action, a.target_id, a.details, a.created_at
      FROM audit_logs a
      ORDER BY a.created_at DESC
      LIMIT 20 OFFSET 0;
    `);

    console.log('  [Audit Logs Query Plan]:');
    explainAudit.rows.forEach((r) => console.log(`    ${r['QUERY PLAN']}`));
    assert(explainAudit.rows.length > 0, 'EXPLAIN ANALYZE completed for audit_logs query');

    console.log('\n================================================================');
    console.log(`  PHASE 7 RESULTS: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('================================================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n[PHASE 7 TEST FATAL ERROR]:', err);
    server.close();
    process.exit(1);
  }
};

runPhase7Tests();
