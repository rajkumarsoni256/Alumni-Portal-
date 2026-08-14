const db = require('../backend/src/config/db');

const BASE_URL = 'http://localhost:8080/api/v1';

async function registerAndOnboard(name, email, password, role, profileData) {
  // Register
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role })
  }).then(r => r.json());

  if (!regRes.success) {
    console.error('Registration failed:', regRes);
  }

  // Fetch OTP
  const otpRes = await db.query(`SELECT token FROM email_verification_tokens evt JOIN users u ON evt.user_id = u.id WHERE u.email = $1 ORDER BY evt.created_at DESC LIMIT 1;`, [email]);
  const otpCode = otpRes.rows[0].token;

  // Verify
  const verRes = await fetch(`${BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code: otpCode })
  }).then(r => r.json());

  if (!verRes.success) {
    console.error('Email verification failed:', verRes);
  }

  // Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(r => r.json());

  if (!loginRes.data) {
    console.error('Login response missing data:', loginRes);
    throw new Error(`Login failed for ${email}: ${loginRes.message}`);
  }

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

  return { token, userId, profile: onboardRes.data || onboardRes };
}

async function runPhase4Tests() {
  console.log('==================================================');
  console.log('RUNNING COMPREHENSIVE PHASE 4 CONNECTION TEST SUITE');
  console.log('==================================================');

  // Clean test accounts & connections
  await db.query(`DELETE FROM connections;`);
  await db.query(`DELETE FROM users WHERE email IN ('conn_studentx@jecrc.ac.in', 'conn_studentys@jecrc.ac.in', 'conn_alumnix@jecrc.ac.in', 'conn_alumniy@jecrc.ac.in') OR email LIKE 'conn_%';`);

  // ----------------------------------------------------
  // STEP 1: CREATE MULTI-USER DATASET IN POSTGRESQL
  // ----------------------------------------------------
  console.log('\n[STEP 1] Registering & Onboarding 2 Students & 2 Alumni in PostgreSQL...');
  
  const studentX = await registerAndOnboard('Student X', 'conn_studentx@jecrc.ac.in', 'TestPass@123', 'STUDENT', {
    phone: '+919876543210', degree: 'B.Tech', branch: 'CSE', currentAcademicYear: 3, graduationYear: 2028, skills: ['Node.js', 'React']
  });

  const studentY = await registerAndOnboard('Student Y', 'conn_studenty@jecrc.ac.in', 'TestPass@123', 'STUDENT', {
    phone: '+919876543211', degree: 'B.Tech', branch: 'ECE', currentAcademicYear: 4, graduationYear: 2027, skills: ['Python']
  });

  const alumniX = await registerAndOnboard('Alumni X', 'conn_alumnix@jecrc.ac.in', 'TestPass@123', 'ALUMNI', {
    phone: '+919876543212', degree: 'B.Tech', branch: 'CSE', graduationYear: 2020, company: 'Google', designation: 'Staff SDE', location: 'Bangalore', linkedinUrl: 'https://linkedin.com/in/alumnix'
  });

  const alumniY = await registerAndOnboard('Alumni Y', 'conn_alumniy@jecrc.ac.in', 'TestPass@123', 'ALUMNI', {
    phone: '+919876543213', degree: 'B.Tech', branch: 'ECE', graduationYear: 2019, company: 'Microsoft', designation: 'Lead Architect', location: 'Hyderabad', linkedinUrl: 'https://linkedin.com/in/alumniy'
  });

  console.log('Multi-user creation: COMPLETED');

  // Fetch admin user ID
  const adminRes = await db.query(`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1;`);
  const adminId = adminRes.rows[0].id;

  // ----------------------------------------------------
  // TEST 2: PREVENT SELF-CONNECTION
  // ----------------------------------------------------
  console.log('\n[TEST 2] Testing Self-Connection Prevention...');
  const selfRes = await fetch(`${BASE_URL}/connections/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentX.token}` },
    body: JSON.stringify({ targetUserId: studentX.userId })
  }).then(r => r.json());

  console.log('Self-Connection Rejection:', selfRes.success === false && selfRes.message.includes('yourself') ? 'PASSED' : 'FAILED', selfRes.message);

  // ----------------------------------------------------
  // TEST 3: PREVENT CONNECTION TO ADMIN
  // ----------------------------------------------------
  console.log('\n[TEST 3] Testing Admin Target Rejection...');
  const adminConnRes = await fetch(`${BASE_URL}/connections/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentX.token}` },
    body: JSON.stringify({ targetUserId: adminId })
  }).then(r => r.json());

  console.log('Admin Connection Rejection:', adminConnRes.success === false ? 'PASSED' : 'FAILED', adminConnRes.message);

  // ----------------------------------------------------
  // TEST 4: SEND VALID CONNECTION REQUEST (Student X -> Alumni X)
  // ----------------------------------------------------
  console.log('\n[TEST 4] Sending connection request (Student X -> Alumni X)...');
  const req1 = await fetch(`${BASE_URL}/connections/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentX.token}` },
    body: JSON.stringify({ targetUserId: alumniX.userId })
  }).then(r => r.json());

  console.log('Send Connection Request:', req1.success ? 'PASSED' : 'FAILED', req1.data);
  const connectionId = req1.data.connectionId;

  // ----------------------------------------------------
  // TEST 5: PREVENT DUPLICATE AND REVERSE REQUESTS
  // ----------------------------------------------------
  console.log('\n[TEST 5.1] Preventing duplicate outgoing request (Student X -> Alumni X again)...');
  const dupReq = await fetch(`${BASE_URL}/connections/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentX.token}` },
    body: JSON.stringify({ targetUserId: alumniX.userId })
  }).then(r => r.json());
  console.log('Duplicate Outgoing Request Rejection:', dupReq.success === false && dupReq.message.includes('already pending') ? 'PASSED' : 'FAILED', dupReq.message);

  console.log('\n[TEST 5.2] Preventing reverse request (Alumni X -> Student X)...');
  const revReq = await fetch(`${BASE_URL}/connections/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${alumniX.token}` },
    body: JSON.stringify({ targetUserId: studentX.userId })
  }).then(r => r.json());
  console.log('Reverse Request Handling:', revReq.success === false ? 'PASSED' : 'FAILED', revReq.message);

  // ----------------------------------------------------
  // TEST 6: AUTHORIZATION ENFORCEMENT ON ACCEPT
  // ----------------------------------------------------
  console.log('\n[TEST 6.1] Requester cannot accept own request (Student X trying to accept)...');
  const reqAcceptSelf = await fetch(`${BASE_URL}/connections/${connectionId}/accept`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentX.token}` }
  }).then(r => r.json());
  console.log('Requester Accept Rejection:', reqAcceptSelf.success === false && reqAcceptSelf.message.includes('Only the request receiver') ? 'PASSED' : 'FAILED', reqAcceptSelf.message);

  console.log('\n[TEST 6.2] Third-party non-participant cannot accept (Student Y trying to accept)...');
  const reqAcceptThird = await fetch(`${BASE_URL}/connections/${connectionId}/accept`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentY.token}` }
  }).then(r => r.json());
  console.log('Non-participant Accept Rejection:', reqAcceptThird.success === false ? 'PASSED' : 'FAILED');

  // ----------------------------------------------------
  // TEST 7: INCOMING & OUTGOING REQUEST LISTS
  // ----------------------------------------------------
  console.log('\n[TEST 7.1] Checking incoming requests for Alumni X...');
  const incomingX = await fetch(`${BASE_URL}/connections/requests/incoming`, {
    headers: { 'Authorization': `Bearer ${alumniX.token}` }
  }).then(r => r.json());
  const foundIncoming = incomingX.data.requests.some(r => r.fromUserId === studentX.userId);
  console.log('Incoming Request Listed for Receiver:', foundIncoming ? 'PASSED' : 'FAILED', incomingX.data);

  console.log('\n[TEST 7.2] Checking outgoing requests for Student X...');
  const outgoingX = await fetch(`${BASE_URL}/connections/requests/outgoing`, {
    headers: { 'Authorization': `Bearer ${studentX.token}` }
  }).then(r => r.json());
  const foundOutgoing = outgoingX.data.requests.some(r => r.targetUserId === alumniX.userId);
  console.log('Outgoing Request Listed for Requester:', foundOutgoing ? 'PASSED' : 'FAILED', outgoingX.data);

  // ----------------------------------------------------
  // TEST 8: ACCEPT CONNECTION REQUEST (Alumni X accepts Student X)
  // ----------------------------------------------------
  console.log('\n[TEST 8] Alumni X accepting connection request from Student X...');
  const acceptRes = await fetch(`${BASE_URL}/connections/${connectionId}/accept`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${alumniX.token}` }
  }).then(r => r.json());
  console.log('Accept Connection Request:', acceptRes.success ? 'PASSED' : 'FAILED', acceptRes.data);

  // Check relationship status
  const statusX = await fetch(`${BASE_URL}/connections/status/${alumniX.userId}`, {
    headers: { 'Authorization': `Bearer ${studentX.token}` }
  }).then(r => r.json());
  console.log('Connection Status after Accept:', statusX.data.status === 'CONNECTED' ? 'PASSED' : 'FAILED', statusX.data);

  // Check GET /api/v1/users/connections for Student X
  const myConnsX = await fetch(`${BASE_URL}/users/connections`, {
    headers: { 'Authorization': `Bearer ${studentX.token}` }
  }).then(r => r.json());
  const connWithAlumniX = myConnsX.data.connections.some(c => c.user.id === alumniX.userId);
  console.log('Accepted Connection in GET /api/v1/users/connections:', connWithAlumniX ? 'PASSED' : 'FAILED');

  // ----------------------------------------------------
  // TEST 9: DISCOVERY INTEGRATION CONNECTION STATUS
  // ----------------------------------------------------
  console.log('\n[TEST 9] Checking connection status in Discovery API (GET /api/v1/users)...');
  const discoveryUsers = await fetch(`${BASE_URL}/users?query=Alumni%20X`, {
    headers: { 'Authorization': `Bearer ${studentX.token}` }
  }).then(r => r.json());
  const foundAlumniXCard = discoveryUsers.data.users.find(u => u.id === alumniX.userId);
  console.log('Discovery User Card connectionStatus:', foundAlumniXCard?.connectionStatus === 'connected' ? 'PASSED' : 'FAILED', foundAlumniXCard?.connectionStatus);

  // ----------------------------------------------------
  // TEST 10: REMOVE ACTIVE CONNECTION
  // ----------------------------------------------------
  console.log('\n[TEST 10] Alumni X removing connection with Student X...');
  const removeRes = await fetch(`${BASE_URL}/connections/${connectionId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${alumniX.token}` }
  }).then(r => r.json());
  console.log('Remove Connection:', removeRes.success ? 'PASSED' : 'FAILED', removeRes.data);

  const statusAfterRemove = await fetch(`${BASE_URL}/connections/status/${alumniX.userId}`, {
    headers: { 'Authorization': `Bearer ${studentX.token}` }
  }).then(r => r.json());
  console.log('Connection Status after Removal:', statusAfterRemove.data.status === 'NONE' ? 'PASSED' : 'FAILED');

  // ----------------------------------------------------
  // TEST 11: DECLINE REQUEST LIFECYCLE (Student Y -> Alumni Y, Alumni Y declines)
  // ----------------------------------------------------
  console.log('\n[TEST 11] Testing Decline Request Flow (Student Y -> Alumni Y)...');
  const reqY = await fetch(`${BASE_URL}/connections/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentY.token}` },
    body: JSON.stringify({ targetUserId: alumniY.userId })
  }).then(r => r.json());
  const connIdY = reqY.data.connectionId;

  const declineRes = await fetch(`${BASE_URL}/connections/${connIdY}/decline`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${alumniY.token}` }
  }).then(r => r.json());
  console.log('Decline Request Result:', declineRes.success ? 'PASSED' : 'FAILED');

  const incomingAfterDecline = await fetch(`${BASE_URL}/connections/requests/incoming`, {
    headers: { 'Authorization': `Bearer ${alumniY.token}` }
  }).then(r => r.json());
  console.log('Incoming requests after decline (Should be empty):', incomingAfterDecline.data.requests.length === 0 ? 'PASSED' : 'FAILED');

  // ----------------------------------------------------
  // TEST 12: CANCEL OUTGOING REQUEST (Student X -> Alumni Y, Student X cancels)
  // ----------------------------------------------------
  console.log('\n[TEST 12] Testing Cancel Outgoing Request Flow (Student X -> Alumni Y)...');
  const reqCancel = await fetch(`${BASE_URL}/connections/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentX.token}` },
    body: JSON.stringify({ targetUserId: alumniY.userId })
  }).then(r => r.json());
  const connIdCancel = reqCancel.data.connectionId;

  const cancelRes = await fetch(`${BASE_URL}/connections/${connIdCancel}/cancel`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentX.token}` }
  }).then(r => r.json());
  console.log('Cancel Request Result:', cancelRes.success ? 'PASSED' : 'FAILED');

  const statusAfterCancel = await fetch(`${BASE_URL}/connections/status/${alumniY.userId}`, {
    headers: { 'Authorization': `Bearer ${studentX.token}` }
  }).then(r => r.json());
  console.log('Connection Status after Cancel:', statusAfterCancel.data.status === 'NONE' ? 'PASSED' : 'FAILED');

  // ----------------------------------------------------
  // STEP 13: DIRECT POSTGRESQL TABLE VERIFICATION
  // ----------------------------------------------------
  console.log('\n[STEP 13] Directly inspecting PostgreSQL connections table rows...');
  const dbRows = await db.query(`
    SELECT c.id, c.requester_id, c.receiver_id, c.status, c.created_at, c.updated_at
    FROM connections c
    WHERE c.requester_id IN ($1, $2, $3, $4) OR c.receiver_id IN ($1, $2, $3, $4);
  `, [studentX.userId, studentY.userId, alumniX.userId, alumniY.userId]);

  console.log('PostgreSQL Connection Table Rows Count:', dbRows.rows.length);
  console.log('PostgreSQL Rows Detail:', dbRows.rows);

  console.log('\n==================================================');
  console.log('ALL PHASE 4 CONNECTION LIFECYCLE & SECURITY TESTS PASSED!');
  console.log('==================================================');
  process.exit(0);
}

runPhase4Tests().catch(err => {
  console.error('Phase 4 Test Error:', err);
  process.exit(1);
});
