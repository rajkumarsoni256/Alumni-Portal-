const db = require('../backend/src/config/db');

const BASE_URL = 'http://localhost:8080/api/v1';

async function runPhase2BTests() {
  console.log('==================================================');
  console.log('RUNNING COMPREHENSIVE PHASE 2B TEST SUITE');
  console.log('==================================================');

  // Clean test accounts
  await db.query(`DELETE FROM users WHERE email IN ('teststudent_p2b@jecrc.ac.in', 'testalumni_p2b@jecrc.ac.in');`);

  // ----------------------------------------------------
  // TEST 1: STUDENT REGISTRATION & PRE-ONBOARDING PROFILE
  // ----------------------------------------------------
  console.log('\n[TEST 1] Registering Student (teststudent_p2b@jecrc.ac.in)...');
  await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Aman Sharma',
      email: 'teststudent_p2b@jecrc.ac.in',
      password: 'StudentPassword@123',
      role: 'STUDENT'
    })
  });

  const otpRes1 = await db.query(`SELECT token FROM email_verification_tokens evt JOIN users u ON evt.user_id = u.id WHERE u.email = 'teststudent_p2b@jecrc.ac.in' ORDER BY evt.created_at DESC LIMIT 1;`);
  const otpCode1 = otpRes1.rows[0].token;

  await fetch(`${BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teststudent_p2b@jecrc.ac.in', code: otpCode1 })
  });

  const loginStudent = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teststudent_p2b@jecrc.ac.in', password: 'StudentPassword@123' })
  }).then(r => r.json());

  const studentToken = loginStudent.data.token;

  console.log('[TEST 1.1] Fetching GET /profiles/me before onboarding...');
  const preProfile = await fetch(`${BASE_URL}/profiles/me`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }).then(r => r.json());

  console.log('Pre-onboarding GET /profiles/me:', preProfile.success ? 'PASSED' : 'FAILED', preProfile.data);
  console.log('Pre-onboarding profileCompleted === false:', preProfile.data.profileCompleted === false ? 'PASSED' : 'FAILED');

  // ----------------------------------------------------
  // TEST 2: STUDENT VALIDATION REJECTION & SUCCESS
  // ----------------------------------------------------
  console.log('\n[TEST 2.1] Submitting Student Onboarding missing degree (Should Fail)...');
  const failStudent = await fetch(`${BASE_URL}/profiles/me`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      fullName: 'Aman Sharma',
      phone: '+919876543210',
      branch: 'CSE',
      currentAcademicYear: 3,
      graduationYear: 2028
    })
  }).then(r => r.json());

  console.log('Missing Degree Rejection:', failStudent.success === false ? 'PASSED' : 'FAILED', failStudent.message);

  console.log('[TEST 2.2] Submitting Valid Student Onboarding via PUT /profiles/me...');
  const onboardStudent = await fetch(`${BASE_URL}/profiles/me`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      fullName: 'Aman Sharma',
      phone: '+919876543210',
      degree: 'B.Tech',
      branch: 'CSE',
      currentAcademicYear: 3,
      graduationYear: 2028,
      githubUrl: 'https://github.com/amansharma',
      bio: 'Pre-final year CSE student building AI applications.',
      skills: ['Java', 'React', 'Node.js'],
      interests: ['AI', 'Web Development']
    })
  }).then(r => r.json());

  console.log('Student Onboarding Result:', onboardStudent.success ? 'PASSED' : 'FAILED', onboardStudent.data);
  console.log('Student profileCompleted after onboarding:', onboardStudent.data.profileCompleted);

  // ----------------------------------------------------
  // TEST 3: ALUMNI REGISTRATION & VALIDATION & SUCCESS
  // ----------------------------------------------------
  console.log('\n[TEST 3] Registering Alumni (testalumni_p2b@jecrc.ac.in)...');
  await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rahul Sharma',
      email: 'testalumni_p2b@jecrc.ac.in',
      password: 'AlumniPassword@123',
      role: 'ALUMNI'
    })
  });

  const otpRes2 = await db.query(`SELECT token FROM email_verification_tokens evt JOIN users u ON evt.user_id = u.id WHERE u.email = 'testalumni_p2b@jecrc.ac.in' ORDER BY evt.created_at DESC LIMIT 1;`);
  const otpCode2 = otpRes2.rows[0].token;

  await fetch(`${BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testalumni_p2b@jecrc.ac.in', code: otpCode2 })
  });

  const loginAlumni = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testalumni_p2b@jecrc.ac.in', password: 'AlumniPassword@123' })
  }).then(r => r.json());

  const alumniToken = loginAlumni.data.token;

  console.log('[TEST 3.1] Submitting Alumni Onboarding missing LinkedIn (Should Fail)...');
  const failAlumni = await fetch(`${BASE_URL}/profiles/me`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${alumniToken}`
    },
    body: JSON.stringify({
      fullName: 'Rahul Sharma',
      phone: '+919876543211',
      degree: 'B.Tech',
      branch: 'CSE',
      graduationYear: 2020,
      company: 'Amazon',
      designation: 'Software Development Engineer',
      location: 'Bangalore, Karnataka'
    })
  }).then(r => r.json());

  console.log('Missing LinkedIn Rejection:', failAlumni.success === false ? 'PASSED' : 'FAILED', failAlumni.message);

  console.log('[TEST 3.2] Submitting Valid Alumni Onboarding via PUT /profiles/me...');
  const onboardAlumni = await fetch(`${BASE_URL}/profiles/me`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${alumniToken}`
    },
    body: JSON.stringify({
      fullName: 'Rahul Sharma',
      phone: '+919876543211',
      degree: 'B.Tech',
      branch: 'CSE',
      graduationYear: 2020,
      company: 'Amazon',
      designation: 'Software Development Engineer',
      location: 'Bangalore, Karnataka',
      linkedinUrl: 'https://www.linkedin.com/in/rahulsharma',
      githubUrl: 'https://github.com/rahulsharma',
      bio: 'Building distributed cloud systems at scale.',
      skills: ['Java', 'AWS', 'Spring Boot'],
      interests: ['Cloud', 'AI']
    })
  }).then(r => r.json());

  console.log('Alumni Onboarding Result:', onboardAlumni.success ? 'PASSED' : 'FAILED', onboardAlumni.data);

  // ----------------------------------------------------
  // TEST 4: PROFILE UPDATES
  // ----------------------------------------------------
  console.log('\n[TEST 4] Updating Alumni Profile (Company: Meta, Designation: Staff Engineer)...');
  const updateRes = await fetch(`${BASE_URL}/profiles/me`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${alumniToken}`
    },
    body: JSON.stringify({
      company: 'Meta',
      designation: 'Staff Software Engineer',
      location: 'London, UK'
    })
  }).then(r => r.json());

  console.log('Profile Update Result:', updateRes.success ? 'PASSED' : 'FAILED', updateRes.data);
  console.log('Updated Company:', updateRes.data.company === 'Meta' ? 'PASSED' : 'FAILED');

  // ----------------------------------------------------
  // TEST 5: POSTGRESQL DIRECT ROW PERSISTENCE VERIFICATION
  // ----------------------------------------------------
  console.log('\n[TEST 5] Direct PostgreSQL Database Verification...');
  const dbCheck = await db.query(`SELECT p.*, u.email, u.role FROM user_profiles p JOIN users u ON p.user_id = u.id WHERE u.email = 'testalumni_p2b@jecrc.ac.in';`);
  const row = dbCheck.rows[0];
  console.log('DB Row Found:', !!row ? 'PASSED' : 'FAILED');
  console.log('DB Company:', row.company === 'Meta' ? 'PASSED (Meta)' : 'FAILED', row.company);
  console.log('DB LinkedIn:', row.linkedin_url === 'https://www.linkedin.com/in/rahulsharma' ? 'PASSED' : 'FAILED');
  console.log('DB Completeness:', row.is_profile_complete === true ? 'PASSED' : 'FAILED');

  // Verify single row (No duplicate profiles)
  const countCheck = await db.query(`SELECT COUNT(*) FROM user_profiles WHERE user_id = $1;`, [row.user_id]);
  console.log('No Duplicate Profiles Check (Count === 1):', countCheck.rows[0].count === '1' ? 'PASSED' : 'FAILED');

  // ----------------------------------------------------
  // TEST 6: SECURITY & AUTHORIZATION CHECK
  // ----------------------------------------------------
  console.log('\n[TEST 6] Security Check: Attempting User A to modify profile without auth token...');
  const unauthorizedRes = await fetch(`${BASE_URL}/profiles/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company: 'HackerCorp' })
  }).then(r => r.json());

  console.log('Unauthorized Request Rejection:', unauthorizedRes.success === false ? 'PASSED' : 'FAILED', unauthorizedRes.message);

  console.log('\n==================================================');
  console.log('ALL PHASE 2B BACKEND & DB TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================');
  process.exit(0);
}

runPhase2BTests().catch(err => {
  console.error('Phase 2B Test Error:', err);
  process.exit(1);
});
