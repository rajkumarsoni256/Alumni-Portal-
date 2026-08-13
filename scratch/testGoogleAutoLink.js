const db = require('../backend/src/config/db');

async function testAutoLink() {
  console.log('--- TESTING GOOGLE AUTO-LINK FOR EXISTING ACCOUNTS ---');

  const testEmail = 'tokirkhan00291@gmail.com';

  const res = await fetch('http://localhost:8080/api/v1/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idToken: `mock-google-token-sub9999:${testEmail}:Tokir Khan`
    })
  }).then(r => r.json());

  console.log('Google Auth Response:', res);
  if (res.success && res.data?.token) {
    console.log('AUTO-LINK SUCCESSFUL! User logged in:', res.data.user);
  } else {
    console.error('AUTO-LINK FAILED:', res);
  }
  process.exit(0);
}

testAutoLink().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
