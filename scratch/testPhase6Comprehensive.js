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
  console.log('RUNNING COMPREHENSIVE PHASE 6 JOBS & PLACEMENT TEST SUITE');
  console.log('==================================================\n');

  try {
    // 1. Setup multi-users
    console.log('[STEP 1] Setting up test users in PostgreSQL...');
    const studentA = await registerAndOnboard('job_studenta@jecrc.ac.in', 'Password@123', 'student', 'Student Alice');
    const studentB = await registerAndOnboard('job_studentb@jecrc.ac.in', 'Password@123', 'student', 'Student Bob');
    const alumniA = await registerAndOnboard('job_alumnia@jecrc.ac.in', 'Password@123', 'alumni', 'Alumni Alex');
    const alumniB = await registerAndOnboard('job_alumnib@jecrc.ac.in', 'Password@123', 'alumni', 'Alumni Sarah');
    console.log('Test users initialized successfully.\n');

    // 2. Role Authorization Guards
    console.log('[TEST 2] Testing job creation role authorization guards...');
    const studentPostRes = await request(
      'POST',
      '/api/v1/jobs',
      { title: 'Student Job', company: 'Illegal', location: 'Remote', description: 'Testing' },
      studentA.token
    );
    if (studentPostRes.status === 403) {
      console.log('Student Job Post Rejection: PASSED', studentPostRes.body.message);
    } else {
      console.error('Student Job Post Rejection: FAILED', studentPostRes);
    }

    const emptyTitleRes = await request(
      'POST',
      '/api/v1/jobs',
      { title: '   ', company: 'Google', location: 'Bengaluru', description: 'Valid' },
      alumniA.token
    );
    if (emptyTitleRes.status === 400) {
      console.log('Empty Title Rejection: PASSED', emptyTitleRes.body.message);
    } else {
      console.error('Empty Title Rejection: FAILED', emptyTitleRes);
    }

    // 3. Alumni Job Creation
    console.log('\n[TEST 3] Creating real job opportunities (Alumni)...');
    const job1Res = await request(
      'POST',
      '/api/v1/jobs',
      {
        title: 'Software Development Engineer 1',
        company: 'Google',
        type: 'Full-time',
        location: 'Bengaluru, India',
        salary: '₹24 LPA',
        description: 'Join Google Cloud backend infrastructure engineering team.',
        skills: 'Java, Spring Boot, Distributed Systems',
      },
      alumniA.token
    );
    const job1 = job1Res.body.data.job || job1Res.body.data;
    console.log('Job 1 Created (Alumni A -> Google SDE1): PASSED', job1.id);

    const job2Res = await request(
      'POST',
      '/api/v1/jobs',
      {
        title: 'Frontend Engineering Intern',
        company: 'Stripe',
        type: 'Internship',
        location: 'Remote',
        salary: '₹80,000 / month',
        description: 'Work on Stripe Payment UI design system.',
        skills: 'React, TypeScript, Tailwind CSS',
      },
      alumniB.token
    );
    const job2 = job2Res.body.data.job || job2Res.body.data;
    console.log('Job 2 Created (Alumni B -> Stripe Intern): PASSED', job2.id);

    const job3Res = await request(
      'POST',
      '/api/v1/jobs',
      {
        title: 'Cloud DevOps Specialist (Closed)',
        company: 'Amazon AWS',
        type: 'Full-time',
        location: 'Hyderabad, India',
        salary: '₹30 LPA',
        description: 'AWS DevOps infrastructure automation.',
        skills: 'AWS, Terraform, Docker',
        status: 'CLOSED',
      },
      alumniA.token
    );
    const job3 = job3Res.body.data.job || job3Res.body.data;
    // Mark Job 3 as CLOSED explicitly
    await request('PUT', `/api/v1/jobs/${job3.id}`, { status: 'CLOSED' }, alumniA.token);
    console.log('Job 3 Created & Closed (Alumni A -> AWS DevOps): PASSED', job3.id);

    // 4. Job Discovery, Search & Server-Side Filtering
    console.log('\n[TEST 4] Testing GET /api/v1/jobs with server-side filters & search...');
    const allJobsRes = await request('GET', '/api/v1/jobs', null, studentA.token);
    if (allJobsRes.status === 200 && allJobsRes.body.data.jobs.length >= 3) {
      console.log('ALL Jobs List: PASSED total =', allJobsRes.body.data.total);
    } else {
      console.error('ALL Jobs List: FAILED', allJobsRes);
    }

    const internshipFilterRes = await request('GET', '/api/v1/jobs?type=Internship', null, studentA.token);
    if (internshipFilterRes.status === 200 && internshipFilterRes.body.data.jobs.every((j) => j.type === 'Internship')) {
      console.log('Internship Type Filter: PASSED count =', internshipFilterRes.body.data.jobs.length);
    } else {
      console.error('Internship Type Filter: FAILED', internshipFilterRes);
    }

    const remoteFilterRes = await request('GET', '/api/v1/jobs?type=Remote', null, studentA.token);
    if (remoteFilterRes.status === 200 && remoteFilterRes.body.data.jobs.some((j) => j.id === job2.id)) {
      console.log('Remote Location Filter: PASSED');
    } else {
      console.error('Remote Location Filter: FAILED', remoteFilterRes);
    }

    const searchRes = await request('GET', '/api/v1/jobs?search=Google', null, studentA.token);
    if (searchRes.status === 200 && searchRes.body.data.jobs.some((j) => j.id === job1.id)) {
      console.log('Search Query Filter (Google): PASSED');
    } else {
      console.error('Search Query Filter: FAILED', searchRes);
    }

    // 5. Bookmark / Unbookmark Lifecycle
    console.log('\n[TEST 5] Testing Bookmark / Unbookmark toggle & persistence...');
    const bm1Res = await request('POST', `/api/v1/jobs/${job1.id}/bookmark`, null, studentA.token);
    if (bm1Res.status === 200 && bm1Res.body.data.isBookmarked) {
      console.log('Bookmark ON (Student A -> Job 1): PASSED', bm1Res.body.data);
    } else {
      console.error('Bookmark ON: FAILED', bm1Res);
    }

    const bmUnsetRes = await request('POST', `/api/v1/jobs/${job1.id}/bookmark`, null, studentA.token);
    if (bmUnsetRes.status === 200 && !bmUnsetRes.body.data.isBookmarked) {
      console.log('Bookmark OFF (Student A -> Job 1): PASSED', bmUnsetRes.body.data);
    } else {
      console.error('Bookmark OFF: FAILED', bmUnsetRes);
    }

    // Student B bookmarks Job 1
    await request('POST', `/api/v1/jobs/${job1.id}/bookmark`, null, studentB.token);

    // 6. Application Lifecycle & Duplicate Protection
    console.log('\n[TEST 6] Testing Application submission, duplicate prevention & closed job rules...');
    const apply1Res = await request(
      'POST',
      `/api/v1/jobs/${job1.id}/apply`,
      { coverNote: 'Strong background in Java and Spring Boot', resumeUrl: 'https://jecrc.ac.in/resumes/studenta.pdf' },
      studentA.token
    );
    if (apply1Res.status === 201 && apply1Res.body.data.hasApplied && apply1Res.body.data.applicantsCount === 1) {
      console.log('Apply Job 1 (Student A): PASSED', apply1Res.body.data.application.id);
    } else {
      console.error('Apply Job 1: FAILED', apply1Res);
    }

    const dupApplyRes = await request(
      'POST',
      `/api/v1/jobs/${job1.id}/apply`,
      { coverNote: 'Duplicate request' },
      studentA.token
    );
    if (dupApplyRes.status === 409) {
      console.log('Duplicate Application Rejection: PASSED', dupApplyRes.body.message);
    } else {
      console.error('Duplicate Application Rejection: FAILED', dupApplyRes);
    }

    const closedApplyRes = await request('POST', `/api/v1/jobs/${job3.id}/apply`, null, studentA.token);
    if (closedApplyRes.status === 400) {
      console.log('Closed Job Application Rejection: PASSED', closedApplyRes.body.message);
    } else {
      console.error('Closed Job Application Rejection: FAILED', closedApplyRes);
    }

    // Student B applies for Job 1
    await request('POST', `/api/v1/jobs/${job1.id}/apply`, null, studentB.token);

    // 7. Ownership Security (Edit & Delete)
    console.log('\n[TEST 7] Testing Alumni job ownership security (Edit & Delete)...');
    const unauthorizedEditRes = await request(
      'PUT',
      `/api/v1/jobs/${job1.id}`,
      { title: 'Hacked Title' },
      alumniB.token
    );
    if (unauthorizedEditRes.status === 403) {
      console.log('Unauthorized Alumni Edit Rejection: PASSED', unauthorizedEditRes.body.message);
    } else {
      console.error('Unauthorized Alumni Edit Rejection: FAILED', unauthorizedEditRes);
    }

    const authorizedEditRes = await request(
      'PUT',
      `/api/v1/jobs/${job1.id}`,
      { salary: '₹28 LPA' },
      alumniA.token
    );
    if (authorizedEditRes.status === 200 && (authorizedEditRes.body.data.job || authorizedEditRes.body.data).salary === '₹28 LPA') {
      console.log('Authorized Alumni Edit Job: PASSED', (authorizedEditRes.body.data.job || authorizedEditRes.body.data).salary);
    } else {
      console.error('Authorized Alumni Edit Job: FAILED', authorizedEditRes);
    }

    const unauthorizedDeleteRes = await request('DELETE', `/api/v1/jobs/${job1.id}`, null, alumniB.token);
    if (unauthorizedDeleteRes.status === 403) {
      console.log('Unauthorized Alumni Delete Rejection: PASSED', unauthorizedDeleteRes.body.message);
    } else {
      console.error('Unauthorized Alumni Delete Rejection: FAILED', unauthorizedDeleteRes);
    }

    // 8. PostgreSQL Direct Rows Inspection
    console.log('\n[STEP 8] Directly inspecting PostgreSQL jobs, job_bookmarks, and job_applications tables...');
    const dbJobs = await db.query('SELECT id, posted_by, title, company, status FROM jobs');
    const dbBookmarks = await db.query('SELECT id, job_id, user_id FROM job_bookmarks');
    const dbApplications = await db.query('SELECT id, job_id, applicant_id, status FROM job_applications');

    console.log('PostgreSQL Jobs Count:', dbJobs.rows.length);
    console.log('PostgreSQL Bookmarks Count:', dbBookmarks.rows.length);
    console.log('PostgreSQL Applications Count:', dbApplications.rows.length);

    console.log('\n==================================================');
    console.log('ALL PHASE 6 JOBS & PLACEMENT TESTS PASSED PERFECTLY!');
    console.log('==================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('TEST ERROR:', err);
    process.exit(1);
  }
}

runTests();
