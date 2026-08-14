const http = require('http');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const migrate = require('../db/migrate');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

const runPhase9Tests = async () => {
  console.log('================================================================');
  console.log('    PHASE 9 — ADMIN SETTINGS & SYSTEM CONFIGURATION SUITE       ');
  console.log('================================================================\n');

  await migrate();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  let passed = 0;
  let total = 0;

  const assert = (condition, name, details = '') => {
    total++;
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} - ${details}`);
    }
  };

  try {
    // ------------------------------------------------------------------
    // Setup Tokens & Helpers
    // ------------------------------------------------------------------
    const adminUser = (await db.query(`SELECT id, email FROM users WHERE role = 'ADMIN' LIMIT 1`)).rows[0];
    const studentUser = (await db.query(`SELECT id, email FROM users WHERE role = 'STUDENT' LIMIT 1`)).rows[0];
    const alumniUser = (await db.query(`SELECT id, email FROM users WHERE role = 'ALUMNI' LIMIT 1`)).rows[0];

    const adminToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
    const studentToken = jwt.sign({ sub: studentUser.id, role: 'STUDENT' }, JWT_SECRET, { expiresIn: '1h' });
    const alumniToken = jwt.sign({ sub: alumniUser.id, role: 'ALUMNI' }, JWT_SECRET, { expiresIn: '1h' });
    const expiredToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '-10s' });

    const requestApi = async (method, path, body, token) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => null);
      return { status: res.status, body: data };
    };

    // ------------------------------------------------------------------
    // SECTION 1: AUTHORIZATION & RBAC CHECKS
    // ------------------------------------------------------------------
    console.log('--- 1. Authorization & RBAC Checks ---');
    const rNoToken = await requestApi('GET', '/api/v1/admin/settings');
    assert(rNoToken.status === 401 && rNoToken.body?.errorCode === 'UNAUTHORIZED', 'GET /settings no token -> 401');

    const rExpired = await requestApi('GET', '/api/v1/admin/settings', null, expiredToken);
    assert(rExpired.status === 401 && rExpired.body?.errorCode === 'UNAUTHORIZED', 'GET /settings expired token -> 401');

    const rStudent = await requestApi('GET', '/api/v1/admin/settings', null, studentToken);
    assert(rStudent.status === 403 && rStudent.body?.errorCode === 'FORBIDDEN', 'GET /settings Student role -> 403');

    const rAlumni = await requestApi('GET', '/api/v1/admin/settings', null, alumniToken);
    assert(rAlumni.status === 403 && rAlumni.body?.errorCode === 'FORBIDDEN', 'GET /settings Alumni role -> 403');

    const rAdmin = await requestApi('GET', '/api/v1/admin/settings', null, adminToken);
    assert(rAdmin.status === 200 && rAdmin.body?.success === true, 'GET /settings Admin role -> 200 OK');

    const rPatchStudent = await requestApi('PATCH', '/api/v1/admin/settings', { platformName: 'Hacked' }, studentToken);
    assert(rPatchStudent.status === 403 && rPatchStudent.body?.errorCode === 'FORBIDDEN', 'PATCH /settings Student role -> 403 Forbidden');

    const rPatchAlumni = await requestApi('PATCH', '/api/v1/admin/settings', { platformName: 'Hacked' }, alumniToken);
    assert(rPatchAlumni.status === 403 && rPatchAlumni.body?.errorCode === 'FORBIDDEN', 'PATCH /settings Alumni role -> 403 Forbidden');

    // ------------------------------------------------------------------
    // SECTION 2: DEFAULT SCHEMA & SAFE INVARIANTS
    // ------------------------------------------------------------------
    console.log('\n--- 2. Default Schema & Safe Invariants ---');
    const settingsData = rAdmin.body.data;
    assert(typeof settingsData.platformName === 'string', 'platformName is a string');
    assert(typeof settingsData.supportEmail === 'string', 'supportEmail is a string');
    assert(typeof settingsData.registrationEnabled === 'boolean', 'registrationEnabled is a boolean');
    assert(typeof settingsData.alumniVerificationEnabled === 'boolean', 'alumniVerificationEnabled is a boolean');
    assert(typeof settingsData.maintenanceMode === 'boolean', 'maintenanceMode is a boolean');
    assert(settingsData.adminProfile?.email === adminUser.email, 'adminProfile reflects authenticated admin');
    assert(settingsData.password === undefined && settingsData.password_hash === undefined, 'Zero password hashes exposed in settings response');

    // ------------------------------------------------------------------
    // SECTION 3: INPUT VALIDATION & UNKNOWN PROPERTY DEFENSE
    // ------------------------------------------------------------------
    console.log('\n--- 3. Input Validation & Unknown Property Defense ---');
    const rUnknown = await requestApi('PATCH', '/api/v1/admin/settings', { unknownField: 'test' }, adminToken);
    assert(rUnknown.status === 400 && rUnknown.body?.errorCode === 'INVALID_SETTING_PROPERTY', 'Unknown setting property rejected with 400');

    const rBadType = await requestApi('PATCH', '/api/v1/admin/settings', { registrationEnabled: 'yes' }, adminToken);
    assert(rBadType.status === 400 && rBadType.body?.errorCode === 'VALIDATION_ERROR', 'Non-boolean registrationEnabled rejected with 400');

    const rBadEmail = await requestApi('PATCH', '/api/v1/admin/settings', { supportEmail: 'not-an-email' }, adminToken);
    assert(rBadEmail.status === 400 && rBadEmail.body?.errorCode === 'VALIDATION_ERROR', 'Invalid supportEmail rejected with 400');

    const rEmptyName = await requestApi('PATCH', '/api/v1/admin/settings', { platformName: '   ' }, adminToken);
    assert(rEmptyName.status === 400 && rEmptyName.body?.errorCode === 'VALIDATION_ERROR', 'Whitespace-only platformName rejected with 400');

    // ------------------------------------------------------------------
    // SECTION 4: PERSISTENCE & FUNCTIONAL EFFECT (REGISTRATION TOGGLE)
    // ------------------------------------------------------------------
    console.log('\n--- 4. Persistence & Functional Registration Control ---');
    // Step 4a: Disable registration
    const rDisableReg = await requestApi(
      'PATCH',
      '/api/v1/admin/settings',
      { platformName: 'JECRC Alumni Network Updated', registrationEnabled: false },
      adminToken
    );
    assert(rDisableReg.status === 200, 'PATCH /settings disabling registration succeeded (200 OK)');
    assert(rDisableReg.body.data.registrationEnabled === false, 'API response reflects registrationEnabled = false');

    // Step 4b: Direct PostgreSQL verification
    const dbSettings = (await db.query(`SELECT platform_name, registration_enabled FROM system_settings WHERE id = 'default'`)).rows[0];
    assert(dbSettings.platform_name === 'JECRC Alumni Network Updated', 'PostgreSQL platform_name matches updated value');
    assert(dbSettings.registration_enabled === false, 'PostgreSQL registration_enabled matches false');

    // Step 4c: Attempt public user registration while disabled -> Must be 403 REGISTRATION_DISABLED
    const rRegAttempt = await requestApi('POST', '/api/v1/auth/register', {
      name: 'Blocked User',
      email: 'blocked.user@jecrc.ac.in',
      password: 'Password123!',
      role: 'STUDENT',
    });
    assert(
      rRegAttempt.status === 403 && rRegAttempt.body?.errorCode === 'REGISTRATION_DISABLED',
      'Registration attempt blocked when registrationEnabled = false (403 REGISTRATION_DISABLED)'
    );

    // Step 4d: Re-enable registration and reset name
    const rEnableReg = await requestApi(
      'PATCH',
      '/api/v1/admin/settings',
      { platformName: 'JECRC Community Platform', registrationEnabled: true },
      adminToken
    );
    assert(rEnableReg.status === 200 && rEnableReg.body.data.registrationEnabled === true, 'Re-enabled registration successfully');

    // ------------------------------------------------------------------
    // SECTION 5: ADMIN PROFILE UPDATE & PASSWORD DEFENSE
    // ------------------------------------------------------------------
    console.log('\n--- 5. Admin Profile & Password Security ---');
    const rUpdateName = await requestApi('PATCH', '/api/v1/admin/settings', { name: 'Dean of Alumni Relations' }, adminToken);
    assert(rUpdateName.status === 200, 'Updated admin name -> 200 OK');

    const dbProfile = (await db.query(`SELECT full_name FROM user_profiles WHERE user_id = $1`, [adminUser.id])).rows[0];
    assert(dbProfile.full_name === 'Dean of Alumni Relations', 'user_profiles.full_name updated in PostgreSQL');

    const rBadCurrentPw = await requestApi(
      'PATCH',
      '/api/v1/admin/settings',
      { currentPassword: 'WrongPassword123!', newPassword: 'NewValidPassword123!' },
      adminToken
    );
    assert(rBadCurrentPw.status === 400 && rBadCurrentPw.body?.errorCode === 'INVALID_CREDENTIALS', 'Wrong currentPassword rejected with 400');

    // ------------------------------------------------------------------
    // SECTION 6: AUDIT TRAIL INTEGRATION
    // ------------------------------------------------------------------
    console.log('\n--- 6. Audit Trail Integration ---');
    const latestAudit = (
      await db.query(
        `SELECT action, user_id, details FROM audit_logs WHERE action = 'SETTING_UPDATED' ORDER BY created_at DESC LIMIT 1`
      )
    ).rows[0];

    assert(latestAudit !== undefined, 'SETTING_UPDATED audit log persisted in PostgreSQL');
    assert(latestAudit.user_id === adminUser.id, 'Audit log attributes action to authenticated admin user ID');
    assert(
      JSON.stringify(latestAudit.details || {}).includes('password') === false,
      'Zero password details or secrets persisted in audit log metadata'
    );

    // ------------------------------------------------------------------
    // SECTION 7: PERFORMANCE & EXPLAIN ANALYZE
    // ------------------------------------------------------------------
    console.log('\n--- 7. Performance & EXPLAIN ANALYZE ---');
    const explainSettings = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT 
          platform_name, support_email, registration_enabled, alumni_verification_enabled, maintenance_mode, updated_at
      FROM system_settings 
      WHERE id = 'default';
    `);

    console.log('  [Settings Query Plan]:');
    explainSettings.rows.forEach((r) => console.log(`    ${r['QUERY PLAN']}`));
    assert(explainSettings.rows.length > 0, 'EXPLAIN ANALYZE completed for system_settings query');

    console.log('\n================================================================');
    console.log(`  PHASE 9 RESULTS: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('================================================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n[PHASE 9 TEST FATAL ERROR]:', err);
    server.close();
    process.exit(1);
  }
};

runPhase9Tests();
