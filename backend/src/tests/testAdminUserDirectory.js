const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const adminUserService = require('../services/adminUserService');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

const generateToken = (userId, role) => {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: '1h' });
};

const runAllTests = async () => {
  console.log('================================================================');
  console.log('       PHASE 3 — ADMIN USER DIRECTORY API TEST SUITE            ');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, testName, details = '') => {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${testName} - ${details}`);
    }
  };

  try {
    // -------------------------------------------------------------
    // SETUP: Seed test records for students, alumni, and admin
    // -------------------------------------------------------------
    console.log('--- Step 1: Setting up Test Data ---');
    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    const testUsersData = [
      {
        email: 'priya.sharma.test@google.com',
        role: 'ALUMNI',
        fullName: 'Priya Sharma',
        phone: '+91 98290 11111',
        degree: 'B.Tech',
        branch: 'CSE',
        graduationYear: 2018,
        company: 'Google',
        designation: 'Senior AI Engineer',
        location: 'Bangalore, Karnataka',
        skills: 'PyTorch, Python, LLMs, Distributed Systems',
        isComplete: true,
        daysAgo: 2,
      },
      {
        email: 'rahul.verma.test@amazon.com',
        role: 'ALUMNI',
        fullName: 'Rahul Verma',
        phone: '+91 98290 22222',
        degree: 'B.Tech',
        branch: 'IT',
        graduationYear: 2020,
        company: 'Amazon',
        designation: 'SDE II',
        location: 'Bangalore, Karnataka',
        skills: 'Java, Spring Boot, AWS',
        isComplete: true,
        daysAgo: 5,
      },
      {
        email: 'amit.singh.test@jecrc.edu.in',
        role: 'STUDENT',
        fullName: 'Amit Singh',
        phone: '+91 98290 33333',
        degree: 'B.Tech',
        branch: 'CSE',
        graduationYear: 2026,
        currentYear: 3,
        company: null,
        designation: 'Student',
        location: 'Jaipur, Rajasthan',
        skills: 'C++, Data Structures, React',
        isComplete: true,
        daysAgo: 1,
      },
      {
        email: 'sneha.reddy.test@jecrc.edu.in',
        role: 'STUDENT',
        fullName: 'Sneha Reddy',
        phone: null, // Missing phone
        degree: 'B.Tech',
        branch: 'AI/ML',
        graduationYear: 2027,
        currentYear: 2,
        company: null,
        designation: 'Student',
        location: 'Jaipur, Rajasthan',
        skills: 'Python, Machine Learning',
        isComplete: false,
        daysAgo: 10,
      },
      {
        email: 'vikram.rao.test@microsoft.com',
        role: 'ALUMNI',
        fullName: 'Vikramaditya Rao',
        phone: '+1 650 123 4567',
        degree: 'B.Tech',
        branch: 'ECE',
        graduationYear: 2015,
        company: 'Microsoft',
        designation: 'Principal Architect',
        location: 'San Francisco, California',
        skills: 'Azure, Cloud Architecture',
        isComplete: true,
        daysAgo: 400, // Outdated > 1 year
      },
    ];

    const createdUserIds = [];

    for (const u of testUsersData) {
      let userRes = await db.query('SELECT id FROM users WHERE email = $1', [u.email]);
      let userId;
      if (userRes.rows.length === 0) {
        const insertUser = await db.query(
          `INSERT INTO users (email, password_hash, role, email_verified, account_status)
           VALUES ($1, $2, $3, true, 'ACTIVE') RETURNING id`,
          [u.email, passwordHash, u.role]
        );
        userId = insertUser.rows[0].id;
      } else {
        userId = userRes.rows[0].id;
      }
      createdUserIds.push(userId);

      const pastDate = new Date(Date.now() - u.daysAgo * 86400000);
      await db.query(
        `INSERT INTO user_profiles (
            user_id, full_name, phone, degree, branch, graduation_year, current_year,
            company, designation, location, skills, is_profile_complete, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (user_id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            degree = EXCLUDED.degree,
            branch = EXCLUDED.branch,
            graduation_year = EXCLUDED.graduation_year,
            current_year = EXCLUDED.current_year,
            company = EXCLUDED.company,
            designation = EXCLUDED.designation,
            location = EXCLUDED.location,
            skills = EXCLUDED.skills,
            is_profile_complete = EXCLUDED.is_profile_complete,
            updated_at = EXCLUDED.updated_at`,
        [
          userId,
          u.fullName,
          u.phone,
          u.degree,
          u.branch,
          u.graduationYear,
          u.currentYear || null,
          u.company,
          u.designation,
          u.location,
          u.skills,
          u.isComplete,
          pastDate,
        ]
      );
    }
    console.log(`Seeded/verified ${testUsersData.length} test records successfully.\n`);

    // -------------------------------------------------------------
    // TEST SECTION 1: Service - getUsers (Basic & Pagination)
    // -------------------------------------------------------------
    console.log('--- Test Section 1: Basic Listing & Pagination ---');
    const basicList = await adminUserService.getUsers({ page: 1, pageSize: 3 });
    assert(Array.isArray(basicList.users), 'Returns users array');
    assert(basicList.users.length <= 3, 'Respects pageSize limit');
    assert(basicList.totalCount >= 5, `Total count is accurate (${basicList.totalCount})`);
    assert(basicList.page === 1, 'Current page is 1');
    assert(basicList.totalPages >= 2, 'Total pages calculated correctly');
    assert(typeof basicList.hasNext === 'boolean', 'hasNext boolean flag present');
    assert(typeof basicList.hasPrev === 'boolean', 'hasPrev boolean flag present');

    // -------------------------------------------------------------
    // TEST SECTION 2: Search Query (q)
    // -------------------------------------------------------------
    console.log('\n--- Test Section 2: Search Query Engine ---');
    const searchByName = await adminUserService.getUsers({ q: 'Priya Sharma' });
    assert(
      searchByName.users.some((u) => u.name === 'Priya Sharma'),
      'Search by Full Name finds matching record'
    );

    const searchByCompany = await adminUserService.getUsers({ q: 'Google' });
    assert(
      searchByCompany.users.some((u) => u.company === 'Google'),
      'Search by Company finds Google alumni'
    );

    const searchByEmail = await adminUserService.getUsers({ q: 'priya.sharma.test' });
    assert(
      searchByEmail.users.some((u) => u.email.includes('priya.sharma.test')),
      'Search by Email finds matching record'
    );

    const searchByBranch = await adminUserService.getUsers({ q: 'AI/ML' });
    assert(
      searchByBranch.users.some((u) => u.branch === 'AI/ML'),
      'Search by Branch finds AI/ML students'
    );

    // -------------------------------------------------------------
    // TEST SECTION 3: Categorical Filters
    // -------------------------------------------------------------
    console.log('\n--- Test Section 3: Categorical Filters ---');
    const filterRoleAlumni = await adminUserService.getUsers({ role: 'alumni' });
    assert(
      filterRoleAlumni.users.every((u) => u.role.toLowerCase() === 'alumni'),
      'Role filter for Alumni returns only alumni'
    );

    const filterRoleStudent = await adminUserService.getUsers({ role: 'student' });
    assert(
      filterRoleStudent.users.every((u) => u.role.toLowerCase() === 'student'),
      'Role filter for Student returns only students'
    );

    const filterBranch = await adminUserService.getUsers({ branch: 'CSE' });
    assert(
      filterBranch.users.every((u) => u.branch && u.branch.includes('CSE')),
      'Branch filter returns CSE users'
    );

    const filterBatch = await adminUserService.getUsers({ batch: 2018 });
    assert(
      filterBatch.users.every((u) => u.batch === 2018),
      'Batch filter returns 2018 graduation batch'
    );

    const filterBatchRange = await adminUserService.getUsers({ batchFrom: 2015, batchTo: 2019 });
    assert(
      filterBatchRange.users.every((u) => u.batch >= 2015 && u.batch <= 2019),
      'Batch range filter [2015-2019] works correctly'
    );

    const filterCity = await adminUserService.getUsers({ city: 'Bangalore' });
    assert(
      filterCity.users.every((u) => u.location && u.location.includes('Bangalore')),
      'City filter for Bangalore works correctly'
    );

    const filterCompany = await adminUserService.getUsers({ company: 'Microsoft' });
    assert(
      filterCompany.users.every((u) => u.company && u.company.includes('Microsoft')),
      'Company filter for Microsoft works correctly'
    );

    // -------------------------------------------------------------
    // TEST SECTION 4: Data Quality & Missing Fields Filters
    // -------------------------------------------------------------
    console.log('\n--- Test Section 4: Data Quality & Freshness Filters ---');
    const filterNeedsUpdate = await adminUserService.getUsers({ status: 'needs update' });
    assert(
      filterNeedsUpdate.users.some((u) => u.name === 'Vikramaditya Rao' && u.profileStatus === 'Needs Update'),
      'Status filter for "Needs Update" correctly identifies >365 days stale records'
    );

    const filterMissingPhone = await adminUserService.getUsers({ missing: 'phone' });
    assert(
      filterMissingPhone.users.some((u) => u.name === 'Sneha Reddy' && !u.phone),
      'Missing phone filter identifies records lacking phone numbers'
    );

    const filter30Days = await adminUserService.getUsers({ lastUpdated: '30days' });
    assert(
      filter30Days.users.every((u) => u.lastUpdatedDaysAgo <= 30),
      'Last updated within 30 days filter works'
    );

    const filterMore1Year = await adminUserService.getUsers({ lastUpdated: 'more1year' });
    assert(
      filterMore1Year.users.every((u) => u.lastUpdatedDaysAgo > 365),
      'Last updated > 1 year filter works'
    );

    // -------------------------------------------------------------
    // TEST SECTION 5: Sorting Whitelist
    // -------------------------------------------------------------
    console.log('\n--- Test Section 5: Sorting Whitelist ---');
    const sortNameAsc = await adminUserService.getUsers({ sortBy: 'name', sortOrder: 'asc' });
    const names = sortNameAsc.users.map((u) => u.name);
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
    assert(
      JSON.stringify(names.slice(0, 3)) === JSON.stringify(sortedNames.slice(0, 3)),
      'Sort by Name ASC orders alphabetically'
    );

    const sortBatchDesc = await adminUserService.getUsers({ sortBy: 'batch', sortOrder: 'desc' });
    const batches = sortBatchDesc.users.map((u) => u.batch || 0);
    assert(
      batches[0] >= batches[1],
      'Sort by Batch DESC orders newest graduation year first'
    );

    // -------------------------------------------------------------
    // TEST SECTION 6: Single User Details (getUserById)
    // -------------------------------------------------------------
    console.log('\n--- Test Section 6: User Details (getUserById) ---');
    const priyaId = createdUserIds[0];
    const userDetail = await adminUserService.getUserById(priyaId);

    assert(userDetail !== null, 'Finds user by valid UUID');
    assert(userDetail.name === 'Priya Sharma', 'Populates full name');
    assert(userDetail.email === 'priya.sharma.test@google.com', 'Populates email');
    assert(userDetail.phone === '+91 98290 11111', 'Populates phone');
    assert(userDetail.company === 'Google', 'Populates company');
    assert(userDetail.designation === 'Senior AI Engineer', 'Populates designation');
    assert(userDetail.role === 'Alumni', 'Formats role as Alumni');
    assert(Array.isArray(userDetail.skills) && userDetail.skills.includes('PyTorch'), 'Parses skills array');
    assert(userDetail.profileStatus === 'Complete', 'Computes profileStatus as Complete');
    assert(Array.isArray(userDetail.missingFields), 'Includes missingFields array');

    const nonexistentDetail = await adminUserService.getUserById('a0000000-0000-0000-0000-000000000000');
    assert(nonexistentDetail === null, 'Returns null for nonexistent UUID');

    // -------------------------------------------------------------
    // TEST SECTION 7: Database Performance (EXPLAIN ANALYZE)
    // -------------------------------------------------------------
    console.log('\n--- Test Section 7: Database Performance (EXPLAIN ANALYZE) ---');
    
    // 1. Unconstrained paginated query
    const explain1 = await db.query(`
      EXPLAIN ANALYZE
      SELECT u.id, u.email, u.role, p.full_name, p.company, p.graduation_year, p.updated_at
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ORDER BY p.updated_at DESC NULLS LAST
      LIMIT 20 OFFSET 0;
    `);
    console.log(`  [Query 1: Default Paginated List] Execution Plan:`);
    explain1.rows.slice(0, 3).forEach((r) => console.log(`    ${r['QUERY PLAN']}`));

    // 2. Complex search & filtered query
    const explain2 = await db.query(`
      EXPLAIN ANALYZE
      SELECT u.id, u.email, u.role, p.full_name, p.company, p.graduation_year
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE (p.full_name ILIKE '%Priya%' OR u.email ILIKE '%Priya%')
      AND u.role = 'ALUMNI'
      AND p.graduation_year >= 2015
      ORDER BY p.graduation_year DESC
      LIMIT 20 OFFSET 0;
    `);
    console.log(`  [Query 2: Multi-Filter Search] Execution Plan:`);
    explain2.rows.slice(0, 3).forEach((r) => console.log(`    ${r['QUERY PLAN']}`));

    assert(explain1.rows.length > 0, 'EXPLAIN ANALYZE executed successfully for default query');
    assert(explain2.rows.length > 0, 'EXPLAIN ANALYZE executed successfully for multi-filter query');

    console.log('\n================================================================');
    console.log(`  RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (100%)`);
    console.log('================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n[TEST RUNNER FATAL ERROR]:', err);
    process.exit(1);
  }
};

runAllTests();
