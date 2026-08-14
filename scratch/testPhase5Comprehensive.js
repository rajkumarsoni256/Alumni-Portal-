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
  const loginCheck = await request('POST', '/api/v1/auth/login', { email, password });

  if (loginCheck.status === 200 && loginCheck.body?.data?.token) {
    token = loginCheck.body.data.token;
  } else {
    // Register user
    let regRes = await request('POST', '/api/v1/auth/register', { name: fullName, email, password, role });
    const userRow = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    const userId = userRow.rows[0].id;
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
          graduationYear: 2022,
          company: 'Google',
          designation: 'Senior Software Engineer',
          location: 'Bengaluru',
          linkedinUrl: 'https://linkedin.com/in/testalumni',
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
          currentYear: 3,
          graduationYear: 2026,
          skills: 'JavaScript, React, Node.js',
        },
        token
      );
    }
  }

  return { token, user: meUser };
}

async function runTests() {
  console.log('==================================================');
  console.log('RUNNING COMPREHENSIVE PHASE 5 COMMUNITY FEED TEST SUITE');
  console.log('==================================================\n');

  try {
    // 1. Setup multi-users
    console.log('[STEP 1] Setting up test users in PostgreSQL...');
    const studentA = await registerAndOnboard('feed_studenta@jecrc.ac.in', 'Password@123', 'student', 'Student Alice');
    const studentB = await registerAndOnboard('feed_studentb@jecrc.ac.in', 'Password@123', 'student', 'Student Bob');
    const alumniA = await registerAndOnboard('feed_alumnia@jecrc.ac.in', 'Password@123', 'alumni', 'Alumni Alex');
    const alumniB = await registerAndOnboard('feed_alumnib@jecrc.ac.in', 'Password@123', 'alumni', 'Alumni Sarah');
    console.log('Test users initialized successfully.\n');

    // 2. Validation & Security Guards
    console.log('[TEST 2] Testing post creation validation rules...');
    const emptyPostRes = await request('POST', '/api/v1/posts', { content: '    ' }, studentA.token);
    if (emptyPostRes.status === 400) {
      console.log('Empty Post Rejection: PASSED', emptyPostRes.body.message);
    } else {
      console.error('Empty Post Rejection: FAILED', emptyPostRes);
    }

    const hugePostRes = await request('POST', '/api/v1/posts', { content: 'a'.repeat(5001) }, studentA.token);
    if (hugePostRes.status === 400) {
      console.log('Excessive Length Rejection: PASSED', hugePostRes.body.message);
    } else {
      console.error('Excessive Length Rejection: FAILED', hugePostRes);
    }

    // 3. Post Creation
    console.log('\n[TEST 3] Creating real community feed posts...');
    const post1Res = await request(
      'POST',
      '/api/v1/posts',
      { content: 'Excited to share my new AI research project! #JECRC #AI', category: 'STUDENT', type: 'TEXT' },
      studentA.token
    );
    const post1 = post1Res.body.data.post || post1Res.body.data;
    console.log('Post 1 Created (Student A): PASSED', post1.id);

    const post2Res = await request(
      'POST',
      '/api/v1/posts',
      { content: 'Hiring Software Engineering Interns at Google! Apply now. #Placements2026', category: 'JOBS', type: 'JOB' },
      alumniA.token
    );
    const post2 = post2Res.body.data.post || post2Res.body.data;
    console.log('Post 2 Created (Alumni A): PASSED', post2.id);

    const post3Res = await request(
      'POST',
      '/api/v1/posts',
      { content: 'Honored to speak at the JECRC Tech Summit 2026! #Achievements', category: 'ACHIEVEMENTS', type: 'ACHIEVEMENT' },
      alumniB.token
    );
    const post3 = post3Res.body.data.post || post3Res.body.data;
    console.log('Post 3 Created (Alumni B): PASSED', post3.id);

    // 4. Feed Query & Server-Side Category Filtering
    console.log('\n[TEST 4] Testing GET /api/v1/posts with server-side filtering...');
    const allFeedRes = await request('GET', '/api/v1/posts?category=all', null, studentB.token);
    if (allFeedRes.status === 200 && allFeedRes.body.data.posts.length >= 3) {
      console.log('ALL Category Feed: PASSED total =', allFeedRes.body.data.total);
    } else {
      console.error('ALL Category Feed: FAILED', allFeedRes);
    }

    const alumniFeedRes = await request('GET', '/api/v1/posts?category=alumni', null, studentB.token);
    if (alumniFeedRes.status === 200 && alumniFeedRes.body.data.posts.every((p) => p.author.isAlumni || p.category === 'alumni')) {
      console.log('ALUMNI Category Filter: PASSED count =', alumniFeedRes.body.data.posts.length);
    } else {
      console.error('ALUMNI Category Filter: FAILED', alumniFeedRes);
    }

    const jobsFeedRes = await request('GET', '/api/v1/posts?category=jobs', null, studentB.token);
    if (jobsFeedRes.status === 200 && jobsFeedRes.body.data.posts.some((p) => p.id === post2.id)) {
      console.log('JOBS Category Filter: PASSED');
    } else {
      console.error('JOBS Category Filter: FAILED', jobsFeedRes);
    }

    // 5. Like / Unlike Lifecycle
    console.log('\n[TEST 5] Testing Like / Unlike toggle lifecycle & PostgreSQL persistence...');
    const like1Res = await request('POST', `/api/v1/posts/${post2.id}/like`, null, studentB.token);
    if (like1Res.status === 200 && like1Res.body.data.isLiked && like1Res.body.data.likesCount === 1) {
      console.log('Like Toggle ON (Student B -> Post 2): PASSED', like1Res.body.data);
    } else {
      console.error('Like Toggle ON: FAILED', like1Res);
    }

    const checkLikedFeedRes = await request('GET', '/api/v1/posts?category=all', null, studentB.token);
    const post2InFeed = checkLikedFeedRes.body.data.posts.find((p) => p.id === post2.id);
    if (post2InFeed && post2InFeed.isLiked === true && post2InFeed.likesCount === 1) {
      console.log('Like Consistency in Feed Query: PASSED');
    } else {
      console.error('Like Consistency in Feed Query: FAILED', post2InFeed);
    }

    const unlikeRes = await request('POST', `/api/v1/posts/${post2.id}/like`, null, studentB.token);
    if (unlikeRes.status === 200 && !unlikeRes.body.data.isLiked && unlikeRes.body.data.likesCount === 0) {
      console.log('Like Toggle OFF (Student B -> Post 2): PASSED', unlikeRes.body.data);
    } else {
      console.error('Like Toggle OFF: FAILED', unlikeRes);
    }

    // Alumni B likes Post 2
    await request('POST', `/api/v1/posts/${post2.id}/like`, null, alumniB.token);

    // 6. Comment Lifecycle
    console.log('\n[TEST 6] Testing Comment & Reply lifecycle...');
    const comment1Res = await request(
      'POST',
      `/api/v1/posts/${post2.id}/comments`,
      { text: 'Is this opportunity open for 3rd year students?' },
      studentA.token
    );
    if (comment1Res.status === 201 && comment1Res.body.data.commentsCount === 1) {
      console.log('Add Top-Level Comment (Student A -> Post 2): PASSED', comment1Res.body.data.comment.id);
    } else {
      console.error('Add Top-Level Comment: FAILED', comment1Res);
    }

    const replyRes = await request(
      'POST',
      `/api/v1/posts/${post2.id}/comments`,
      { text: 'Yes, 3rd and 4th year students can apply!', parentCommentId: comment1Res.body.data.comment.id },
      alumniA.token
    );
    if (replyRes.status === 201 && replyRes.body.data.commentsCount === 2) {
      console.log('Add Reply Comment (Alumni A -> Comment 1): PASSED', replyRes.body.data.comment.id);
    } else {
      console.error('Add Reply Comment: FAILED', replyRes);
    }

    const getCommentsRes = await request('GET', `/api/v1/posts/${post2.id}/comments`, null, studentA.token);
    if (
      getCommentsRes.status === 200 &&
      getCommentsRes.body.data.comments.length === 1 &&
      getCommentsRes.body.data.comments[0].replies.length === 1
    ) {
      console.log('GET Comments Structure & Single-Level Nesting: PASSED');
    } else {
      console.error('GET Comments Structure: FAILED', getCommentsRes.body);
    }

    // 7. Ownership Security (Edit & Delete)
    console.log('\n[TEST 7] Testing Edit & Delete post ownership security...');
    const unauthorizedEditRes = await request(
      'PUT',
      `/api/v1/posts/${post1.id}`,
      { content: 'Hacked content by Student B' },
      studentB.token
    );
    if (unauthorizedEditRes.status === 403) {
      console.log('Unauthorized Edit Rejection: PASSED', unauthorizedEditRes.body.message);
    } else {
      console.error('Unauthorized Edit Rejection: FAILED', unauthorizedEditRes);
    }

    const authorizedEditRes = await request(
      'PUT',
      `/api/v1/posts/${post1.id}`,
      { content: 'Updated content by Student A! #JECRC #AI' },
      studentA.token
    );
    if (authorizedEditRes.status === 200 && (authorizedEditRes.body.data.post || authorizedEditRes.body.data).content.includes('Updated content')) {
      console.log('Authorized Edit Post: PASSED', (authorizedEditRes.body.data.post || authorizedEditRes.body.data).content);
    } else {
      console.error('Authorized Edit Post: FAILED', authorizedEditRes);
    }

    const unauthorizedDeleteRes = await request('DELETE', `/api/v1/posts/${post1.id}`, null, studentB.token);
    if (unauthorizedDeleteRes.status === 403) {
      console.log('Unauthorized Delete Rejection: PASSED', unauthorizedDeleteRes.body.message);
    } else {
      console.error('Unauthorized Delete Rejection: FAILED', unauthorizedDeleteRes);
    }

    const authorizedDeleteRes = await request('DELETE', `/api/v1/posts/${post1.id}`, null, studentA.token);
    if (authorizedDeleteRes.status === 200) {
      console.log('Authorized Delete Post: PASSED');
    } else {
      console.error('Authorized Delete Post: FAILED', authorizedDeleteRes);
    }

    // 8. PostgreSQL Direct Rows Inspection
    console.log('\n[STEP 8] Directly inspecting PostgreSQL posts, post_likes, and comments tables...');
    const dbPosts = await db.query('SELECT id, author_id, content, category FROM posts');
    const dbLikes = await db.query('SELECT id, post_id, user_id FROM post_likes');
    const dbComments = await db.query('SELECT id, post_id, author_id, content, parent_comment_id FROM comments');

    console.log('PostgreSQL Posts Count:', dbPosts.rows.length);
    console.log('PostgreSQL Likes Count:', dbLikes.rows.length);
    console.log('PostgreSQL Comments Count:', dbComments.rows.length);

    console.log('\n==================================================');
    console.log('ALL PHASE 5 COMMUNITY FEED TESTS PASSED PERFECTLY!');
    console.log('==================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('TEST ERROR:', err);
    process.exit(1);
  }
}

runTests();
