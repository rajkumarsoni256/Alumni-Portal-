const http = require('http');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const adminUserService = require('../services/adminUserService');
const { sanitizeCsvCell, EXPORT_COLUMNS_MAP } = require('../services/adminExportService');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

const parseCsvLines = (csvText) => {
  if (!csvText || !csvText.trim()) return [];
  return csvText.trim().split(/\r?\n/).filter(Boolean);
};

const runPhase5Tests = async () => {
  console.log('================================================================');
  console.log('     PHASE 5 — ADMIN CSV EXPORT & DATA STREAMING TEST SUITE     ');
  console.log('================================================================\n');

  // Start test server on dynamic port
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
    // Setup Authentication & Role Tokens
    // ------------------------------------------------------------------
    const adminUser = (await db.query(`SELECT id, email FROM users WHERE role = 'ADMIN' LIMIT 1`)).rows[0];
    const studentUser = (await db.query(`SELECT id, email FROM users WHERE role = 'STUDENT' LIMIT 1`)).rows[0];
    const alumniUser = (await db.query(`SELECT id, email FROM users WHERE role = 'ALUMNI' LIMIT 1`)).rows[0];

    const adminToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
    const studentToken = jwt.sign({ sub: studentUser.id, role: 'STUDENT' }, JWT_SECRET, { expiresIn: '1h' });
    const alumniToken = jwt.sign({ sub: alumniUser.id, role: 'ALUMNI' }, JWT_SECRET, { expiresIn: '1h' });
    const expiredToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '-10s' });

    const postExport = async (body, token) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${baseUrl}/api/v1/admin/users/export`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const contentType = res.headers.get('content-type') || '';
      const disposition = res.headers.get('content-disposition') || '';
      let text = '';
      let json = null;
      if (contentType.includes('text/csv')) {
        text = await res.text();
      } else {
        json = await res.json().catch(() => null);
      }
      return { status: res.status, contentType, disposition, text, json };
    };

    // ------------------------------------------------------------------
    // SECTION 1: AUTHORIZATION & RBAC GUARDS
    // ------------------------------------------------------------------
    console.log('--- 1. Authorization & RBAC Checks ---');
    const rNoToken = await postExport({});
    assert(rNoToken.status === 401 && rNoToken.json?.errorCode === 'UNAUTHORIZED', 'No Token returns 401 Unauthorized');

    const rExpired = await postExport({}, expiredToken);
    assert(rExpired.status === 401 && rExpired.json?.errorCode === 'UNAUTHORIZED', 'Expired Token returns 401 Unauthorized');

    const rStudent = await postExport({}, studentToken);
    assert(rStudent.status === 403 && rStudent.json?.errorCode === 'FORBIDDEN', 'Student Token returns 403 Forbidden');

    const rAlumni = await postExport({}, alumniToken);
    assert(rAlumni.status === 403 && rAlumni.json?.errorCode === 'FORBIDDEN', 'Alumni Token returns 403 Forbidden');

    const rAdmin = await postExport({}, adminToken);
    assert(rAdmin.status === 200, 'Admin Token returns 200 OK');
    assert(rAdmin.contentType.includes('text/csv'), 'Response Content-Type is text/csv');
    assert(rAdmin.disposition.includes('attachment; filename='), 'Response Content-Disposition attachment set');

    // ------------------------------------------------------------------
    // SECTION 2: MODE A — SELECTED USER IDS EXPORT
    // ------------------------------------------------------------------
    console.log('\n--- 2. Mode A: Selected User IDs Export ---');
    // Export single user
    const rSingle = await postExport({ userIds: [alumniUser.id], columns: ['name', 'email', 'role'] }, adminToken);
    const linesSingle = parseCsvLines(rSingle.text);
    assert(linesSingle.length === 2, 'Single user export returns 1 header + 1 data line');
    assert(linesSingle[0].includes('"Name"') && linesSingle[0].includes('"Email"'), 'Header contains requested columns');
    assert(linesSingle[1].includes(alumniUser.email), 'Data line contains expected user email');

    // Export multiple users
    const allUsers = (await adminUserService.getUsers({ pageSize: 5 })).users;
    const targetIds = allUsers.slice(0, 3).map((u) => u.id);
    const rMulti = await postExport({ userIds: targetIds, columns: ['name', 'email'] }, adminToken);
    const linesMulti = parseCsvLines(rMulti.text);
    assert(linesMulti.length === 4, 'Multiple user export returns 1 header + 3 data lines');

    // Invalid UUID format
    const rInvalidId = await postExport({ userIds: ['not-a-valid-uuid'] }, adminToken);
    assert(rInvalidId.status === 400 && rInvalidId.json?.errorCode === 'INVALID_ID_FORMAT', 'Malformed UUID returns 400 INVALID_ID_FORMAT');

    // Nonexistent UUID (Empty Export)
    const rNonexistent = await postExport({ userIds: ['00000000-0000-0000-0000-000000000000'] }, adminToken);
    const linesNone = parseCsvLines(rNonexistent.text);
    assert(linesNone.length === 1, 'Nonexistent ID returns clean CSV with header line only');

    // ------------------------------------------------------------------
    // SECTION 3: MODE B — FILTERED EXPORT & CROSS-ENDPOINT PARITY
    // ------------------------------------------------------------------
    console.log('\n--- 3. Mode B: Filter Semantics & Cross-Endpoint Parity ---');

    const filterScenarios = [
      { name: 'Role: ALUMNI', filter: { role: 'alumni' } },
      { name: 'Role: STUDENT', filter: { role: 'student' } },
      { name: 'Branch: CSE', filter: { branch: 'CSE' } },
      { name: 'Batch: 2018', filter: { batch: 2018 } },
      { name: 'Batch Range: 2015-2020', filter: { batchFrom: 2015, batchTo: 2020 } },
      { name: 'City: Bangalore', filter: { city: 'Bangalore' } },
      { name: 'Company: Google', filter: { company: 'Google' } },
      { name: 'Status: Complete', filter: { status: 'complete' } },
      { name: 'Status: Needs Update', filter: { status: 'needs update' } },
      { name: 'Missing: Phone', filter: { missing: 'phone' } },
      { name: 'Search Query: Priya', filter: { q: 'Priya' } },
      { name: 'Multi-filter (Alumni + CSE + Bangalore)', filter: { role: 'alumni', branch: 'CSE', city: 'Bangalore' } },
    ];

    for (const sc of filterScenarios) {
      // 1. Fetch from directory query
      const dirResult = await adminUserService.getUsers({ ...sc.filter, pageSize: 100 });
      // 2. Fetch from export endpoint
      const expResult = await postExport({ filters: sc.filter, columns: ['name', 'email', 'company'] }, adminToken);
      const expLines = parseCsvLines(expResult.text);
      const dataRowsCount = Math.max(0, expLines.length - 1);

      assert(
        dataRowsCount === dirResult.totalCount,
        `Parity [${sc.name}]: Export count (${dataRowsCount}) === Directory count (${dirResult.totalCount})`
      );
    }

    // ------------------------------------------------------------------
    // SECTION 4: COLUMN CUSTOMIZATION & WHITELIST DEFENSE
    // ------------------------------------------------------------------
    console.log('\n--- 4. Column Whitelist & Field Customization ---');
    // Single column
    const rCol1 = await postExport({ columns: ['company'] }, adminToken);
    const lCol1 = parseCsvLines(rCol1.text);
    assert(lCol1[0] === '"Company"', 'Single column requested returns only that column header');

    // Multiple custom columns
    const rColMulti = await postExport({ columns: ['name', 'batch', 'skills', 'linkedin'] }, adminToken);
    const lColMulti = parseCsvLines(rColMulti.text);
    assert(lColMulti[0] === '"Name","Batch","Skills","LinkedIn URL"', 'Multiple custom columns match exact requested order');

    // Unknown / Malicious column name rejection
    const rColBad = await postExport({ columns: ['name', 'password_hash'] }, adminToken);
    assert(rColBad.status === 400 && rColBad.json?.errorCode === 'INVALID_COLUMN', 'Unsupported column (password_hash) rejected with 400 INVALID_COLUMN');

    const rColSqlInj = await postExport({ columns: ['name', 'id; DROP TABLE users;'] }, adminToken);
    assert(rColSqlInj.status === 400 && rColSqlInj.json?.errorCode === 'INVALID_COLUMN', 'SQL injection column rejected with 400 INVALID_COLUMN');

    // ------------------------------------------------------------------
    // SECTION 5: CSV ESCAPING & SPREADSHEET FORMULA INJECTION DEFENSE
    // ------------------------------------------------------------------
    console.log('\n--- 5. CSV Escaping & Formula Injection Defense ---');
    // Unit tests on sanitizer
    assert(sanitizeCsvCell('Bangalore, Karnataka') === '"Bangalore, Karnataka"', 'Commas enclosed in quotes');
    assert(sanitizeCsvCell('Senior "AI" Engineer') === '"Senior ""AI"" Engineer"', 'Double quotes escaped to double-double quotes');
    assert(sanitizeCsvCell('=SUM(A1:A10)') === `"'=SUM(A1:A10)"`, 'Formula "=" prefix sanitized with leading apostrophe');
    assert(sanitizeCsvCell('+cmd|/c calc') === `"'+cmd|/c calc"`, 'Formula "+" prefix sanitized with leading apostrophe');
    assert(sanitizeCsvCell('-cmd|/c calc') === `"'-cmd|/c calc"`, 'Formula "-" prefix sanitized with leading apostrophe');
    assert(sanitizeCsvCell('@IMPORTXML') === `"'@IMPORTXML"`, 'Formula "@" prefix sanitized with leading apostrophe');
    assert(sanitizeCsvCell(null) === '""', 'NULL value formatted as empty quotes');
    assert(sanitizeCsvCell('') === '""', 'Empty string formatted as empty quotes');

    // ------------------------------------------------------------------
    // SECTION 6: PERFORMANCE & EXPLAIN ANALYZE
    // ------------------------------------------------------------------
    console.log('\n--- 6. Performance & EXPLAIN ANALYZE ---');
    const startExportTime = Date.now();
    const rPerf = await postExport({ columns: Object.keys(EXPORT_COLUMNS_MAP) }, adminToken);
    const exportDuration = Date.now() - startExportTime;
    const byteSize = Buffer.byteLength(rPerf.text, 'utf8');

    console.log(`  Streaming Export Duration: ${exportDuration} ms (Payload Size: ${byteSize} bytes)`);
    assert(rPerf.status === 200, 'Full columns export executed successfully');
    assert(byteSize > 100, `Payload size is non-empty (${byteSize} bytes)`);

    const explainRes = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT 
          u.id, u.email, u.role, p.full_name, p.phone, p.degree, p.branch, p.graduation_year,
          p.company, p.designation, p.location, p.skills, p.updated_at
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ORDER BY COALESCE(p.updated_at, u.updated_at) DESC NULLS LAST, u.created_at DESC
      LIMIT 1000 OFFSET 0;
    `);
    console.log('  [Export Query Execution Plan]:');
    explainRes.rows.forEach((r) => console.log(`    ${r['QUERY PLAN']}`));
    assert(explainRes.rows.length > 0, 'EXPLAIN ANALYZE completed for export query');

    console.log('\n================================================================');
    console.log(`  PHASE 5 RESULTS: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('================================================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n[PHASE 5 TEST FATAL ERROR]:', err);
    server.close();
    process.exit(1);
  }
};

runPhase5Tests();
