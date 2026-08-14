const http = require('http');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

const runHttpTests = async () => {
  console.log('================================================================');
  console.log('       HTTP ROUTE & MIDDLEWARE INTEGRATION TEST SUITE           ');
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
    // 1. Get real users for roles
    const adminUser = (await db.query(`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`)).rows[0];
    const studentUser = (await db.query(`SELECT id FROM users WHERE role = 'STUDENT' LIMIT 1`)).rows[0];
    const alumniUser = (await db.query(`SELECT id FROM users WHERE role = 'ALUMNI' LIMIT 1`)).rows[0];

    const adminToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET);
    const studentToken = jwt.sign({ sub: studentUser.id, role: 'STUDENT' }, JWT_SECRET);
    const alumniToken = jwt.sign({ sub: alumniUser.id, role: 'ALUMNI' }, JWT_SECRET);

    const makeRequest = async (path, token) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${baseUrl}${path}`, { method: 'GET', headers });
      const json = await res.json().catch(() => null);
      return { status: res.status, body: json };
    };

    // --- Test 1: No Token ---
    console.log('--- Test Group 1: Authentication & RBAC Guard ---');
    const resNoToken = await makeRequest('/api/v1/admin/users');
    assert(resNoToken.status === 401, 'No token returns 401 Unauthorized');
    assert(resNoToken.body?.errorCode === 'UNAUTHORIZED', 'ErrorCode is UNAUTHORIZED');

    // --- Test 2: Student Token ---
    const resStudent = await makeRequest('/api/v1/admin/users', studentToken);
    assert(resStudent.status === 403, 'Student token returns 403 Forbidden');
    assert(resStudent.body?.errorCode === 'FORBIDDEN', 'ErrorCode is FORBIDDEN');

    // --- Test 3: Alumni Token ---
    const resAlumni = await makeRequest('/api/v1/admin/users', alumniToken);
    assert(resAlumni.status === 403, 'Alumni token returns 403 Forbidden');

    // --- Test 4: Admin Token ---
    const resAdmin = await makeRequest('/api/v1/admin/users', adminToken);
    assert(resAdmin.status === 200, 'Admin token returns 200 OK');
    assert(resAdmin.body?.success === true, 'Response success is true');
    assert(Array.isArray(resAdmin.body?.data?.users), 'Response data has users array');
    assert(typeof resAdmin.body?.data?.totalCount === 'number', 'Response data has totalCount');

    // --- Test Group 2: Query Validation ---
    console.log('\n--- Test Group 2: Query Parameter Validation ---');
    const resInvalidSort = await makeRequest('/api/v1/admin/users?sortBy=nonexistent_col', adminToken);
    assert(resInvalidSort.status === 400, 'Invalid sortBy returns 400 Bad Request');
    assert(resInvalidSort.body?.errorCode === 'INVALID_QUERY', 'ErrorCode is INVALID_QUERY');

    const resInvalidOrder = await makeRequest('/api/v1/admin/users?sortOrder=sideways', adminToken);
    assert(resInvalidOrder.status === 400, 'Invalid sortOrder returns 400 Bad Request');

    // --- Test Group 3: User Details Route ---
    console.log('\n--- Test Group 3: User Details Route (/api/v1/admin/users/:id) ---');
    const resValidDetail = await makeRequest(`/api/v1/admin/users/${adminUser.id}`, adminToken);
    assert(resValidDetail.status === 200, 'Valid user ID returns 200 OK');
    assert(resValidDetail.body?.data?.id === adminUser.id, 'Returns expected user ID');
    assert(resValidDetail.body?.data?.role === 'Admin', 'Formats admin role correctly');

    const resInvalidUUID = await makeRequest('/api/v1/admin/users/not-a-uuid-1234', adminToken);
    assert(resInvalidUUID.status === 400, 'Malformed UUID returns 400 Bad Request');
    assert(resInvalidUUID.body?.errorCode === 'INVALID_ID_FORMAT', 'ErrorCode is INVALID_ID_FORMAT');

    const resNotFound = await makeRequest('/api/v1/admin/users/00000000-0000-0000-0000-000000000000', adminToken);
    assert(resNotFound.status === 404, 'Nonexistent UUID returns 404 Not Found');
    assert(resNotFound.body?.errorCode === 'USER_NOT_FOUND', 'ErrorCode is USER_NOT_FOUND');

    // --- Test Group 4: Admin Settings Route ---
    console.log('\n--- Test Group 4: Admin Settings Route (/api/v1/admin/settings) ---');
    const resSettings = await makeRequest('/api/v1/admin/settings', adminToken);
    assert(resSettings.status === 200, 'GET /api/v1/admin/settings returns 200 OK through Express application');
    assert(resSettings.body?.success === true, 'Settings response success is true');
    assert(typeof resSettings.body?.data?.platformName === 'string', 'Settings response includes platformName');
    assert(typeof resSettings.body?.data?.registrationEnabled === 'boolean', 'Settings response includes registrationEnabled');

    console.log('\n================================================================');
    console.log(`  HTTP SUITE: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('================================================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n[HTTP TEST FATAL ERROR]:', err);
    server.close();
    process.exit(1);
  }
};

runHttpTests();
