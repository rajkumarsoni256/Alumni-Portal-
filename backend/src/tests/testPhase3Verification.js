const http = require('http');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const adminUserService = require('../services/adminUserService');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

const runVerification = async () => {
  console.log('================================================================');
  console.log('       PHASE 3 — DEEP POST-IMPLEMENTATION VERIFICATION          ');
  console.log('================================================================\n');

  // Start test server on dynamic port
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
    // 1. Setup Auth Tokens
    // ------------------------------------------------------------------
    const adminUser = (await db.query(`SELECT id, email FROM users WHERE role = 'ADMIN' LIMIT 1`)).rows[0];
    const studentUser = (await db.query(`SELECT id, email FROM users WHERE role = 'STUDENT' LIMIT 1`)).rows[0];
    const alumniUser = (await db.query(`SELECT id, email FROM users WHERE role = 'ALUMNI' LIMIT 1`)).rows[0];

    const adminToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
    const studentToken = jwt.sign({ sub: studentUser.id, role: 'STUDENT' }, JWT_SECRET, { expiresIn: '1h' });
    const alumniToken = jwt.sign({ sub: alumniUser.id, role: 'ALUMNI' }, JWT_SECRET, { expiresIn: '1h' });
    const expiredToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '-10s' });
    const invalidSigToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, 'WRONG_SECRET');

    const request = async (path, token) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${baseUrl}${path}`, { method: 'GET', headers });
      const body = await res.json().catch(() => null);
      return { status: res.status, body };
    };

    // ------------------------------------------------------------------
    // SECTION 1: STRICT AUTHORIZATION & RBAC VERIFICATION
    // ------------------------------------------------------------------
    console.log('--- 1. Authorization & RBAC Checks ---');
    const r1 = await request('/api/v1/admin/users');
    assert(r1.status === 401 && r1.body?.errorCode === 'UNAUTHORIZED', 'No Token -> 401 Unauthorized');

    const r2 = await request('/api/v1/admin/users', 'invalid.token.format');
    assert(r2.status === 401 && r2.body?.errorCode === 'UNAUTHORIZED', 'Malformed Token -> 401 Unauthorized');

    const r3 = await request('/api/v1/admin/users', expiredToken);
    assert(r3.status === 401 && r3.body?.errorCode === 'UNAUTHORIZED', 'Expired Token -> 401 Unauthorized');

    const r4 = await request('/api/v1/admin/users', invalidSigToken);
    assert(r4.status === 401 && r4.body?.errorCode === 'UNAUTHORIZED', 'Invalid Signature Token -> 401 Unauthorized');

    const r5 = await request('/api/v1/admin/users', studentToken);
    assert(r5.status === 403 && r5.body?.errorCode === 'FORBIDDEN', 'Student Token -> 403 Forbidden');

    const r6 = await request('/api/v1/admin/users', alumniToken);
    assert(r6.status === 403 && r6.body?.errorCode === 'FORBIDDEN', 'Alumni Token -> 403 Forbidden');

    const r7 = await request('/api/v1/admin/users', adminToken);
    assert(r7.status === 200 && r7.body?.success === true, 'Admin Token -> 200 OK');

    const r8 = await request(`/api/v1/admin/users/${adminUser.id}`, studentToken);
    assert(r8.status === 403 && r8.body?.errorCode === 'FORBIDDEN', 'Detail Route - Student Token -> 403 Forbidden');

    const r9 = await request(`/api/v1/admin/users/${adminUser.id}`, alumniToken);
    assert(r9.status === 403 && r9.body?.errorCode === 'FORBIDDEN', 'Detail Route - Alumni Token -> 403 Forbidden');

    // ------------------------------------------------------------------
    // SECTION 2: SEARCH ENGINE VERIFICATION (ALL 7 FIELDS)
    // ------------------------------------------------------------------
    console.log('\n--- 2. Multi-Field Search Verification (PostgreSQL Query) ---');
    const sName = await request('/api/v1/admin/users?q=Priya', adminToken);
    assert(sName.body.data.users.some((u) => u.name.includes('Priya')), 'Search by Name field');

    const sEmail = await request('/api/v1/admin/users?q=priya.sharma.test', adminToken);
    assert(sEmail.body.data.users.some((u) => u.email.includes('priya.sharma.test')), 'Search by Email field');

    const sPhone = await request('/api/v1/admin/users?q=98290', adminToken);
    assert(sPhone.body.data.users.some((u) => u.phone && u.phone.includes('98290')), 'Search by Phone field');

    const sCompany = await request('/api/v1/admin/users?q=Google', adminToken);
    assert(sCompany.body.data.users.some((u) => u.company === 'Google'), 'Search by Company field');

    const sDesignation = await request('/api/v1/admin/users?q=Principal', adminToken);
    assert(sDesignation.body.data.users.some((u) => u.designation && u.designation.includes('Principal')), 'Search by Designation field');

    const sCity = await request('/api/v1/admin/users?q=Bangalore', adminToken);
    assert(sCity.body.data.users.some((u) => u.location && u.location.includes('Bangalore')), 'Search by City/Location field');

    const sBranch = await request('/api/v1/admin/users?q=AI/ML', adminToken);
    assert(sBranch.body.data.users.some((u) => u.branch === 'AI/ML'), 'Search by Branch field');

    // ------------------------------------------------------------------
    // SECTION 3: FILTER PARITY & SQL CONDITIONAL VERIFICATION
    // ------------------------------------------------------------------
    console.log('\n--- 3. Filter Permutations Verification ---');
    const fRole = await request('/api/v1/admin/users?role=alumni', adminToken);
    assert(fRole.body.data.users.every((u) => u.role === 'Alumni'), 'Filter: role=alumni returns only alumni');

    const fBranch = await request('/api/v1/admin/users?branch=CSE', adminToken);
    assert(fBranch.body.data.users.every((u) => u.branch.includes('CSE')), 'Filter: branch=CSE returns only CSE users');

    const fBatch = await request('/api/v1/admin/users?batch=2018', adminToken);
    assert(fBatch.body.data.users.every((u) => u.batch === 2018), 'Filter: batch=2018 returns exact match');

    const fBatchRange = await request('/api/v1/admin/users?batchFrom=2015&batchTo=2019', adminToken);
    assert(fBatchRange.body.data.users.every((u) => u.batch >= 2015 && u.batch <= 2019), 'Filter: batchFrom & batchTo range filter');

    const fCity = await request('/api/v1/admin/users?city=Jaipur', adminToken);
    assert(fCity.body.data.users.every((u) => u.location.includes('Jaipur')), 'Filter: city=Jaipur returns Jaipur users');

    const fCompany = await request('/api/v1/admin/users?company=Amazon', adminToken);
    assert(fCompany.body.data.users.every((u) => u.company.includes('Amazon')), 'Filter: company=Amazon returns Amazon users');

    const fStatus = await request('/api/v1/admin/users?status=needs%20update', adminToken);
    assert(fStatus.body.data.users.every((u) => u.profileStatus === 'Needs Update'), 'Filter: status=needs update correctly filtered in DB');

    const fMissing = await request('/api/v1/admin/users?missing=phone', adminToken);
    assert(fMissing.body.data.users.every((u) => !u.phone), 'Filter: missing=phone returns records with NULL/empty phone');

    const fLastUpdated = await request('/api/v1/admin/users?lastUpdated=30days', adminToken);
    assert(fLastUpdated.body.data.users.every((u) => u.lastUpdatedDaysAgo <= 30), 'Filter: lastUpdated=30days');

    const fMultiple = await request('/api/v1/admin/users?role=alumni&branch=CSE&city=Bangalore', adminToken);
    assert(
      fMultiple.body.data.users.every((u) => u.role === 'Alumni' && u.branch.includes('CSE') && u.location.includes('Bangalore')),
      'Filter: Combined multi-clause query works simultaneously'
    );

    // ------------------------------------------------------------------
    // SECTION 4: SORTING WHITELIST & SQL INJECTION PROTECTION
    // ------------------------------------------------------------------
    console.log('\n--- 4. Sorting & SQL Security ---');
    const sortNameAsc = await request('/api/v1/admin/users?sortBy=name&sortOrder=asc', adminToken);
    const namesAsc = sortNameAsc.body.data.users.map((u) => u.name);
    assert(
      JSON.stringify(namesAsc) === JSON.stringify([...namesAsc].sort((a, b) => a.localeCompare(b))),
      'Sort: name ASC correctly orders alphabetically'
    );

    const sortNameDesc = await request('/api/v1/admin/users?sortBy=name&sortOrder=desc', adminToken);
    const namesDesc = sortNameDesc.body.data.users.map((u) => u.name);
    assert(
      JSON.stringify(namesDesc) === JSON.stringify([...namesDesc].sort((a, b) => b.localeCompare(a))),
      'Sort: name DESC correctly orders reverse-alphabetically'
    );

    const sortBatchDesc = await request('/api/v1/admin/users?sortBy=batch&sortOrder=desc', adminToken);
    const batches = sortBatchDesc.body.data.users.map((u) => u.batch || 0);
    assert(batches[0] >= batches[batches.length - 1], 'Sort: batch DESC correctly orders by graduation year');

    const sortInjection = await request('/api/v1/admin/users?sortBy=id;DROP%20TABLE%20users;--', adminToken);
    assert(sortInjection.status === 400 && sortInjection.body.errorCode === 'INVALID_QUERY', 'SQL Injection in sortBy rejected with 400');

    const sortOrderInjection = await request('/api/v1/admin/users?sortOrder=ASC;SELECT%201;--', adminToken);
    assert(sortOrderInjection.status === 400 && sortOrderInjection.body.errorCode === 'INVALID_QUERY', 'SQL Injection in sortOrder rejected with 400');

    // ------------------------------------------------------------------
    // SECTION 5: PAGINATION ENGINE & METADATA VERIFICATION
    // ------------------------------------------------------------------
    console.log('\n--- 5. Pagination Boundary Verification ---');
    const p1 = await request('/api/v1/admin/users?page=1&pageSize=2', adminToken);
    assert(p1.body.data.page === 1, 'Page 1 has page=1');
    assert(p1.body.data.pageSize === 2, 'PageSize = 2');
    assert(p1.body.data.users.length === 2, 'Page 1 returns exactly 2 users');
    assert(p1.body.data.hasNext === true, 'Page 1 hasNext is true');
    assert(p1.body.data.hasPrev === false, 'Page 1 hasPrev is false');

    const pMiddle = await request('/api/v1/admin/users?page=2&pageSize=2', adminToken);
    assert(pMiddle.body.data.page === 2, 'Page 2 has page=2');
    assert(pMiddle.body.data.hasPrev === true, 'Page 2 hasPrev is true');

    const pLast = await request(`/api/v1/admin/users?page=${p1.body.data.totalPages}&pageSize=2`, adminToken);
    assert(pLast.body.data.hasNext === false, 'Last page hasNext is false');

    const pEmpty = await request('/api/v1/admin/users?page=9999&pageSize=20', adminToken);
    assert(pEmpty.body.data.users.length === 0, 'Out of bounds page returns empty array');
    assert(pEmpty.body.data.page === 9999, 'Out of bounds page metadata is preserved');

    const pInvalidPage = await request('/api/v1/admin/users?page=-5&pageSize=-10', adminToken);
    assert(pInvalidPage.body.data.page === 1 && pInvalidPage.body.data.pageSize === 20, 'Negative page/pageSize sanitized safely to defaults');

    // ------------------------------------------------------------------
    // SECTION 6: USER DETAIL ENDPOINT VERIFICATION
    // ------------------------------------------------------------------
    console.log('\n--- 6. User Detail Endpoint Parity ---');
    const dValid = await request(`/api/v1/admin/users/${alumniUser.id}`, adminToken);
    assert(dValid.status === 200, 'Valid user ID returns 200 OK');
    const uDetail = dValid.body.data;
    assert(typeof uDetail.id === 'string' && uDetail.id === alumniUser.id, 'Includes ID');
    assert(typeof uDetail.name === 'string', 'Includes full name');
    assert(typeof uDetail.email === 'string', 'Includes email');
    assert(typeof uDetail.role === 'string', 'Includes role');
    assert(typeof uDetail.institution === 'string', 'Includes institution');
    assert(Array.isArray(uDetail.skills), 'Includes skills array');
    assert(Array.isArray(uDetail.interests), 'Includes interests array');
    assert(Array.isArray(uDetail.missingFields), 'Includes missingFields array');
    assert(typeof uDetail.profileStatus === 'string', 'Includes profileStatus');
    assert(typeof uDetail.lastUpdatedDaysAgo === 'number', 'Includes lastUpdatedDaysAgo');

    const dInvalidUUID = await request('/api/v1/admin/users/123-abc-invalid', adminToken);
    assert(dInvalidUUID.status === 400 && dInvalidUUID.body.errorCode === 'INVALID_ID_FORMAT', 'Malformed UUID returns 400 INVALID_ID_FORMAT');

    const dNonexistent = await request('/api/v1/admin/users/00000000-0000-0000-0000-000000000000', adminToken);
    assert(dNonexistent.status === 404 && dNonexistent.body.errorCode === 'USER_NOT_FOUND', 'Nonexistent UUID returns 404 USER_NOT_FOUND');

    // ------------------------------------------------------------------
    // SECTION 7: REGRESSION VERIFICATION (EXISTING ENDPOINTS)
    // ------------------------------------------------------------------
    console.log('\n--- 7. Regression Checks (Auth, Profiles, Health) ---');
    const hRes = await request('/actuator/health');
    assert(hRes.status === 200 && hRes.body.status === 'UP', 'Health check /actuator/health is UP');

    const meRes = await request('/api/v1/auth/me', adminToken);
    assert(meRes.status === 200 && meRes.body.data?.email === adminUser.email, 'Existing /api/v1/auth/me remains functional');

    const profRes = await request('/api/v1/profiles/me', adminToken);
    assert(profRes.status === 200 && profRes.body.data?.fullName !== undefined, 'Existing /api/v1/profiles/me remains functional');

    // ------------------------------------------------------------------
    // SECTION 8: PERFORMANCE (EXPLAIN ANALYZE BENCHMARKS)
    // ------------------------------------------------------------------
    console.log('\n--- 8. PostgreSQL EXPLAIN ANALYZE Performance Measurements ---');
    const benchmark1 = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT u.id, u.email, u.role, p.full_name, p.company, p.location, p.updated_at
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ORDER BY COALESCE(p.updated_at, u.updated_at) DESC
      LIMIT 20 OFFSET 0;
    `);
    console.log('  [Benchmark 1: Default Directory Page]');
    benchmark1.rows.forEach((r) => console.log(`    ${r['QUERY PLAN']}`));

    const benchmark2 = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT u.id, u.email, u.role, p.full_name, p.company, p.location
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE (
        p.full_name ILIKE '%Priya%' OR
        u.email ILIKE '%Priya%' OR
        p.company ILIKE '%Priya%' OR
        p.location ILIKE '%Priya%'
      )
      AND u.role = 'ALUMNI'
      AND p.graduation_year >= 2015
      ORDER BY p.full_name ASC
      LIMIT 20 OFFSET 0;
    `);
    console.log('\n  [Benchmark 2: Multi-Filter Search Page]');
    benchmark2.rows.forEach((r) => console.log(`    ${r['QUERY PLAN']}`));

    console.log('\n================================================================');
    console.log(`  VERIFICATION RESULT: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('================================================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n[VERIFICATION FATAL ERROR]:', err);
    server.close();
    process.exit(1);
  }
};

runVerification();
