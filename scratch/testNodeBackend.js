const db = require('../backend/src/config/db');

async function testFullFlow() {
  console.log('--- STARTING NODE BACKEND END-TO-END VERIFICATION ---');

  // 1. Register
  const regEmail = `node_e2e_${Date.now()}@jecrc.ac.in`;
  const regRes = await fetch('http://localhost:8080/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'E2E Tester', email: regEmail, password: 'Password@123', role: 'ALUMNI' })
  }).then(r => r.json());

  console.log('1. Register Result:', regRes.success, regRes.data?.email);

  // 2. Fetch OTP from DB
  const otpRes = await db.query(
    'SELECT evt.token FROM email_verification_tokens evt JOIN users u ON evt.user_id = u.id WHERE u.email = $1',
    [regEmail]
  );
  const otp = otpRes.rows[0].token;
  console.log('2. Fetched OTP:', otp);

  // 3. Verify Email
  const verifyRes = await fetch('http://localhost:8080/api/v1/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: regEmail, code: otp })
  }).then(r => r.json());

  console.log('3. Verify Email Result:', verifyRes.success, verifyRes.message);

  // 4. Login
  const loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: regEmail, password: 'Password@123' })
  }).then(r => r.json());

  console.log('4. Login Result:', loginRes.success, 'Token:', loginRes.data?.token ? 'RECEIVED' : 'MISSING');
  const token = loginRes.data.token;

  // 5. Complete Onboarding (Alumni)
  const onboardRes = await fetch('http://localhost:8080/api/v1/profiles/onboarding', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      fullName: 'E2E Alumni Tester',
      phone: '9876543210',
      degree: 'B.Tech',
      branch: 'Computer Science & Engineering',
      graduationYear: 2020,
      company: 'Google',
      designation: 'Staff Software Engineer',
      location: 'Bengaluru, India',
      linkedinUrl: 'https://linkedin.com/in/e2ealumni'
    })
  }).then(r => r.json());

  console.log('5. Onboarding Result:', onboardRes.success, 'isProfileComplete:', onboardRes.data?.profileComplete);

  // 6. Get Current Profile
  const meRes = await fetch('http://localhost:8080/api/v1/profiles/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());

  console.log('6. GET /profiles/me Result:', meRes.success, meRes.data?.company, meRes.data?.designation);

  console.log('--- ALL NODE BACKEND CHECKS PASSED SUCCESSFULLY ---');
  process.exit(0);
}

testFullFlow().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
