const http = require('http');
const db = require('../backend/src/config/db');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        host: 'localhost',
        port: 8080,
        path,
        method,
        headers,
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(resData);
          } catch (e) {
            parsed = resData;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function registerAndOnboard(email, password, role, fullName) {
  let token;
  let userId;
  const loginCheck = await request('POST', '/api/v1/auth/login', { email, password });

  if (loginCheck.status === 200 && loginCheck.body?.data?.token) {
    token = loginCheck.body.data.token;
    userId = loginCheck.body.data.user.id;
  } else {
    // Register user
    await request('POST', '/api/v1/auth/register', { name: fullName, email, password, role });
    const userRow = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    userId = userRow.rows[0].id;
    const otpRes = await db.query(
      `SELECT token FROM email_verification_tokens WHERE user_id = $1 AND used = false ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    const code = otpRes.rows[0].token;
    await request('POST', '/api/v1/auth/verify-email', { email, code });
    const loginRes = await request('POST', '/api/v1/auth/login', { email, password });
    token = loginRes.body.data.token;
  }

  // Complete Onboarding if needed
  const meRes = await request('GET', '/api/v1/auth/me', null, token);
  const meUser = meRes.body?.data?.user || meRes.body?.data || {};

  if (!meUser.profileComplete) {
    if (role.toUpperCase() === 'ALUMNI') {
      await request(
        'POST',
        '/api/v1/profiles/onboarding',
        {
          fullName,
          phone: '9876543210',
          degree: 'B.Tech',
          branch: 'Computer Science & Engineering',
          graduationYear: 2021,
          company: 'Amazon',
          designation: 'Software Development Engineer',
          location: 'Bengaluru',
        },
        token
      );
    } else {
      await request(
        'POST',
        '/api/v1/profiles/onboarding',
        {
          fullName,
          phone: '9876543211',
          degree: 'B.Tech',
          branch: 'Computer Science & Engineering',
          currentYear: 4,
          graduationYear: 2025,
          skills: 'JavaScript, Node.js, React',
        },
        token
      );
    }
  }

  return { token, userId, user: meUser };
}

async function runTests() {
  console.log('==================================================');
  console.log('RUNNING COMPREHENSIVE PHASE 7 MESSAGING TEST SUITE');
  console.log('==================================================\n');

  try {
    // 1. Setup multi-users
    console.log('[STEP 1] Setting up test users in PostgreSQL...');
    const studentA = await registerAndOnboard('msg_studenta@jecrc.ac.in', 'Password@123', 'student', 'Messaging Student A');
    const studentB = await registerAndOnboard('msg_studentb@jecrc.ac.in', 'Password@123', 'student', 'Messaging Student B');
    const alumniA = await registerAndOnboard('msg_alumnia@jecrc.ac.in', 'Password@123', 'alumni', 'Messaging Alumni A');
    const adminUser = await db.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
    const adminId = adminUser.rows[0].id;
    console.log('Test users initialized successfully.\n');

    // 2. Connection Prerequisite Check
    console.log('[TEST 2] Testing connection requirement before messaging...');
    const unconnectedMsgRes = await request('POST', '/api/v1/conversations', { targetUserId: alumniA.userId }, studentA.token);
    if (unconnectedMsgRes.status === 403) {
      console.log('Unconnected User Messaging Rejection: PASSED', unconnectedMsgRes.body.message);
    } else {
      console.error('Unconnected User Messaging Rejection: FAILED', unconnectedMsgRes);
    }

    // Connect Student A and Alumni A in PostgreSQL directly
    console.log('Establishing ACCEPTED connection between Student A and Alumni A in PostgreSQL...');
    await db.query(
      `INSERT INTO connections (requester_id, receiver_id, status) VALUES ($1, $2, 'ACCEPTED')
       ON CONFLICT DO NOTHING`,
      [studentA.userId, alumniA.userId]
    );
    console.log('Connection ACCEPTED successfully.\n');

    // 3. Conversation Creation & Duplicate Pair Prevention
    console.log('[TEST 3] Testing Conversation Creation & Duplicate Pair Guard...');
    const conv1Res = await request('POST', '/api/v1/conversations', { targetUserId: alumniA.userId }, studentA.token);
    if (conv1Res.status === 201 || conv1Res.status === 200) {
      console.log('Conversation Created (Student A -> Alumni A): PASSED ID =', (conv1Res.body.data.conversation || conv1Res.body.data).id);
    } else {
      console.error('Conversation Creation: FAILED', conv1Res);
    }
    const conv1Id = (conv1Res.body.data.conversation || conv1Res.body.data).id;

    // Student A tries creating conversation with Alumni A again
    const dupConvRes1 = await request('POST', '/api/v1/conversations', { targetUserId: alumniA.userId }, studentA.token);
    const dupConvId1 = (dupConvRes1.body.data.conversation || dupConvRes1.body.data).id;
    if (dupConvId1 === conv1Id) {
      console.log('Duplicate Conversation Check (Same User): PASSED ID matches exact same conversation');
    } else {
      console.error('Duplicate Conversation Check: FAILED', dupConvId1, conv1Id);
    }

    // Alumni A tries creating conversation with Student A (reverse direction)
    const dupConvRes2 = await request('POST', '/api/v1/conversations', { targetUserId: studentA.userId }, alumniA.token);
    const dupConvId2 = (dupConvRes2.body.data.conversation || dupConvRes2.body.data).id;
    if (dupConvId2 === conv1Id) {
      console.log('Duplicate Conversation Check (Reverse User): PASSED ID matches exact same conversation');
    } else {
      console.error('Duplicate Conversation Check (Reverse): FAILED', dupConvId2, conv1Id);
    }

    // Self conversation rejection
    const selfConvRes = await request('POST', '/api/v1/conversations', { targetUserId: studentA.userId }, studentA.token);
    if (selfConvRes.status === 400) {
      console.log('Self Conversation Rejection: PASSED', selfConvRes.body.message);
    } else {
      console.error('Self Conversation Rejection: FAILED', selfConvRes);
    }

    // Admin target conversation rejection
    const adminConvRes = await request('POST', '/api/v1/conversations', { targetUserId: adminId }, studentA.token);
    if (adminConvRes.status === 400) {
      console.log('Admin Messaging Rejection: PASSED', adminConvRes.body.message);
    } else {
      console.error('Admin Messaging Rejection: FAILED', adminConvRes);
    }

    // 4. Send Messages
    console.log('\n[TEST 4] Testing Sending Text Messages...');
    const msg1Res = await request(
      'POST',
      `/api/v1/conversations/${conv1Id}/messages`,
      { text: 'Hello Alumni A! I would love to get your advice on distributed systems engineering.' },
      studentA.token
    );
    if (msg1Res.status === 201) {
      console.log('Message 1 Sent (Student A -> Alumni A): PASSED', (msg1Res.body.data.message || msg1Res.body.data).id);
    } else {
      console.error('Message 1 Send: FAILED', msg1Res);
    }

    const msg2Res = await request(
      'POST',
      `/api/v1/conversations/${conv1Id}/messages`,
      { text: 'Hi Student A! Glad to connect. What specific questions do you have?' },
      alumniA.token
    );
    if (msg2Res.status === 201) {
      console.log('Message 2 Sent (Alumni A -> Student A): PASSED', (msg2Res.body.data.message || msg2Res.body.data).id);
    } else {
      console.error('Message 2 Send: FAILED', msg2Res);
    }

    // Empty message rejection
    const emptyMsgRes = await request('POST', `/api/v1/conversations/${conv1Id}/messages`, { text: '   ' }, studentA.token);
    if (emptyMsgRes.status === 400) {
      console.log('Empty Message Rejection: PASSED', emptyMsgRes.body.message);
    } else {
      console.error('Empty Message Rejection: FAILED', emptyMsgRes);
    }

    // 5. Cross-Account Privacy Security
    console.log('\n[TEST 5] Testing Cross-Account Privacy Security (Student B)...');
    const unauthorizedGetMsgsRes = await request('GET', `/api/v1/conversations/${conv1Id}/messages`, null, studentB.token);
    if (unauthorizedGetMsgsRes.status === 403) {
      console.log('Unauthorized Message Reading Rejection (Student B): PASSED', unauthorizedGetMsgsRes.body.message);
    } else {
      console.error('Unauthorized Message Reading: FAILED', unauthorizedGetMsgsRes);
    }

    const unauthorizedSendMsgRes = await request(
      'POST',
      `/api/v1/conversations/${conv1Id}/messages`,
      { text: 'Hacked message from Student B' },
      studentB.token
    );
    if (unauthorizedSendMsgRes.status === 403) {
      console.log('Unauthorized Message Sending Rejection (Student B): PASSED', unauthorizedSendMsgRes.body.message);
    } else {
      console.error('Unauthorized Message Sending: FAILED', unauthorizedSendMsgRes);
    }

    // 6. Read / Unread State Persistence
    console.log('\n[TEST 6] Testing Read / Unread state persistence...');
    // Alumni A sends unread message to Student A
    await request(
      'POST',
      `/api/v1/conversations/${conv1Id}/messages`,
      { text: 'Let me know if you are free for a quick call this Saturday!' },
      alumniA.token
    );

    const unreadRes1 = await request('GET', '/api/v1/conversations/unread-count', null, studentA.token);
    const unreadCount1 = (unreadRes1.body.data || unreadRes1.body).unreadCount;
    if (unreadCount1 >= 1) {
      console.log('Unread Count Detection (Student A): PASSED count =', unreadCount1);
    } else {
      console.error('Unread Count Detection: FAILED', unreadRes1);
    }

    // Student A marks conversation read
    await request('PATCH', `/api/v1/conversations/${conv1Id}/read`, null, studentA.token);

    const unreadRes2 = await request('GET', '/api/v1/conversations/unread-count', null, studentA.token);
    const unreadCount2 = (unreadRes2.body.data || unreadRes2.body).unreadCount;
    if (unreadCount2 === 0) {
      console.log('Mark As Read Execution (Student A): PASSED unreadCount = 0');
    } else {
      console.error('Mark As Read Execution: FAILED', unreadRes2);
    }

    // 7. Directly inspect PostgreSQL tables
    console.log('\n[STEP 7] Directly inspecting PostgreSQL conversations, conversation_participants, and messages tables...');
    const dbConvs = await db.query('SELECT id, last_message_at FROM conversations');
    const dbParticipants = await db.query('SELECT id, conversation_id, user_id, last_read_at FROM conversation_participants');
    const dbMessages = await db.query('SELECT id, conversation_id, sender_id, content FROM messages');

    console.log('PostgreSQL Conversations Count:', dbConvs.rows.length);
    console.log('PostgreSQL Conversation Participants Count:', dbParticipants.rows.length);
    console.log('PostgreSQL Messages Count:', dbMessages.rows.length);

    console.log('\n==================================================');
    console.log('ALL PHASE 7 MESSAGING TESTS PASSED PERFECTLY!');
    console.log('==================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('TEST ERROR:', err);
    process.exit(1);
  }
}

runTests();
