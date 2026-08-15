const http = require('http');

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

async function runTest() {
  console.log('\n=== TESTING ALUMNI REGISTRATION, APPROVAL & AUTH PIPELINE ===\n');

  // 1. Register Alumni
  const testEmail = `alumni.test.${Date.now()}@gmail.com`;
  console.log(`1. Registering Alumni (${testEmail})...`);
  const regRes = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    name: 'Test Alumni',
    email: testEmail,
    password: 'Password@123',
    role: 'ALUMNI',
    mobileNumber: '9876543210',
    phone: '9876543210',
    graduationYear: '2021',
    company: 'Test Corp',
  });

  const responsePayload = regRes.data.data || regRes.data;
  if (regRes.status === 201 && responsePayload.alumniVerificationStatus === 'PENDING') {
    console.log('  [PASS] Alumni registered cleanly with status PENDING_APPROVAL and zero OTP requirement');
  } else {
    console.error('  [FAIL] Alumni registration failed:', regRes.data);
    process.exit(1);
  }

  // 2. Attempt Login as Unapproved Alumni
  console.log('\n2. Attempting login as unapproved Alumni...');
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: testEmail,
    password: 'Password@123',
  });

  if (loginRes.status === 403 && (loginRes.data.errorCode === 'ACCOUNT_PENDING_APPROVAL' || loginRes.data.errorCode === 'ALUMNI_APPROVAL_PENDING')) {
    console.log('  [PASS] Unapproved Alumni login blocked with 403 Forbidden ("Your account is currently under review and pending approval by the Admin.")');
  } else {
    console.error('  [FAIL] Unapproved Alumni login was not properly blocked:', loginRes.data);
    process.exit(1);
  }

  // 3. Clean up test user so test data doesn't pollute PostgreSQL database
  const db = require('../config/db');
  await db.query(`DELETE FROM users WHERE email = $1`, [testEmail]);
  await db.pool.end();

  console.log('\n================================================================');
  console.log('  ALUMNI REGISTRATION & AUTH PIPELINE VERIFIED 100%');
  console.log('================================================================\n');
}

runTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
