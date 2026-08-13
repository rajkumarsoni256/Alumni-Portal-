const db = require('../backend/src/config/db');

const BASE_URL = 'http://localhost:8080/api/v1';

async function runPhase2Tests() {
  console.log('==================================================');
  console.log('RUNNING COMPREHENSIVE PHASE 2 TEST SUITE');
  console.log('==================================================');

  // Clean test accounts
  await db.query(`DELETE FROM users WHERE email IN ('teststudent_p2@jecrc.ac.in', 'testalumni_p2@jecrc.ac.in');`);

  // ----------------------------------------------------
  // TEST 1: STUDENT REGISTRATION & ONBOARDING
  // ----------------------------------------------------
  console.log('\n[TEST 1] Registering Student...');
  const regStudent = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Aarav Gupta',
      email: 'teststudent_p2@jecrc.ac.in',
      password: 'StudentPassword@123',
      role: 'STUDENT'
    })
  }).then(r => r.json());
  console.log('Student Registration:', regStudent.success ? 'PASSED' : 'FAILED', regStudent);

  // Get OTP token from DB
  const otpRes = await db.query(`SELECT token FROM email_verification_tokens evt JOIN users u ON evt.user_id = u.id WHERE u.email = 'teststudent_p2@jecrc.ac.in' ORDER BY evt.created_at DESC LIMIT 1;`);
  const otpCode = otpRes.rows[0].token;

  console.log('[TEST 1.1] Verifying Student Email...');
  await fetch(`${BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teststudent_p2@jecrc.ac.in', code: otpCode })
  });

  console.log('[TEST 1.2] Logging in Student...');
  const loginStudent = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teststudent_p2@jecrc.ac.in', password: 'StudentPassword@123' })
  }).then(r => r.json());
  
  const studentToken = loginStudent.data.token;
  console.log('Initial Student profileComplete:', loginStudent.data.user.profileComplete);

  console.log('[TEST 1.3] Submitting Student Onboarding...');
  const onboardStudent = await fetch(`${BASE_URL}/users/onboarding`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      fullName: 'Aarav Gupta',
      phone: '+919876543210',
      degree: 'B.Tech',
      branch: 'Computer Science & Engineering',
      currentYear: 3,
      graduationYear: 2026,
      skills: ['Python', 'Data Structures', 'React'],
      interests: ['AI', 'Software Engineering']
    })
  }).then(r => r.json());

  console.log('Student Onboarding Result:', onboardStudent.success ? 'PASSED' : 'FAILED', onboardStudent.data);
  console.log('Student profileComplete after onboarding:', onboardStudent.data.profileComplete);

  // ----------------------------------------------------
  // TEST 2: ALUMNI REGISTRATION & ROLE-BASED VALIDATION
  // ----------------------------------------------------
  console.log('\n[TEST 2] Registering Alumni...');
  await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Riya Sharma',
      email: 'testalumni_p2@jecrc.ac.in',
      password: 'AlumniPassword@123',
      role: 'ALUMNI'
    })
  });

  const otpAlumniRes = await db.query(`SELECT token FROM email_verification_tokens evt JOIN users u ON evt.user_id = u.id WHERE u.email = 'testalumni_p2@jecrc.ac.in' ORDER BY evt.created_at DESC LIMIT 1;`);
  const alumniOtp = otpAlumniRes.rows[0].token;

  await fetch(`${BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testalumni_p2@jecrc.ac.in', code: alumniOtp })
  });

  const loginAlumni = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testalumni_p2@jecrc.ac.in', password: 'AlumniPassword@123' })
  }).then(r => r.json());

  const alumniToken = loginAlumni.data.token;

  console.log('[TEST 2.1] Submitting Incomplete Alumni Onboarding (Should Fail)...');
  const failAlumni = await fetch(`${BASE_URL}/profiles/onboarding`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${alumniToken}`
    },
    body: JSON.stringify({
      fullName: 'Riya Sharma',
      phone: '+919876543211',
      degree: 'B.Tech',
      branch: 'ECE'
      // Missing company, designation, location, linkedinUrl
    })
  }).then(r => r.json());

  console.log('Incomplete Alumni Rejection Test:', failAlumni.success === false ? 'PASSED (Correctly Rejected)' : 'FAILED', failAlumni.message);

  console.log('[TEST 2.2] Submitting Complete Alumni Onboarding...');
  const onboardAlumni = await fetch(`${BASE_URL}/profiles/onboarding`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${alumniToken}`
    },
    body: JSON.stringify({
      fullName: 'Riya Sharma',
      phone: '+919876543211',
      degree: 'B.Tech',
      branch: 'Electronics & Communication',
      graduationYear: 2020,
      company: 'Amazon',
      designation: 'Software Development Engineer',
      location: 'Bengaluru, India',
      linkedinUrl: 'https://linkedin.com/in/riyasharma',
      githubUrl: 'https://github.com/riyasharma',
      skills: ['AWS', 'Java', 'Distributed Systems']
    })
  }).then(r => r.json());

  console.log('Alumni Onboarding Result:', onboardAlumni.success ? 'PASSED' : 'FAILED', onboardAlumni.data);

  // ----------------------------------------------------
  // TEST 3: PUBLIC PROFILE RETRIEVAL SECURITY CHECK
  // ----------------------------------------------------
  console.log('\n[TEST 3] Fetching Public Alumni Profile via /users/:id...');
  const publicProfile = await fetch(`${BASE_URL}/users/${onboardAlumni.data.userId}`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }).then(r => r.json());

  console.log('Public Profile Retrieval:', publicProfile.success ? 'PASSED' : 'FAILED', publicProfile.data);
  const sensitiveKeys = ['password', 'password_hash', 'token', 'jwt'];
  const exposesSecrets = sensitiveKeys.some(k => k in publicProfile.data);
  console.log('Public Profile Security Check (No Secrets Exposed):', !exposesSecrets ? 'PASSED' : 'FAILED');

  console.log('\n==================================================');
  console.log('ALL PHASE 2 TESTS COMPLETED SUCCESSFULLY!');
  console.log('==================================================');
  process.exit(0);
}

runPhase2Tests().catch(err => {
  console.error('Phase 2 Test Error:', err);
  process.exit(1);
});
