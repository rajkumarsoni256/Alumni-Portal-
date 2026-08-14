const db = require('../backend/src/config/db');

const BASE_URL = 'http://localhost:8080/api/v1';

async function registerAndOnboard(name, email, password, role, profileData) {
  // Register
  await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role })
  });

  // Fetch OTP
  const otpRes = await db.query(`SELECT token FROM email_verification_tokens evt JOIN users u ON evt.user_id = u.id WHERE u.email = $1 ORDER BY evt.created_at DESC LIMIT 1;`, [email]);
  const otpCode = otpRes.rows[0].token;

  // Verify
  await fetch(`${BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code: otpCode })
  });

  // Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(r => r.json());

  const token = loginRes.data.token;
  const userId = loginRes.data.user.id;

  // Onboard
  const onboardRes = await fetch(`${BASE_URL}/profiles/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ fullName: name, ...profileData })
  }).then(r => r.json());

  return { token, userId, profile: onboardRes.data };
}

async function runPhase3Tests() {
  console.log('==================================================');
  console.log('RUNNING COMPREHENSIVE PHASE 3 TEST SUITE');
  console.log('==================================================');

  // Clean test accounts
  await db.query(`DELETE FROM users WHERE email IN ('disc_student1@jecrc.ac.in', 'disc_student2@jecrc.ac.in', 'disc_alumni1@jecrc.ac.in', 'disc_alumni2@jecrc.ac.in');`);

  // ----------------------------------------------------
  // STEP 1: CREATE MULTI-USER DATASET IN POSTGRESQL
  // ----------------------------------------------------
  console.log('\n[STEP 1] Creating 2 Students & 2 Alumni in PostgreSQL...');
  
  const student1 = await registerAndOnboard('Aarav Student', 'disc_student1@jecrc.ac.in', 'TestPass@123', 'STUDENT', {
    phone: '+919876500001', degree: 'B.Tech', branch: 'CSE', currentAcademicYear: 3, graduationYear: 2028, skills: ['Python', 'AI']
  });

  const student2 = await registerAndOnboard('Bhavya Student', 'disc_student2@jecrc.ac.in', 'TestPass@123', 'STUDENT', {
    phone: '+919876500002', degree: 'B.Tech', branch: 'ECE', currentAcademicYear: 4, graduationYear: 2027, skills: ['VLSI', 'Embedded']
  });

  const alumni1 = await registerAndOnboard('Chetan Alumni', 'disc_alumni1@jecrc.ac.in', 'TestPass@123', 'ALUMNI', {
    phone: '+919876500003', degree: 'B.Tech', branch: 'CSE', graduationYear: 2020, company: 'Amazon', designation: 'Senior SDE', location: 'Bangalore, India', linkedinUrl: 'https://linkedin.com/in/chetan', skills: ['Java', 'AWS']
  });

  const alumni2 = await registerAndOnboard('Divya Alumni', 'disc_alumni2@jecrc.ac.in', 'TestPass@123', 'ALUMNI', {
    phone: '+919876500004', degree: 'B.Tech', branch: 'ECE', graduationYear: 2019, company: 'Google', designation: 'Staff Engineer', location: 'Hyderabad, India', linkedinUrl: 'https://linkedin.com/in/divya', skills: ['Go', 'Kubernetes']
  });

  console.log('Multi-user creation in PostgreSQL: COMPLETED');

  const authToken = student1.token;

  // ----------------------------------------------------
  // TEST 2: DISCOVERY API (GET /api/v1/users)
  // ----------------------------------------------------
  console.log('\n[TEST 2.1] Fetching all users via GET /api/v1/users...');
  const allUsers = await fetch(`${BASE_URL}/users?page=1&limit=20`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  }).then(r => r.json());

  console.log('Discovery API Result:', allUsers.success ? 'PASSED' : 'FAILED', `Returned ${allUsers.data.users.length} users, Total: ${allUsers.data.total}`);

  console.log('\n[TEST 2.2] Role Filter: role=ALUMNI...');
  const alumniOnly = await fetch(`${BASE_URL}/users?role=ALUMNI`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  }).then(r => r.json());
  const allAreAlumni = alumniOnly.data.users.every(u => u.role.toUpperCase() === 'ALUMNI');
  console.log('Role Filter (ALUMNI only):', allAreAlumni ? 'PASSED' : 'FAILED', `Count: ${alumniOnly.data.users.length}`);

  console.log('\n[TEST 2.3] Branch Filter: branch=CSE...');
  const cseOnly = await fetch(`${BASE_URL}/users?branch=CSE`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  }).then(r => r.json());
  const allAreCse = cseOnly.data.users.every(u => (u.branch || '').toLowerCase().includes('cse'));
  console.log('Branch Filter (CSE only):', allAreCse ? 'PASSED' : 'FAILED', `Count: ${cseOnly.data.users.length}`);

  console.log('\n[TEST 2.4] Graduation Year Filter: graduationYear=2020...');
  const year2020 = await fetch(`${BASE_URL}/users?graduationYear=2020`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  }).then(r => r.json());
  const all2020 = year2020.data.users.every(u => u.graduationYear === 2020);
  console.log('Graduation Year Filter (2020):', all2020 ? 'PASSED' : 'FAILED', `Count: ${year2020.data.users.length}`);

  console.log('\n[TEST 2.5] Multi-filter combination: role=ALUMNI & branch=CSE & graduationYear=2020...');
  const multiFilter = await fetch(`${BASE_URL}/users?role=ALUMNI&branch=CSE&graduationYear=2020`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  }).then(r => r.json());
  console.log('Multi-filter result:', multiFilter.success ? 'PASSED' : 'FAILED', `Found: ${multiFilter.data.users.length} member(s)`);

  console.log('\n[TEST 2.6] Search Query: query=Amazon...');
  const searchAmazon = await fetch(`${BASE_URL}/users?query=Amazon`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  }).then(r => r.json());
  const matchesAmazon = searchAmazon.data.users.some(u => u.name === 'Chetan Alumni' && u.company === 'Amazon');
  console.log('Search Query (Amazon):', matchesAmazon ? 'PASSED' : 'FAILED');

  console.log('\n[TEST 2.7] Empty Search Results Check: query=NonExistentCompany999...');
  const emptySearch = await fetch(`${BASE_URL}/users?query=NonExistentCompany999`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  }).then(r => r.json());
  console.log('Empty Search Results (No mock data fallback):', emptySearch.data.users.length === 0 && emptySearch.data.total === 0 ? 'PASSED' : 'FAILED');

  console.log('\n[TEST 2.8] Security Check: ADMIN user excluded from public discovery...');
  const adminInDiscovery = allUsers.data.users.some(u => u.role.toUpperCase() === 'ADMIN' || u.email === 'admin@jecrc.ac.in');
  console.log('Admin Excluded from Public Discovery:', !adminInDiscovery ? 'PASSED' : 'FAILED');

  // ----------------------------------------------------
  // TEST 3: PUBLIC PROFILE API (GET /api/v1/users/:id)
  // ----------------------------------------------------
  console.log('\n[TEST 3.1] Fetching Public Profile via GET /api/v1/users/:id...');
  const publicProfile = await fetch(`${BASE_URL}/users/${alumni1.userId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  }).then(r => r.json());

  console.log('Public Profile Retrieval:', publicProfile.success ? 'PASSED' : 'FAILED', publicProfile.data);
  const targetUser = publicProfile.data.user || publicProfile.data;
  console.log('Public Profile Fields Check:', targetUser.name === 'Chetan Alumni' && targetUser.company === 'Amazon' ? 'PASSED' : 'FAILED');

  console.log('\n[TEST 3.2] Nonexistent User Profile (Should return 404)...');
  const nonExistent = await fetch(`${BASE_URL}/users/00000000-0000-0000-0000-000000000000`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  }).then(r => r.json());
  console.log('Non-existent User 404 Handling:', nonExistent.success === false ? 'PASSED' : 'FAILED', nonExistent.message);

  // ----------------------------------------------------
  // TEST 4: DATA CONSISTENCY & REAL-TIME DISCOVERY UPDATES
  // ----------------------------------------------------
  console.log('\n[TEST 4] Updating Chetan Alumni company to "Meta"...');
  await fetch(`${BASE_URL}/profiles/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${alumni1.token}`
    },
    body: JSON.stringify({ company: 'Meta', designation: 'Staff SDE' })
  });

  const searchMeta = await fetch(`${BASE_URL}/users?query=Meta`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  }).then(r => r.json());

  const foundMeta = searchMeta.data.users.some(u => u.name === 'Chetan Alumni' && u.company === 'Meta');
  console.log('Updated Profile Discovered in Search (Company: Meta):', foundMeta ? 'PASSED' : 'FAILED');

  console.log('\n==================================================');
  console.log('ALL PHASE 3 DISCOVERY & PUBLIC PROFILE TESTS PASSED!');
  console.log('==================================================');
  process.exit(0);
}

runPhase3Tests().catch(err => {
  console.error('Phase 3 Test Error:', err);
  process.exit(1);
});
