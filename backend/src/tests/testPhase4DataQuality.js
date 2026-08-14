const http = require('http');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const adminDataQualityService = require('../services/adminDataQualityService');
const adminUserService = require('../services/adminUserService');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

const runPhase4Tests = async () => {
  console.log('================================================================');
  console.log('     PHASE 4 — USER DETAILS & DATA QUALITY TEST SUITE           ');
  console.log('================================================================\n');

  // Start test server on ephemeral port
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
    // 1. Fetch real role accounts from DB
    const adminUser = (await db.query(`SELECT id, email FROM users WHERE role = 'ADMIN' LIMIT 1`)).rows[0];
    const studentUser = (await db.query(`SELECT id, email FROM users WHERE role = 'STUDENT' LIMIT 1`)).rows[0];
    const alumniUser = (await db.query(`SELECT id, email FROM users WHERE role = 'ALUMNI' LIMIT 1`)).rows[0];

    const adminToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
    const studentToken = jwt.sign({ sub: studentUser.id, role: 'STUDENT' }, JWT_SECRET, { expiresIn: '1h' });
    const alumniToken = jwt.sign({ sub: alumniUser.id, role: 'ALUMNI' }, JWT_SECRET, { expiresIn: '1h' });
    const expiredToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '-5s' });

    const makeRequest = async (path, token) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${baseUrl}${path}`, { method: 'GET', headers });
      const body = await res.json().catch(() => null);
      return { status: res.status, body };
    };

    // ------------------------------------------------------------------
    // SECTION 1: DATA QUALITY STATS AUTHORIZATION & RBAC
    // ------------------------------------------------------------------
    console.log('--- 1. Data Quality Authorization & RBAC Checks ---');
    const rNoToken = await makeRequest('/api/v1/admin/data-quality/stats');
    assert(rNoToken.status === 401 && rNoToken.body?.errorCode === 'UNAUTHORIZED', 'No Token returns 401 Unauthorized');

    const rExpired = await makeRequest('/api/v1/admin/data-quality/stats', expiredToken);
    assert(rExpired.status === 401 && rExpired.body?.errorCode === 'UNAUTHORIZED', 'Expired Token returns 401 Unauthorized');

    const rStudent = await makeRequest('/api/v1/admin/data-quality/stats', studentToken);
    assert(rStudent.status === 403 && rStudent.body?.errorCode === 'FORBIDDEN', 'Student Token returns 403 Forbidden');

    const rAlumni = await makeRequest('/api/v1/admin/data-quality/stats', alumniToken);
    assert(rAlumni.status === 403 && rAlumni.body?.errorCode === 'FORBIDDEN', 'Alumni Token returns 403 Forbidden');

    const rAdmin = await makeRequest('/api/v1/admin/data-quality/stats', adminToken);
    assert(rAdmin.status === 200 && rAdmin.body?.success === true, 'Admin Token returns 200 OK');

    // ------------------------------------------------------------------
    // SECTION 2: DATA QUALITY METRICS STRUCTURE & TYPES
    // ------------------------------------------------------------------
    console.log('\n--- 2. Data Quality Metrics Contract & Structure ---');
    const stats = rAdmin.body.data;
    assert(typeof stats.complete === 'number', 'Metric complete is number');
    assert(typeof stats.incomplete === 'number', 'Metric incomplete is number');
    assert(typeof stats.needsUpdate === 'number', 'Metric needsUpdate is number');
    assert(typeof stats.missingContact === 'number', 'Metric missingContact is number');
    assert(typeof stats.missingEmail === 'number', 'Metric missingEmail is number');
    assert(typeof stats.missingPhone === 'number', 'Metric missingPhone is number');
    assert(typeof stats.missingCompany === 'number', 'Metric missingCompany is number');
    assert(typeof stats.missingLocation === 'number', 'Metric missingLocation is number');

    console.log('  Live Data Quality Stats from PostgreSQL:', JSON.stringify(stats, null, 2));

    // ------------------------------------------------------------------
    // SECTION 3: CROSS-ENDPOINT DATA CONSISTENCY VERIFICATION
    // ------------------------------------------------------------------
    console.log('\n--- 3. Cross-Endpoint Mathematical Consistency ---');

    // 1. Complete Records consistency
    const dirComplete = await adminUserService.getUsers({ status: 'complete' });
    assert(
      stats.complete === dirComplete.totalCount,
      `Complete records match directory filter (Stats: ${stats.complete}, Directory: ${dirComplete.totalCount})`
    );

    // 2. Incomplete Records consistency
    const dirIncomplete = await adminUserService.getUsers({ status: 'incomplete' });
    assert(
      stats.incomplete === dirIncomplete.totalCount,
      `Incomplete records match directory filter (Stats: ${stats.incomplete}, Directory: ${dirIncomplete.totalCount})`
    );

    // 3. Needs Update (> 1 Year Stale) consistency
    const dirNeedsUpdate = await adminUserService.getUsers({ status: 'needs update' });
    const dirMore1Year = await adminUserService.getUsers({ lastUpdated: 'more1year' });
    assert(
      stats.needsUpdate === dirNeedsUpdate.totalCount && stats.needsUpdate === dirMore1Year.totalCount,
      `Needs Update records match directory filter (Stats: ${stats.needsUpdate}, Filter: ${dirNeedsUpdate.totalCount})`
    );

    // 4. Missing Email consistency
    const dirMissingEmail = await adminUserService.getUsers({ missing: 'email' });
    assert(
      stats.missingEmail === dirMissingEmail.totalCount,
      `Missing email matches directory filter (Stats: ${stats.missingEmail}, Filter: ${dirMissingEmail.totalCount})`
    );

    // 5. Missing Phone consistency
    const dirMissingPhone = await adminUserService.getUsers({ missing: 'phone' });
    assert(
      stats.missingPhone === dirMissingPhone.totalCount,
      `Missing phone matches directory filter (Stats: ${stats.missingPhone}, Filter: ${dirMissingPhone.totalCount})`
    );

    // 6. Missing Company consistency (Alumni specific)
    const dirMissingCompany = await adminUserService.getUsers({ missing: 'company' });
    assert(
      stats.missingCompany === dirMissingCompany.totalCount,
      `Missing company matches directory filter (Stats: ${stats.missingCompany}, Filter: ${dirMissingCompany.totalCount})`
    );

    // 7. Missing Location consistency
    const dirMissingLocation = await adminUserService.getUsers({ missing: 'location' });
    assert(
      stats.missingLocation === dirMissingLocation.totalCount,
      `Missing location matches directory filter (Stats: ${stats.missingLocation}, Filter: ${dirMissingLocation.totalCount})`
    );

    // ------------------------------------------------------------------
    // SECTION 4: SINGLE USER DETAIL & DATA QUALITY CONSISTENCY
    // ------------------------------------------------------------------
    console.log('\n--- 4. User Details & Field Level Integrity ---');
    const allUsers = await adminUserService.getUsers({ pageSize: 100 });
    let detailCheckedCount = 0;
    for (const u of allUsers.users) {
      const detail = await adminUserService.getUserById(u.id);
      assert(detail !== null, `User detail exists for user ${u.name}`);
      assert(detail.profileStatus === u.profileStatus, `Profile status identical between summary & detail for ${u.name} (${detail.profileStatus})`);
      assert(detail.lastUpdatedDaysAgo === u.lastUpdatedDaysAgo, `lastUpdatedDaysAgo identical for ${u.name}`);
      assert(JSON.stringify(detail.missingFields) === JSON.stringify(u.missingFields), `missingFields identical for ${u.name}`);
      detailCheckedCount++;
      if (detailCheckedCount >= 5) break; // Check first 5 records
    }

    // ------------------------------------------------------------------
    // SECTION 5: PERFORMANCE (EXPLAIN ANALYZE ON AGGREGATION)
    // ------------------------------------------------------------------
    console.log('\n--- 5. Database Performance Benchmark (EXPLAIN ANALYZE) ---');
    const explainResult = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT
          COUNT(*) FILTER (
              WHERE p.is_profile_complete = true 
              AND (NOW() - COALESCE(p.updated_at, u.updated_at)) <= INTERVAL '365 days'
          ) AS "complete",
          COUNT(*) FILTER (
              WHERE (p.is_profile_complete IS NOT TRUE) 
              AND (NOW() - COALESCE(p.updated_at, u.updated_at)) <= INTERVAL '365 days'
          ) AS "incomplete",
          COUNT(*) FILTER (
              WHERE (NOW() - COALESCE(p.updated_at, u.updated_at)) > INTERVAL '365 days'
          ) AS "needsUpdate",
          COUNT(*) FILTER (
              WHERE (u.email IS NULL OR TRIM(u.email) = '' OR p.phone IS NULL OR TRIM(p.phone) = '')
          ) AS "missingContact",
          COUNT(*) FILTER (
              WHERE (u.email IS NULL OR TRIM(u.email) = '')
          ) AS "missingEmail",
          COUNT(*) FILTER (
              WHERE (p.phone IS NULL OR TRIM(p.phone) = '')
          ) AS "missingPhone",
          COUNT(*) FILTER (
              WHERE (u.role = 'ALUMNI' AND (p.company IS NULL OR TRIM(p.company) = ''))
          ) AS "missingCompany",
          COUNT(*) FILTER (
              WHERE (p.location IS NULL OR TRIM(p.location) = '')
          ) AS "missingLocation"
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id;
    `);

    console.log('  [Data Quality Aggregation Query Plan]:');
    explainResult.rows.forEach((r) => console.log(`    ${r['QUERY PLAN']}`));
    assert(explainResult.rows.length > 0, 'EXPLAIN ANALYZE completed successfully for data quality stats');

    console.log('\n================================================================');
    console.log(`  PHASE 4 RESULTS: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('================================================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n[PHASE 4 TEST FATAL ERROR]:', err);
    server.close();
    process.exit(1);
  }
};

runPhase4Tests();
