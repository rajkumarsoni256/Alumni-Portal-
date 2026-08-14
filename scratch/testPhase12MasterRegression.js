/**
 * PHASE 12 — MASTER END-TO-END REGRESSION & SYSTEM INTEGRATION SUITE
 * 
 * Verifies all 10 Modules (Auth, Profiles, Discovery, Connections, Feed, Jobs,
 * Messaging, Notifications, Events, Mentorship), Cross-Module Journeys,
 * Security Guards, and PostgreSQL state integrity.
 */

const db = require('../backend/src/config/db');

const API_BASE = 'http://localhost:8080/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const response = await fetch(url, { ...options, headers });
  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }
  return { status: response.status, ok: response.ok, data };
}

async function runMasterRegression() {
  console.log('===========================================================');
  console.log('🚀 STARTING PHASE 12 MASTER END-TO-END REGRESSION SUITE');
  console.log('===========================================================\n');

  try {
    // ---------------------------------------------------------
    // 1. Environment & Database Baseline Check
    // ---------------------------------------------------------
    console.log('[1] Checking Database Baseline & Table Integrity...');
    const tables = [
      'users', 'user_profiles', 'connections', 'posts', 'post_likes',
      'comments', 'jobs', 'job_bookmarks', 'job_applications',
      'conversations', 'messages', 'notifications', 'events',
      'event_registrations', 'mentorship_requests'
    ];

    const baselineCounts = {};
    for (const t of tables) {
      const res = await db.query(`SELECT COUNT(*) FROM ${t}`);
      baselineCounts[t] = parseInt(res.rows[0].count, 10);
    }
    console.log('✓ Baseline Counts:', JSON.stringify(baselineCounts, null, 2));

    // ---------------------------------------------------------
    // 2. Authentication & Identity E2E
    // ---------------------------------------------------------
    console.log('\n[2] Testing Auth & Identity E2E...');
    const timestamp = Date.now();
    const stuEmail = `reg_stu_${timestamp}@jecrc.ac.in`;
    const almEmail = `reg_alm_${timestamp}@jecrc.ac.in`;

    // Register Student
    const regStu = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Master Student',
        email: stuEmail,
        password: 'Password@123',
        role: 'STUDENT',
      }),
    });
    if (regStu.status !== 201) throw new Error(`Student registration failed: ${JSON.stringify(regStu.data)}`);

    // Fetch code from db by querying users table first
    const stuUserDb = await db.query('SELECT id FROM users WHERE email = $1', [stuEmail]);
    const stuUserId = stuUserDb.rows[0].id;
    const stuCodeRes = await db.query('SELECT token FROM email_verification_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [stuUserId]);
    const stuCode = stuCodeRes.rows[0].token;

    // Verify Email
    const verifyStu = await request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email: stuEmail, code: stuCode }),
    });
    if (!verifyStu.ok) throw new Error('Student email verification failed');

    // Login Student
    const loginStu = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: stuEmail, password: 'Password@123' }),
    });
    if (!loginStu.ok) throw new Error('Student login failed');
    const stuToken = loginStu.data.data.token;
    const stuUser = loginStu.data.data.user;

    // Register Alumni
    const regAlm = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Master Alumni',
        email: almEmail,
        password: 'Password@123',
        role: 'ALUMNI',
      }),
    });
    if (regAlm.status !== 201) throw new Error(`Alumni registration failed: ${JSON.stringify(regAlm.data)}`);

    const almUserDb = await db.query('SELECT id FROM users WHERE email = $1', [almEmail]);
    const almUserId = almUserDb.rows[0].id;
    const almCodeRes = await db.query('SELECT token FROM email_verification_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [almUserId]);
    const almCode = almCodeRes.rows[0].token;

    await request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email: almEmail, code: almCode }),
    });

    const loginAlm = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: almEmail, password: 'Password@123' }),
    });
    if (!loginAlm.ok) throw new Error('Alumni login failed');
    const almToken = loginAlm.data.data.token;
    const almUser = loginAlm.data.data.user;

    // Verify /auth/me endpoint
    const meRes = await request('/auth/me', { headers: { Authorization: `Bearer ${stuToken}` } });
    if (!meRes.ok || meRes.data.data.email !== stuEmail) throw new Error(`/auth/me verification failed: ${JSON.stringify(meRes.data)}`);

    console.log('✓ Auth E2E passed (Registration, Verification, Login, JWT, /auth/me).');

    // ---------------------------------------------------------
    // 3. Profiles & Onboarding E2E
    // ---------------------------------------------------------
    console.log('\n[3] Testing Profiles & Onboarding E2E...');
    const stuProfileRes = await request('/profiles/onboarding', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stuToken}` },
      body: JSON.stringify({
        fullName: 'Master Student User',
        phone: '+91 9876543210',
        degree: 'B.Tech',
        branch: 'Computer Science',
        graduationYear: 2026,
        currentYear: 3,
        bio: 'Aspiring AI Software Engineer from JECRC',
        skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
        interests: ['System Design', 'AI & Machine Learning'],
      }),
    });
    if (!stuProfileRes.ok) throw new Error(`Student profile creation failed: ${JSON.stringify(stuProfileRes.data)}`);

    const almProfileRes = await request('/profiles/onboarding', {
      method: 'POST',
      headers: { Authorization: `Bearer ${almToken}` },
      body: JSON.stringify({
        fullName: 'Master Alumni User',
        phone: '+91 9123456789',
        degree: 'B.Tech',
        branch: 'Computer Science',
        graduationYear: 2020,
        company: 'Google',
        designation: 'Senior Staff Software Engineer',
        location: 'Bengaluru, India',
        linkedinUrl: 'https://linkedin.com/in/master-alumni',
        bio: 'Ex-Google SDE II helping JECRC grads with mock interviews',
        skills: ['System Design', 'Distributed Systems', 'Cloud', 'Java'],
        interests: ['Mentorship', 'Mock Interviews'],
      }),
    });
    if (!almProfileRes.ok) throw new Error(`Alumni profile creation failed: ${JSON.stringify(almProfileRes.data)}`);

    // Verify PostgreSQL row
    const stuPgProfile = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [stuUser.id]);
    if (stuPgProfile.rows.length === 0 || stuPgProfile.rows[0].degree !== 'B.Tech') {
      throw new Error('Student profile PostgreSQL verification failed');
    }
    console.log('✓ Profile Onboarding E2E & PostgreSQL persistence passed.');

    // ---------------------------------------------------------
    // 4. Discovery & Search E2E
    // ---------------------------------------------------------
    console.log('\n[4] Testing User Discovery & Search E2E...');
    const searchRes = await request('/users?role=ALUMNI&query=Google', {
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    if (!searchRes.ok || searchRes.data.data.users.length === 0) {
      throw new Error('User discovery search failed');
    }
    console.log('✓ User Discovery & Directory Search passed.');

    // ---------------------------------------------------------
    // 5. Connections & Networking E2E
    // ---------------------------------------------------------
    console.log('\n[5] Testing Connections & Networking E2E...');
    // Send Connection Request
    const connReq = await request('/connections/request', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stuToken}` },
      body: JSON.stringify({ targetUserId: almUser.id }),
    });
    if (!connReq.ok) throw new Error('Connection request failed');

    // Verify Status = PENDING in PostgreSQL
    const connPg1 = await db.query('SELECT status FROM connections WHERE requester_id = $1 AND receiver_id = $2', [stuUser.id, almUser.id]);
    if (connPg1.rows[0].status !== 'PENDING') throw new Error('Connection DB status is not PENDING');

    // Accept Request by Alumni
    const acceptConn = await request(`/connections/${stuUser.id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${almToken}` },
    });
    if (!acceptConn.ok) throw new Error('Accept connection request failed');

    // Verify Status = ACCEPTED in PostgreSQL
    const connPg2 = await db.query('SELECT status FROM connections WHERE requester_id = $1 AND receiver_id = $2', [stuUser.id, almUser.id]);
    if (connPg2.rows[0].status !== 'ACCEPTED') throw new Error('Connection DB status is not ACCEPTED');
    console.log('✓ Connection E2E (Request -> Accept -> DB ACCEPTED) passed.');

    // ---------------------------------------------------------
    // 6. Community Feed E2E (Post, Like, Comment, Reply)
    // ---------------------------------------------------------
    console.log('\n[6] Testing Community Feed E2E...');
    const newPost = await request('/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stuToken}` },
      body: JSON.stringify({
        content: 'Excited to announce my new open source project built with React and PostgreSQL!',
        category: 'Projects',
        tags: ['React', 'PostgreSQL', 'FullStack'],
      }),
    });
    if (!newPost.ok) throw new Error('Post creation failed');
    const postId = newPost.data.data.post.id;

    // Like Post by Alumni
    const likeRes = await request(`/posts/${postId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${almToken}` },
    });
    if (!likeRes.ok || likeRes.data.data.likesCount !== 1) throw new Error('Post like failed');

    // Comment on Post by Alumni
    const commentRes = await request(`/posts/${postId}/comments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${almToken}` },
      body: JSON.stringify({ text: 'Great work! Keep building!' }),
    });
    if (!commentRes.ok) throw new Error('Post comment failed');
    const commentId = commentRes.data.data.comment.id;

    // Reply to Comment by Student
    const replyRes = await request(`/posts/${postId}/comments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${stuToken}` },
      body: JSON.stringify({ text: 'Thank you sir!', parentCommentId: commentId }),
    });
    if (!replyRes.ok) throw new Error('Post comment reply failed');

    console.log('✓ Community Feed E2E (Post, Like, Comment, Reply) passed.');

    // ---------------------------------------------------------
    // 7. Jobs & Placement E2E (Post Job, Bookmark, Apply)
    // ---------------------------------------------------------
    console.log('\n[7] Testing Jobs & Placement E2E...');
    const newJob = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${almToken}` },
      body: JSON.stringify({
        title: 'Backend Software Engineer (Node.js)',
        company: 'Google',
        location: 'Bengaluru, India',
        type: 'Full-time',
        experienceLevel: 'Entry-level',
        salary: '₹18 - ₹24 LPA',
        description: 'Building high-throughput microservices using Node.js, Express, and PostgreSQL.',
        skillsRequired: ['Node.js', 'Express', 'PostgreSQL'],
      }),
    });
    if (!newJob.ok) throw new Error('Job creation failed');
    const jobId = newJob.data.data.job.id;

    // Bookmark Job by Student
    const bookmarkRes = await request(`/jobs/${jobId}/bookmark`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    if (!bookmarkRes.ok) throw new Error('Job bookmark failed');

    // Apply for Job by Student
    const applyRes = await request(`/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${stuToken}` },
      body: JSON.stringify({
        note: 'Interested in backend systems development',
        resumeUrl: 'https://example.com/resume.pdf',
      }),
    });
    if (!applyRes.ok) throw new Error('Job application failed');

    // Verify DB Application
    const jobAppPg = await db.query('SELECT * FROM job_applications WHERE job_id = $1 AND applicant_id = $2', [jobId, stuUser.id]);
    if (jobAppPg.rows.length === 0) throw new Error('Job application PostgreSQL row missing');
    console.log('✓ Jobs & Placement E2E (Post Job, Bookmark, Apply, DB row) passed.');

    // ---------------------------------------------------------
    // 8. Messaging / Private Chat E2E
    // ---------------------------------------------------------
    console.log('\n[8] Testing Messaging / Private Chat E2E...');
    const convRes = await request('/conversations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stuToken}` },
      body: JSON.stringify({ targetUserId: almUser.id }),
    });
    if (!convRes.ok) throw new Error('Create conversation failed');
    const convId = convRes.data.data.conversation.id;

    // Send Message
    const msgRes = await request(`/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${stuToken}` },
      body: JSON.stringify({ text: 'Hello Alumni Master! Can we schedule a mentorship session?' }),
    });
    if (!msgRes.ok) throw new Error('Send message failed');

    // Verify DB Message
    const msgPg = await db.query('SELECT * FROM messages WHERE conversation_id = $1', [convId]);
    if (msgPg.rows.length === 0) throw new Error('Message PostgreSQL row missing');
    console.log('✓ Messaging E2E (Conversation, Message, DB persistence) passed.');

    // ---------------------------------------------------------
    // 9. In-App Notifications E2E
    // ---------------------------------------------------------
    console.log('\n[9] Testing In-App Notifications E2E...');
    const notifRes = await request('/notifications', {
      headers: { Authorization: `Bearer ${almToken}` },
    });
    if (!notifRes.ok || notifRes.data.data.notifications.length === 0) {
      throw new Error('Notifications list failed or empty');
    }

    const unreadRes = await request('/notifications/unread-count', {
      headers: { Authorization: `Bearer ${almToken}` },
    });
    if (!unreadRes.ok || unreadRes.data.data.unreadCount === 0) {
      throw new Error('Unread notifications count invalid');
    }
    console.log('✓ In-App Notifications E2E passed.');

    // ---------------------------------------------------------
    // 10. Events & Event Registration E2E
    // ---------------------------------------------------------
    console.log('\n[10] Testing Events & Registration E2E...');
    const newEvent = await request('/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${almToken}` },
      body: JSON.stringify({
        title: 'Master Campus Placement Hackathon',
        description: 'Annual coding competition for JECRC students.',
        eventType: 'Hackathon',
        category: 'Technology',
        startAt: new Date(Date.now() + 864000000).toISOString(),
        location: 'Main Auditorium, JECRC Campus',
        capacity: 100,
      }),
    });
    if (!newEvent.ok) throw new Error('Event creation failed');
    const eventId = newEvent.data.data.event.id;

    // Register Student for Event
    const regEvent = await request(`/events/${eventId}/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    if (!regEvent.ok) throw new Error('Event registration failed');

    // Verify DB Registration
    const regPg = await db.query('SELECT * FROM event_registrations WHERE event_id = $1 AND user_id = $2', [eventId, stuUser.id]);
    if (regPg.rows.length === 0) throw new Error('Event registration PostgreSQL row missing');
    console.log('✓ Events & Registration E2E passed.');

    // ---------------------------------------------------------
    // 11. Mentorship System E2E
    // ---------------------------------------------------------
    console.log('\n[11] Testing Mentorship System E2E...');
    const mntReq = await request('/mentorship/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stuToken}` },
      body: JSON.stringify({
        mentorId: almUser.id,
        topic: 'System Design & Code Review',
        message: 'Requesting 1-on-1 guidance for campus placements',
      }),
    });
    if (!mntReq.ok) throw new Error(`Mentorship request failed: ${JSON.stringify(mntReq.data)}`);
    const requestId = mntReq.data.data.request.id;

    // Accept Mentorship Request by Alumni
    const acceptMnt = await request(`/mentorship/requests/${requestId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${almToken}` },
      body: JSON.stringify({ status: 'ACCEPTED' }),
    });
    if (!acceptMnt.ok) throw new Error('Accept mentorship request failed');

    // Verify DB Mentorship Request Status
    const mntPg = await db.query('SELECT status FROM mentorship_requests WHERE id = $1', [requestId]);
    if (mntPg.rows[0].status !== 'ACCEPTED') throw new Error('Mentorship request DB status is not ACCEPTED');
    console.log('✓ Mentorship System E2E passed.');

    // ---------------------------------------------------------
    // 12. Security & Authorization Guards
    // ---------------------------------------------------------
    console.log('\n[12] Testing Security & Authorization Guards...');

    // Security Guard 1: Student cannot create a job posting
    const invalidJob = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stuToken}` },
      body: JSON.stringify({ title: 'Student Job', company: 'Fake' }),
    });
    if (invalidJob.status !== 403) throw new Error('Security Guard Failed: Student was able to create job posting');

    // Security Guard 2: Alumni cannot request mentorship
    const invalidMnt = await request('/mentorship/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${almToken}` },
      body: JSON.stringify({ mentorId: stuUser.id, topic: 'Test', message: 'Test' }),
    });
    if (invalidMnt.status !== 403) throw new Error('Security Guard Failed: Alumni was able to request mentorship');

    // Security Guard 3: Self-Mentorship Guard
    const selfMnt = await request('/mentorship/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stuToken}` },
      body: JSON.stringify({ mentorId: stuUser.id, topic: 'Self', message: 'Self' }),
    });
    if (selfMnt.status !== 400) throw new Error('Security Guard Failed: Self-mentorship was not blocked with 400');

    // Security Guard 4: Self-Connection Guard
    const selfConn = await request('/connections/request', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stuToken}` },
      body: JSON.stringify({ targetUserId: stuUser.id }),
    });
    if (selfConn.status !== 400) throw new Error('Security Guard Failed: Self-connection was not blocked with 400');

    console.log('✓ Security & Authorization Guards passed.');

    console.log('\n===========================================================');
    console.log('🎉 ALL PHASE 12 MASTER END-TO-END REGRESSION TESTS PASSED (100%)');
    console.log('===========================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ MASTER REGRESSION TEST FAILED:', err.message);
    process.exit(1);
  }
}

runMasterRegression();
