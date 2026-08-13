async function testAdminLogin() {
  console.log('--- TESTING OFFICIAL ADMIN LOGIN ---');

  const res = await fetch('http://localhost:8080/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@jecrc.ac.in',
      password: 'AdminPassword@123'
    })
  }).then(r => r.json());

  console.log('Admin Login Response:', res);
  if (res.success && res.data?.user?.role === 'ADMIN') {
    console.log('ADMIN LOGIN SUCCESSFUL!', res.data.user);
  } else {
    console.error('ADMIN LOGIN FAILED:', res);
  }
  process.exit(0);
}

testAdminLogin().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
