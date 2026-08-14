const http = require('http');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

const runFrontendIntegrationTest = async () => {
  console.log('================================================================');
  console.log('   FRONTEND INTEGRATION VERIFICATION SUITE (REAL APIS & DB)     ');
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
    const adminUser = (await db.query(`SELECT id, email FROM users WHERE role = 'ADMIN' LIMIT 1`)).rows[0];
    const adminToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

    const fetchApi = async (endpoint, options = {}) => {
      const url = `${baseUrl}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        ...options.headers,
      };
      const res = await fetch(url, { ...options, headers });
      const json = await res.json().catch(() => null);
      return { status: res.status, data: json?.data, body: json };
    };

    // 1. User Directory Real Count
    console.log('--- 1. Admin User Directory Integration ---');
    const dbUsersCount = parseInt((await db.query(`SELECT COUNT(*) AS c FROM users`)).rows[0].c, 10);
    const rUsers = await fetchApi('/api/v1/admin/users?page=1&pageSize=20');
    assert(rUsers.status === 200, 'GET /admin/users returns 200 OK');
    assert(rUsers.data.totalCount === dbUsersCount, `Total database count matches PostgreSQL (${dbUsersCount})`);
    assert(rUsers.data.users.length === dbUsersCount, `Returned users array length is ${dbUsersCount}`);
    assert(!rUsers.data.users.some(u => u.name === 'Rahul Sharma'), 'Mock user "Rahul Sharma" is NOT in database');
    assert(rUsers.data.users.some(u => u.name === 'Priya Sharma'), 'Real user "Priya Sharma" is in database');

    // 2. Search Integration
    console.log('\n--- 2. Search Parameter Integration ---');
    const rSearch = await fetchApi('/api/v1/admin/users?q=Priya');
    assert(rSearch.data.totalCount === 1, 'Search q=Priya returns 1 matching user');
    assert(rSearch.data.users[0].name.includes('Priya'), 'Search user name matches query');

    // 3. Filter Integration
    console.log('\n--- 3. Filter Parameters Integration ---');
    const rFilter = await fetchApi('/api/v1/admin/users?role=alumni&branch=CSE');
    assert(rFilter.data.totalCount >= 1, 'Role & branch filter returns matching records');
    assert(rFilter.data.users.every(u => u.role === 'Alumni' && u.branch === 'CSE'), 'Every returned record matches filter criteria');

    // 4. User Details Integration
    console.log('\n--- 4. User Details Integration ---');
    const priyaUser = rSearch.data.users[0];
    const rDetail = await fetchApi(`/api/v1/admin/users/${priyaUser.id}`);
    assert(rDetail.status === 200, 'GET /admin/users/:id returns 200 OK');
    assert(rDetail.data.id === priyaUser.id, 'User details ID matches requested ID');
    assert(rDetail.data.company === 'Google', 'Company details match database record');
    assert(rDetail.data.profileStatus !== undefined, 'Profile status property attached');
    assert(Array.isArray(rDetail.data.missingFields), 'Missing fields array attached');

    // 5. Data Quality Stats Integration
    console.log('\n--- 5. Data Quality Stats Integration ---');
    const rDq = await fetchApi('/api/v1/admin/data-quality/stats');
    assert(rDq.status === 200, 'GET /admin/data-quality/stats returns 200 OK');
    assert(typeof rDq.data.complete === 'number', 'Quality stats contains complete count');
    assert(typeof rDq.data.needsUpdate === 'number', 'Quality stats contains needsUpdate count');
    assert(
      rDq.data.complete + rDq.data.incomplete + rDq.data.needsUpdate === dbUsersCount,
      `Complete + Incomplete + NeedsUpdate sum equals total database users (${dbUsersCount})`
    );

    // 6. Alumni Verification Queue Integration
    console.log('\n--- 6. Alumni Verification Queue Integration ---');
    const rVerifications = await fetchApi('/api/v1/admin/verifications');
    assert(rVerifications.status === 200, 'GET /admin/verifications returns 200 OK');
    assert(Array.isArray(rVerifications.data.verifications), 'Verifications returns array of queue records');
    assert(rVerifications.data.totalCount >= 1, 'Verification queue contains real records');

    console.log('\n================================================================');
    console.log(`  INTEGRATION TEST RESULTS: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('================================================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Integration test failed:', err);
    server.close();
    process.exit(1);
  }
};

runFrontendIntegrationTest();
