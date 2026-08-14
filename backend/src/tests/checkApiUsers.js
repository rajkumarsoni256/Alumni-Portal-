const db = require('../config/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

const checkApi = async () => {
  try {
    const adminUser = (await db.query(`SELECT id, email FROM users WHERE role = 'ADMIN' LIMIT 1`)).rows[0];
    const adminToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

    const res = await fetch('http://localhost:8080/api/v1/admin/users?page=1&pageSize=20', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const json = await res.json();
    console.log('--- API RESPONSE (GET /api/v1/admin/users) ---');
    console.log(`Status Code: ${res.status}`);
    console.log(`Total Count in API response: ${json.data.totalCount}`);
    console.log(`Returned Users Count: ${json.data.users.length}\n`);

    console.log('List of users returned by PostgreSQL API:');
    json.data.users.forEach((u, i) => {
      console.log(`${i + 1}. [${u.role}] ${u.name} | ${u.email} | ${u.company || 'No Company'} | ${u.branch || 'No Branch'} | Batch: ${u.batch || 'None'}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkApi();
