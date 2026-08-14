/**
 * Phase 12 — Admin Portal Hardening, Security & Production Readiness
 * Test Suite: Security, RBAC, Data Leakage, Input Validation, Persistence
 */

const http = require('http');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const migrate = require('../db/migrate');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

const runPhase12Tests = async () => {
  console.log('================================================================');
  console.log('  PHASE 12 — ADMIN PORTAL HARDENING & SECURITY TEST SUITE      ');
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
      console.error(`  [FAIL] ${name}${details ? ` — ${details}` : ''}`);
    }
  };

  const api = async (method, path, body, token) => {
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

  // ────────────────────────────────────────────────────────────────────────────
  // SETUP — Fetch real users and mint tokens
  // ────────────────────────────────────────────────────────────────────────────
  const adminUser   = (await db.query(`SELECT id, email FROM users WHERE role = 'ADMIN' LIMIT 1`)).rows[0];
  const studentUser = (await db.query(`SELECT id, email FROM users WHERE role = 'STUDENT' LIMIT 1`)).rows[0];
  const alumniUser  = (await db.query(`SELECT id, email FROM users WHERE role = 'ALUMNI' LIMIT 1`)).rows[0];

  if (!adminUser || !studentUser || !alumniUser) {
    throw new Error('Seed data missing: need at least one ADMIN, STUDENT, and ALUMNI user.');
  }

  const adminToken    = jwt.sign({ sub: adminUser.id,   role: 'ADMIN'   }, JWT_SECRET, { expiresIn: '1h' });
  const studentToken  = jwt.sign({ sub: studentUser.id, role: 'STUDENT' }, JWT_SECRET, { expiresIn: '1h' });
  const alumniToken   = jwt.sign({ sub: alumniUser.id,  role: 'ALUMNI'  }, JWT_SECRET, { expiresIn: '1h' });
  const expiredToken  = jwt.sign({ sub: adminUser.id,   role: 'ADMIN'   }, JWT_SECRET, { expiresIn: '-5s' });
  const wrongSecret   = jwt.sign({ sub: adminUser.id,   role: 'ADMIN'   }, 'wrong-secret-key');
  const malformedToken = 'eyInvalid.Token.Value';

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 1 — JWT Authentication Edge Cases
  // ────────────────────────────────────────────────────────────────────────────
  try {
    console.log('\n--- Section 1: JWT Authentication Edge Cases ---');

    const r1 = await api('GET', '/api/v1/admin/users');
    assert(r1.status === 401, '1.1 No token -> 401 Unauthorized');
    assert(r1.body?.errorCode === 'UNAUTHORIZED', '1.2 No token -> errorCode UNAUTHORIZED');

    const r2 = await api('GET', '/api/v1/admin/users', null, expiredToken);
    assert(r2.status === 401, '1.3 Expired token -> 401');
    assert(r2.body?.errorCode === 'UNAUTHORIZED', '1.4 Expired token -> errorCode UNAUTHORIZED');

    const r3 = await api('GET', '/api/v1/admin/users', null, wrongSecret);
    assert(r3.status === 401, '1.5 Wrong-secret token -> 401');

    const r4 = await api('GET', '/api/v1/admin/users', null, malformedToken);
    assert(r4.status === 401, '1.6 Malformed token -> 401');

    const r5 = await api('GET', '/api/v1/admin/users', null, adminToken);
    assert(r5.status === 200, '1.7 Valid admin token -> 200');

  } catch (e) { console.error('[SECTION 1 ERROR]', e.message); }

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 2 — RBAC: All Admin Endpoints Require ADMIN Role
  // ────────────────────────────────────────────────────────────────────────────
  try {
    console.log('\n--- Section 2: RBAC Enforcement Across All Admin Endpoints ---');

    const endpoints = [
      ['GET', '/api/v1/admin/users'],
      ['GET', '/api/v1/admin/data-quality/stats'],
      ['GET', '/api/v1/admin/dashboard/stats'],
      ['GET', '/api/v1/admin/audit-logs'],
      ['GET', '/api/v1/admin/verifications'],
      ['GET', '/api/v1/admin/notifications'],
      ['GET', '/api/v1/admin/settings'],
    ];

    for (const [method, path] of endpoints) {
      const rStu = await api(method, path, null, studentToken);
      assert(rStu.status === 403, `2a Student blocked: ${method} ${path}`);

      const rAlm = await api(method, path, null, alumniToken);
      assert(rAlm.status === 403, `2b Alumni blocked: ${method} ${path}`);
    }

  } catch (e) { console.error('[SECTION 2 ERROR]', e.message); }

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 3 — Data Leakage Audit: password_hash Must Never Appear in Responses
  // ────────────────────────────────────────────────────────────────────────────
  try {
    console.log('\n--- Section 3: Data Leakage - password_hash Never Exposed ---');

    const checkNoLeak = (body, label) => {
      const str = JSON.stringify(body || '');
      const hasLeak = str.includes('password_hash');
      assert(!hasLeak, `3. No password_hash in: ${label}`, hasLeak ? 'LEAK DETECTED' : '');
    };

    const rUsers    = await api('GET', '/api/v1/admin/users', null, adminToken);
    checkNoLeak(rUsers.body, 'GET /admin/users');

    const rNotifs   = await api('GET', '/api/v1/admin/notifications', null, adminToken);
    checkNoLeak(rNotifs.body, 'GET /admin/notifications');

    const rSettings = await api('GET', '/api/v1/admin/settings', null, adminToken);
    checkNoLeak(rSettings.body, 'GET /admin/settings');

    const rDash     = await api('GET', '/api/v1/admin/dashboard/stats', null, adminToken);
    checkNoLeak(rDash.body, 'GET /admin/dashboard/stats');

    const rAudit    = await api('GET', '/api/v1/admin/audit-logs', null, adminToken);
    checkNoLeak(rAudit.body, 'GET /admin/audit-logs');

  } catch (e) { console.error('[SECTION 3 ERROR]', e.message); }

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 4 — API Contract: success:true on All 200 Responses
  // ────────────────────────────────────────────────────────────────────────────
  try {
    console.log('\n--- Section 4: API Contract - success:true on 200 Responses ---');

    const routes = [
      '/api/v1/admin/users',
      '/api/v1/admin/data-quality/stats',
      '/api/v1/admin/dashboard/stats',
      '/api/v1/admin/audit-logs',
      '/api/v1/admin/verifications',
      '/api/v1/admin/notifications',
      '/api/v1/admin/settings',
    ];

    for (const path of routes) {
      const r = await api('GET', path, null, adminToken);
      assert(r.status === 200 && r.body?.success === true,
        `4. success:true: ${path}`,
        `status=${r.status}, success=${r.body?.success}`);
    }

  } catch (e) { console.error('[SECTION 4 ERROR]', e.message); }

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 5 — Announcement Persistence (Simulated Multi-Session)
  // ────────────────────────────────────────────────────────────────────────────
  let testAnnId = null;
  try {
    console.log('\n--- Section 5: Announcement Persistence Across Sessions ---');

    const rCreate = await api('POST', '/api/v1/admin/notifications', {
      title: 'Phase 12 Persistence Test',
      message: 'This confirms announcements persist across backend requests.',
      type: 'GENERAL',
      audienceType: 'ALL',
    }, adminToken);
    assert(rCreate.status === 201 && rCreate.body?.data?.id, '5.1 Create draft -> 201 with ID');
    testAnnId = rCreate.body?.data?.id;

    if (testAnnId) {
      // Simulate page refresh (GET list)
      const rList = await api('GET', '/api/v1/admin/notifications?page=1&pageSize=100', null, adminToken);
      const found = Array.isArray(rList.body?.data) && rList.body.data.some((n) => n.id === testAnnId);
      assert(found, '5.2 Draft appears in list after creation (page refresh sim)');

      // Simulate navigation to detail page
      const rById = await api('GET', `/api/v1/admin/notifications/${testAnnId}`, null, adminToken);
      assert(rById.status === 200 && rById.body?.data?.id === testAnnId, '5.3 Draft retrievable by ID');
      assert(rById.body?.data?.status === 'DRAFT', '5.4 Status is DRAFT');

      // Publish
      const rPub = await api('POST', `/api/v1/admin/notifications/${testAnnId}/publish`, {}, adminToken);
      assert(rPub.status === 200, '5.5 Publish -> 200');

      // Re-fetch and confirm PUBLISHED state persists
      const rAfter = await api('GET', `/api/v1/admin/notifications/${testAnnId}`, null, adminToken);
      assert(rAfter.body?.data?.status === 'PUBLISHED', '5.6 PUBLISHED status persists');

      // Confirm it still appears in list
      const rList2 = await api('GET', '/api/v1/admin/notifications?status=PUBLISHED&page=1&pageSize=100', null, adminToken);
      const found2 = Array.isArray(rList2.body?.data) && rList2.body.data.some((n) => n.id === testAnnId);
      assert(found2, '5.7 PUBLISHED announcement in filtered list');
    }

  } catch (e) { console.error('[SECTION 5 ERROR]', e.message); }

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 6 — Input Validation & SQL Injection Resistance
  // ────────────────────────────────────────────────────────────────────────────
  try {
    console.log('\n--- Section 6: Input Validation & Injection Resistance ---');

    const rBadUUID = await api('GET', '/api/v1/admin/users/not-a-valid-uuid', null, adminToken);
    assert(rBadUUID.status === 400 && rBadUUID.body?.errorCode === 'INVALID_ID_FORMAT',
      '6.1 Invalid user UUID -> 400 INVALID_ID_FORMAT');

    const rNotFound = await api('GET', '/api/v1/admin/users/00000000-0000-0000-0000-000000000000', null, adminToken);
    assert(rNotFound.status === 404 && rNotFound.body?.errorCode === 'USER_NOT_FOUND',
      '6.2 Non-existent UUID -> 404 USER_NOT_FOUND');

    const rSortInj = await api('GET', "/api/v1/admin/users?sortBy=';DROP TABLE users;--", null, adminToken);
    assert(rSortInj.status === 400, '6.3 SQL injection in sortBy -> 400 rejected');

    const rBadType = await api('POST', '/api/v1/admin/notifications', {
      title: 'T', message: 'M', type: 'HACK', audienceType: 'ALL',
    }, adminToken);
    assert(rBadType.status === 400 && rBadType.body?.errorCode === 'VALIDATION_ERROR',
      '6.4 Invalid notification type -> 400 VALIDATION_ERROR');

    const rNoTitle = await api('POST', '/api/v1/admin/notifications', {
      message: 'Message only', type: 'GENERAL', audienceType: 'ALL',
    }, adminToken);
    assert(rNoTitle.status === 400, '6.5 Missing title -> 400');

    const rNoMsg = await api('POST', '/api/v1/admin/notifications', {
      title: 'Title only', type: 'GENERAL', audienceType: 'ALL',
    }, adminToken);
    assert(rNoMsg.status === 400, '6.6 Missing message -> 400');

    const rBadAud = await api('POST', '/api/v1/admin/notifications', {
      title: 'T', message: 'M', type: 'GENERAL', audienceType: 'HACKERS',
    }, adminToken);
    assert(rBadAud.status === 400, '6.7 Invalid audienceType -> 400');

  } catch (e) { console.error('[SECTION 6 ERROR]', e.message); }

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 7 — CSV Export: Formula Injection Protection
  // ────────────────────────────────────────────────────────────────────────────
  try {
    console.log('\n--- Section 7: CSV Export Formula Injection Protection ---');

    const rBadCol = await api('POST', '/api/v1/admin/users/export', {
      columns: ['name', 'password_hash'],
    }, adminToken);
    assert(rBadCol.status === 400 && rBadCol.body?.errorCode === 'INVALID_COLUMN',
      '7.1 password_hash column -> 400 INVALID_COLUMN');

    const rBadCol2 = await api('POST', '/api/v1/admin/users/export', {
      columns: ['name', '; DROP TABLE users; --'],
    }, adminToken);
    assert(rBadCol2.status === 400, '7.2 SQL injection column -> 400 rejected');

    const exportRes = await fetch(`${baseUrl}/api/v1/admin/users/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ columns: ['name', 'email', 'role'] }),
    });
    assert(exportRes.status === 200, '7.3 Valid CSV export -> 200');
    const ct = exportRes.headers.get('content-type') || '';
    assert(ct.includes('text/csv') || ct.includes('octet-stream') || ct.includes('application/'),
      '7.4 Valid CSV export has file Content-Type', `got: ${ct}`);

  } catch (e) { console.error('[SECTION 7 ERROR]', e.message); }

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 8 — Announcement State Machine: Invalid Transitions Rejected
  // ────────────────────────────────────────────────────────────────────────────
  try {
    console.log('\n--- Section 8: Announcement State Machine Transitions ---');

    const rC = await api('POST', '/api/v1/admin/notifications', {
      title: 'Phase12 State Machine Test',
      message: 'Testing invalid state transitions.',
      type: 'GENERAL',
      audienceType: 'ALL',
    }, adminToken);
    const smId = rC.body?.data?.id;
    assert(!!smId, '8.1 Created draft for state machine test');

    if (smId) {
      await api('POST', `/api/v1/admin/notifications/${smId}/publish`, {}, adminToken);

      const rDP = await api('POST', `/api/v1/admin/notifications/${smId}/publish`, {}, adminToken);
      assert(rDP.status === 409, '8.2 Double-publish PUBLISHED -> 409 Conflict');

      const rCP = await api('POST', `/api/v1/admin/notifications/${smId}/cancel`, {}, adminToken);
      assert(rCP.status === 409, '8.3 Cancel PUBLISHED -> 409 Conflict');

      const rC2 = await api('POST', '/api/v1/admin/notifications', {
        title: 'Phase12 Draft To Cancel',
        message: 'This will be cancelled.',
        type: 'GENERAL',
        audienceType: 'ALL',
      }, adminToken);
      const did = rC2.body?.data?.id;
      if (did) {
        const rCan = await api('POST', `/api/v1/admin/notifications/${did}/cancel`, {}, adminToken);
        assert(rCan.status === 200, '8.4 Cancel DRAFT -> 200');

        const rPC = await api('POST', `/api/v1/admin/notifications/${did}/publish`, {}, adminToken);
        assert(rPC.status === 409, '8.5 Publish CANCELLED -> 409 Conflict');
      }
    }

  } catch (e) { console.error('[SECTION 8 ERROR]', e.message); }

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 9 — Response Envelope Consistency
  // ────────────────────────────────────────────────────────────────────────────
  try {
    console.log('\n--- Section 9: Response Envelope Consistency ---');

    const r401 = await api('GET', '/api/v1/admin/users');
    assert(r401.body?.success === false, '9a 401 response has success:false');
    assert(typeof r401.body?.errorCode === 'string', '9b 401 response has errorCode');
    assert(typeof r401.body?.message === 'string', '9c 401 response has message');

    const rNP = await api('GET', '/api/v1/admin/notifications?page=1&pageSize=5', null, adminToken);
    assert(rNP.status === 200, '9d Notifications GET 200');
    assert(typeof rNP.body?.pagination?.totalCount === 'number', '9e pagination.totalCount present');
    assert(typeof rNP.body?.pagination?.page === 'number', '9f pagination.page present');
    assert(Array.isArray(rNP.body?.data), '9g data is array');
    assert(typeof rNP.body?.summary?.totalAnnouncements === 'number', '9h summary.totalAnnouncements present');

    const rUP = await api('GET', '/api/v1/admin/users?page=1&pageSize=5', null, adminToken);
    assert(typeof rUP.body?.data?.totalCount === 'number', '9i data.totalCount present');
    assert(Array.isArray(rUP.body?.data?.users), '9j data.users is array');

  } catch (e) { console.error('[SECTION 9 ERROR]', e.message); }

  // ────────────────────────────────────────────────────────────────────────────
  // CLEANUP
  // ────────────────────────────────────────────────────────────────────────────
  try {
    await db.query(`
      DELETE FROM announcements
      WHERE title IN (
        'Phase 12 Persistence Test',
        'Phase12 State Machine Test',
        'Phase12 Draft To Cancel'
      )
    `);
  } catch (_) { /* non-fatal */ }

  // ────────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ────────────────────────────────────────────────────────────────────────────
  const allPassed = passed === total;
  console.log('\n================================================================');
  console.log(`  PHASE 12 SECURITY SUITE: ${passed} / ${total} TESTS PASSED`);
  if (!allPassed) console.error(`  *** ${total - passed} TEST(S) FAILED ***`);
  console.log('================================================================\n');

  server.close();
  process.exit(allPassed ? 0 : 1);
};

runPhase12Tests().catch((err) => {
  console.error('\n[PHASE 12 FATAL ERROR]:', err);
  process.exit(1);
});
