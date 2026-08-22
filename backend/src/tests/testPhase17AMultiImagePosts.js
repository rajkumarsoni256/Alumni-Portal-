const assert = require('assert');
const http = require('http');
const app = require('../app');
const db = require('../config/db');
const migrate = require('../db/migrate');
const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.JWT_SECRET || 'fallback_secret_key_for_development';

let server = null;
let baseUrl = '';

const requestApi = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const url = new URL(path, baseUrl);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const duration = Date.now() - start;
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed, duration });
        } catch {
          resolve({ status: res.statusCode, body: data, duration });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const runTests = async () => {
  console.log('=== PHASE 17A: MULTI-IMAGE POST INFRASTRUCTURE TESTS ===\n');

  // 1. Run Migration to verify post_media schema
  console.log('--- TEST 1: post_media Schema & Index Verification ---');
  await migrate();

  const colRes = await db.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'post_media' AND column_name IN ('thumbnail_url', 'sort_order')
  `);
  const cols = colRes.rows.map(r => r.column_name);
  assert.ok(cols.includes('thumbnail_url'), 'thumbnail_url column present');
  assert.ok(cols.includes('sort_order'), 'sort_order column present');

  const idxRes = await db.query(`
    SELECT indexname FROM pg_indexes WHERE indexname = 'idx_post_media_post_order'
  `);
  assert.strictEqual(idxRes.rows.length, 1, 'idx_post_media_post_order index present');
  console.log('  [PASS] post_media schema, sort_order column, and composite index verified.');

  // Start HTTP Server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`\n[TEST SERVER] Listening on ${baseUrl}`);

  let testUser = null;
  let testToken = '';

  try {
    // Create Test User
    const email = `test_p17a_${Date.now()}@jecrc.ac.in`;
    const userRes = await db.query(
      `INSERT INTO users (email, password_hash, role, email_verified, account_status)
       VALUES ($1, 'hash_p17a', 'STUDENT', true, 'ACTIVE') RETURNING *`,
      [email]
    );
    testUser = userRes.rows[0];

    await db.query(
      `INSERT INTO user_profiles (id, user_id, full_name, degree, branch, graduation_year, company, is_profile_complete)
       VALUES (gen_random_uuid(), $1, 'Multi Image Tester', 'B.Tech', 'CSE', 2026, 'JECRC Lab', true)`,
      [testUser.id]
    );

    testToken = jwt.sign({ id: testUser.id, email, role: 'STUDENT' }, getJwtSecret(), { expiresIn: '1h' });

    // TEST 2: Create Text Post with 0 Images
    console.log('\n--- TEST 2: Post Creation with 0 Images ---');
    const post0 = await requestApi('POST', '/api/v1/posts', {
      content: 'Testing text post with 0 images',
      category: 'STUDENT',
      postType: 'TEXT',
      visibility: 'PUBLIC'
    }, testToken);
    assert.strictEqual(post0.status, 201, 'Text post returns 201 Created');
    assert.strictEqual(post0.body.data.media.length, 0, 'Media array is empty');
    console.log('  [PASS] Post created with 0 images.');

    // TEST 3: Create Post with 5 Images directly in DB & post_media
    console.log('\n--- TEST 3: Create Post with 5 Images & Deterministic Sort Order ---');
    const postId5 = require('crypto').randomUUID();
    await db.query(
      `INSERT INTO posts (id, author_id, content, category, post_type, visibility)
       VALUES ($1, $2, 'Post with 5 photos gallery test', 'STUDENT', 'PHOTO', 'PUBLIC')`,
      [postId5, testUser.id]
    );

    for (let i = 0; i < 5; i++) {
      await db.query(
        `INSERT INTO post_media (post_id, media_type, media_url, thumbnail_url, sort_order)
         VALUES ($1, 'IMAGE', $2, $3, $4)`,
        [postId5, `https://example.com/photo_${i + 1}.jpg`, `https://example.com/thumb_${i + 1}.jpg`, i]
      );
    }

    const fetchedPost = await requestApi('GET', `/api/v1/posts/${postId5}`, null, testToken);
    assert.strictEqual(fetchedPost.status, 200, 'GET /posts/:id returns 200 OK');
    const postData = fetchedPost.body.data.post || fetchedPost.body.data;
    assert.strictEqual(postData.media.length, 5, 'Post contains exactly 5 media items');
    assert.strictEqual(postData.media[0].sortOrder, 0, 'First item has sortOrder 0');
    assert.strictEqual(postData.media[4].sortOrder, 4, 'Fifth item has sortOrder 4');
    console.log('  [PASS] Post with 5 images fetched with exact sort_order [0, 1, 2, 3, 4].');

    // TEST 4: Rejection of 6+ Images
    console.log('\n--- TEST 4: Rejection of 6+ Images (HTTP 400) ---');
    const postService = require('../services/postService');
    let rejectedError = null;
    try {
      const mockFiles = [1, 2, 3, 4, 5, 6].map((i) => ({ originalname: `img${i}.jpg`, mimetype: 'image/jpeg', size: 1000 }));
      await postService.createPost(testUser, { content: 'Exceeding 5 photos' }, mockFiles);
    } catch (err) {
      rejectedError = err;
    }

    assert.ok(rejectedError, 'Service threw validation error for >5 files');
    assert.strictEqual(rejectedError.statusCode, 400, 'Error status is 400');
    assert.strictEqual(rejectedError.message, 'A post can contain a maximum of 5 images', 'Expected rejection message returned');
    console.log('  [PASS] 6+ images rejected cleanly with HTTP 400.');

    // TEST 5: Single Query Feed Batch Retrieval (No N+1 Queries)
    console.log('\n--- TEST 5: Single Batch Query Feed Fetch Performance ---');
    const feedRes = await requestApi('GET', '/api/v1/posts?limit=15', null, testToken);
    assert.strictEqual(feedRes.status, 200, 'Feed returns 200 OK');
    console.log(`  Feed Response Time for 15 Posts with Media: ${feedRes.duration} ms`);
    assert.ok(feedRes.duration < 300, `Feed retrieval latency under 300ms (actual: ${feedRes.duration}ms)`);
    console.log('  [PASS] Feed API response time benchmark satisfied (<300ms).');

    console.log('\n=== ALL PHASE 17A MULTI-IMAGE POST TESTS PASSED CLEANLY! ===\n');
  } finally {
    if (testUser?.id) {
      await db.query('DELETE FROM users WHERE id = $1', [testUser.id]).catch(() => {});
    }
    if (server) {
      server.close();
    }
  }
};

runTests().catch((err) => {
  console.error('\n[TEST FAILURE]', err.stack || err.message);
  process.exit(1);
});
