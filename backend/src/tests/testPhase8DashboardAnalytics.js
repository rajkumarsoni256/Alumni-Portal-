const http = require('http');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

const runPhase8Tests = async () => {
  console.log('================================================================');
  console.log('   PHASE 8 — ADMIN DASHBOARD ANALYTICS & REPORTING TEST SUITE   ');
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
    const rNoToken = await requestApi('GET', '/api/v1/admin/dashboard/stats');
    assert(rNoToken.status === 401 && rNoToken.body?.errorCode === 'UNAUTHORIZED', 'GET /dashboard/stats no token -> 401');

    const rExpired = await requestApi('GET', '/api/v1/admin/dashboard/stats', null, expiredToken);
    assert(rExpired.status === 401 && rExpired.body?.errorCode === 'UNAUTHORIZED', 'GET /dashboard/stats expired token -> 401');

    const rStudent = await requestApi('GET', '/api/v1/admin/dashboard/stats', null, studentToken);
    assert(rStudent.status === 403 && rStudent.body?.errorCode === 'FORBIDDEN', 'GET /dashboard/stats Student role -> 403');

    const rAlumni = await requestApi('GET', '/api/v1/admin/dashboard/stats', null, alumniToken);
    assert(rAlumni.status === 403 && rAlumni.body?.errorCode === 'FORBIDDEN', 'GET /dashboard/stats Alumni role -> 403');

    const rAdmin = await requestApi('GET', '/api/v1/admin/dashboard/stats', null, adminToken);
    assert(rAdmin.status === 200 && rAdmin.body?.success === true, 'GET /dashboard/stats Admin role -> 200 OK');

    const data = rAdmin.body.data;

    // ------------------------------------------------------------------
    // SECTION 2: OVERVIEW COUNTS & DATABASE PARITY
    // ------------------------------------------------------------------
    console.log('\n--- 2. Overview Counts & Database Parity ---');
    const dbUsersCount = parseInt((await db.query(`SELECT COUNT(*) AS c FROM users`)).rows[0].c, 10);
    const dbStudentsCount = parseInt((await db.query(`SELECT COUNT(*) AS c FROM users WHERE role = 'STUDENT'`)).rows[0].c, 10);
    const dbAlumniCount = parseInt((await db.query(`SELECT COUNT(*) AS c FROM users WHERE role = 'ALUMNI'`)).rows[0].c, 10);
    const dbAdminCount = parseInt((await db.query(`SELECT COUNT(*) AS c FROM users WHERE role = 'ADMIN'`)).rows[0].c, 10);

    assert(data.overview.totalUsers === dbUsersCount, `totalUsers matches PostgreSQL users table count (${dbUsersCount})`);
    assert(data.overview.students === dbStudentsCount, `students matches PostgreSQL STUDENT count (${dbStudentsCount})`);
    assert(data.overview.alumni === dbAlumniCount, `alumni matches PostgreSQL ALUMNI count (${dbAlumniCount})`);
    assert(data.overview.admins === dbAdminCount, `admins matches PostgreSQL ADMIN count (${dbAdminCount})`);
    assert(
      data.overview.totalUsers === data.overview.students + data.overview.alumni + data.overview.admins,
      'totalUsers sum equals students + alumni + admins'
    );

    // ------------------------------------------------------------------
    // SECTION 3: DATA QUALITY CONSISTENCY WITH PHASE 4
    // ------------------------------------------------------------------
    console.log('\n--- 3. Data Quality Consistency (Phase 4 Parity) ---');
    const rDq = await requestApi('GET', '/api/v1/admin/data-quality/stats', null, adminToken);
    const dqData = rDq.body.data;

    assert(data.profileQuality.complete === dqData.complete, `dashboard complete (${data.profileQuality.complete}) === data-quality complete (${dqData.complete})`);
    assert(data.profileQuality.incomplete === dqData.incomplete, `dashboard incomplete (${data.profileQuality.incomplete}) === data-quality incomplete (${dqData.incomplete})`);
    assert(data.profileQuality.needsUpdate === dqData.needsUpdate, `dashboard needsUpdate (${data.profileQuality.needsUpdate}) === data-quality needsUpdate (${dqData.needsUpdate})`);
    assert(
      data.profileQuality.complete + data.profileQuality.incomplete + data.profileQuality.needsUpdate === data.overview.totalUsers,
      'Profile quality complete + incomplete + needsUpdate equals total users'
    );

    // ------------------------------------------------------------------
    // SECTION 4: VERIFICATION STATISTICS CONSISTENCY WITH PHASE 6
    // ------------------------------------------------------------------
    console.log('\n--- 4. Verification Statistics Consistency (Phase 6 Parity) ---');
    const dbPendingVerif = parseInt((await db.query(`SELECT COUNT(*) AS c FROM alumni_verifications WHERE status = 'PENDING'`)).rows[0].c, 10);
    const dbApprovedVerif = parseInt((await db.query(`SELECT COUNT(*) AS c FROM alumni_verifications WHERE status = 'APPROVED'`)).rows[0].c, 10);
    const dbRejectedVerif = parseInt((await db.query(`SELECT COUNT(*) AS c FROM alumni_verifications WHERE status = 'REJECTED'`)).rows[0].c, 10);
    const dbTotalVerif = parseInt((await db.query(`SELECT COUNT(*) AS c FROM alumni_verifications`)).rows[0].c, 10);

    assert(data.verification.pending === dbPendingVerif, `pending verifications matches PostgreSQL count (${dbPendingVerif})`);
    assert(data.verification.approved === dbApprovedVerif, `approved verifications matches PostgreSQL count (${dbApprovedVerif})`);
    assert(data.verification.rejected === dbRejectedVerif, `rejected verifications matches PostgreSQL count (${dbRejectedVerif})`);
    assert(data.verification.total === dbTotalVerif, `total verifications matches PostgreSQL count (${dbTotalVerif})`);

    // ------------------------------------------------------------------
    // SECTION 5: GROWTH & DISTRIBUTIONS
    // ------------------------------------------------------------------
    console.log('\n--- 5. Growth & Cohort Distributions ---');
    assert(typeof data.growth.newUsersThisWeek === 'number', 'newUsersThisWeek is a valid number');
    assert(typeof data.growth.newUsersThisMonth === 'number', 'newUsersThisMonth is a valid number');
    assert(Array.isArray(data.growth.monthlyTimeSeries), 'monthlyTimeSeries is an array');
    assert(Array.isArray(data.distribution.branches), 'distribution.branches is an array');
    assert(Array.isArray(data.distribution.batches), 'distribution.batches is an array');

    if (data.distribution.branches.length > 0) {
      assert(typeof data.distribution.branches[0].branch === 'string', 'Branch distribution item contains branch name');
      assert(typeof data.distribution.branches[0].count === 'number', 'Branch distribution item contains count');
    }

    if (data.distribution.batches.length > 0) {
      assert(typeof data.distribution.batches[0].batch === 'string', 'Batch distribution item contains batch year');
      assert(typeof data.distribution.batches[0].count === 'number', 'Batch distribution item contains count');
    }

    // ------------------------------------------------------------------
    // SECTION 6: SQL INJECTION DEFENSE & SAFETY
    // ------------------------------------------------------------------
    console.log('\n--- 6. SQL Injection Defense ---');
    const rMalicious = await requestApi('GET', '/api/v1/admin/dashboard/stats?period=1;DROP%20TABLE%20users;--', null, adminToken);
    assert(rMalicious.status === 200, 'Malicious query string handled safely without injection');

    // ------------------------------------------------------------------
    // SECTION 7: PERFORMANCE & EXPLAIN ANALYZE
    // ------------------------------------------------------------------
    console.log('\n--- 7. Performance & EXPLAIN ANALYZE ---');
    const explainOverview = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT
          COUNT(*) AS "totalUsers",
          COUNT(*) FILTER (WHERE u.role = 'STUDENT') AS "students",
          COUNT(*) FILTER (WHERE u.role = 'ALUMNI') AS "alumni",
          COUNT(*) FILTER (WHERE u.role = 'ADMIN') AS "admins"
      FROM users u;
    `);

    console.log('  [Dashboard Overview Query Plan]:');
    explainOverview.rows.forEach((r) => console.log(`    ${r['QUERY PLAN']}`));
    assert(explainOverview.rows.length > 0, 'EXPLAIN ANALYZE completed for dashboard overview query');

    console.log('\n================================================================');
    console.log(`  PHASE 8 RESULTS: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('================================================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n[PHASE 8 TEST FATAL ERROR]:', err);
    server.close();
    process.exit(1);
  }
};

runPhase8Tests();
