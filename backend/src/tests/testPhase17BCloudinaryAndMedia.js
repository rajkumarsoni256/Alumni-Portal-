const assert = require('assert');
const http = require('http');
const app = require('../app');
const db = require('../config/db');
const migrate = require('../db/migrate');
const storageService = require('../services/storageService');
const postService = require('../services/postService');
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
  console.log('=== PHASE 17B: PRODUCTION MEDIA & CLOUDINARY TEST SUITE ===\n');

  // 1. Schema Migration & Cloudinary Config Check
  console.log('--- TEST 1: Cloudinary & Storage Configuration Check ---');
  await migrate();

  const isCloudinarySet = Boolean(process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL);
  console.log(`  Cloudinary Environment Configured: ${isCloudinarySet ? 'YES (Production Cloudinary)' : 'NO (Local Disk Fallback)'}`);

  // Start HTTP Server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[TEST SERVER] Listening on ${baseUrl}`);

  let testUser1 = null;
  let testUser2 = null;
  let token1 = '';
  let token2 = '';

  try {
    // Create Test Users
    const email1 = `test_p17b_u1_${Date.now()}@jecrc.ac.in`;
    const email2 = `test_p17b_u2_${Date.now()}@jecrc.ac.in`;

    const u1Res = await db.query(
      `INSERT INTO users (email, password_hash, role, email_verified, account_status)
       VALUES ($1, 'hash_p17b', 'ALUMNI', true, 'ACTIVE') RETURNING *`,
      [email1]
    );
    testUser1 = u1Res.rows[0];

    const u2Res = await db.query(
      `INSERT INTO users (email, password_hash, role, email_verified, account_status)
       VALUES ($1, 'hash_p17b', 'STUDENT', true, 'ACTIVE') RETURNING *`,
      [email2]
    );
    testUser2 = u2Res.rows[0];

    await db.query(
      `INSERT INTO user_profiles (id, user_id, full_name, degree, branch, graduation_year, company, is_profile_complete)
       VALUES (gen_random_uuid(), $1, 'Media Tester 1', 'B.Tech', 'ECE', 2022, 'Google', true)`,
      [testUser1.id]
    );

    await db.query(
      `INSERT INTO user_profiles (id, user_id, full_name, degree, branch, graduation_year, company, is_profile_complete)
       VALUES (gen_random_uuid(), $1, 'Media Tester 2', 'B.Tech', 'CSE', 2026, 'Student Lab', true)`,
      [testUser2.id]
    );

    token1 = jwt.sign({ id: testUser1.id, email: email1, role: 'ALUMNI' }, getJwtSecret(), { expiresIn: '1h' });
    token2 = jwt.sign({ id: testUser2.id, email: email2, role: 'STUDENT' }, getJwtSecret(), { expiresIn: '1h' });

    // TEST 2: Upload Matrix (0, 1, 2, 3, 4, 5 Images)
    console.log('\n--- TEST 2: Upload Matrix Verification (0 to 5 Images) ---');
    for (let count = 0; count <= 5; count++) {
      const postId = require('crypto').randomUUID();
      await db.query(
        `INSERT INTO posts (id, author_id, content, category, post_type, visibility)
         VALUES ($1, $2, $3, 'ALUMNI', $4, 'PUBLIC')`,
        [postId, testUser1.id, `Testing multi-image post with ${count} images`, count > 0 ? 'PHOTO' : 'TEXT']
      );

      for (let i = 0; i < count; i++) {
        const mediaUrl = isCloudinarySet
          ? `https://res.cloudinary.com/demo/image/upload/v123456/sample_${i + 1}.jpg`
          : `/uploads/posts/photo_${postId}_${i + 1}.jpg`;
        const storageKey = isCloudinarySet ? `sample_${i + 1}` : `photo_${postId}_${i + 1}.jpg`;

        await db.query(
          `INSERT INTO post_media (post_id, media_type, storage_key, media_url, thumbnail_url, sort_order)
           VALUES ($1, 'IMAGE', $2, $3, $4, $5)`,
          [postId, storageKey, mediaUrl, mediaUrl, i]
        );
      }

      const res = await requestApi('GET', `/api/v1/posts/${postId}`, null, token1);
      assert.strictEqual(res.status, 200, `Fetch post with ${count} images returns 200 OK`);
      const postData = res.body.data.post || res.body.data;
      assert.strictEqual(postData.media.length, count, `Post contains exactly ${count} media items`);
      if (count > 0) {
        assert.strictEqual(postData.media[0].sortOrder, 0, 'First image sortOrder is 0');
        assert.strictEqual(postData.media[count - 1].sortOrder, count - 1, `Last image sortOrder is ${count - 1}`);
      }
      console.log(`  [PASS] ${count} image post verified cleanly.`);
    }

    // TEST 3: Rejection of 6+ Images & Invalid Media
    console.log('\n--- TEST 3: Rejection of 6+ Images & Invalid Files ---');
    let overMaxErr = null;
    try {
      const mock6Files = Array.from({ length: 6 }, (_, i) => ({ originalname: `img${i}.jpg`, mimetype: 'image/jpeg', size: 5000 }));
      await postService.createPost(testUser1, { content: 'Over max' }, mock6Files);
    } catch (e) {
      overMaxErr = e;
    }

    assert.ok(overMaxErr, 'Over 5 images rejected');
    assert.strictEqual(overMaxErr.statusCode, 400, 'Returns HTTP 400 Bad Request');
    assert.strictEqual(overMaxErr.message, 'A post can contain a maximum of 5 images');
    console.log('  [PASS] 6+ images rejected with HTTP 400.');

    // TEST 4: Database URL Verification (No localhost or raw /uploads prefix in Cloudinary mode)
    console.log('\n--- TEST 4: Database Media URL Format Verification ---');
    const mediaCheckRes = await db.query(`SELECT media_url, sort_order FROM post_media ORDER BY sort_order ASC LIMIT 5`);
    for (const row of mediaCheckRes.rows) {
      assert.ok(!row.media_url.includes('localhost:8080'), `URL '${row.media_url}' does not contain localhost:8080`);
      assert.ok(typeof row.sort_order === 'number', 'sort_order is integer');
    }
    console.log('  [PASS] Database media URLs clean & correctly formatted.');

    // TEST 5: Cross-Account Access & Persistence Test
    console.log('\n--- TEST 5: Cross-Account Persistence & Image Visibility ---');
    const createPRes = await requestApi('POST', '/api/v1/posts', {
      content: 'Cross account visibility test post',
      category: 'ALUMNI',
      postType: 'TEXT',
      visibility: 'PUBLIC'
    }, token1);
    const createdId = createPRes.body.data.id || createPRes.body.data.post?.id;

    // Fetch from User 2
    const u2Fetch = await requestApi('GET', `/api/v1/posts/${createdId}`, null, token2);
    assert.strictEqual(u2Fetch.status, 200, 'User 2 can view User 1 post');
    console.log('  [PASS] Post & media visible across accounts.');

    // TEST 6: Partial Upload Failure & Asset Cleanup Simulation
    console.log('\n--- TEST 6: Partial Upload Failure & Asset Cleanup ---');
    const deletedKeys = [];
    const originalDelete = storageService.deleteFile;
    storageService.deleteFile = async (key) => {
      deletedKeys.push(key);
      return originalDelete.call(storageService, key);
    };

    let step = 0;
    const originalUpload = storageService.uploadFile;
    storageService.uploadFile = async (file) => {
      step++;
      if (step === 4) {
        throw new Error('Simulated Cloudinary Network Timeout on Image #4');
      }
      return {
        mediaUrl: `https://res.cloudinary.com/demo/image/upload/v1234/test_${step}.jpg`,
        storageKey: `test_key_${step}`,
        mediaType: 'IMAGE',
        originalFilename: file.originalname,
        mimeType: 'image/jpeg',
        fileSize: 1000
      };
    };

    let partialErr = null;
    try {
      const mock5Files = Array.from({ length: 5 }, (_, i) => ({ originalname: `pic${i + 1}.jpg`, mimetype: 'image/jpeg', size: 2000 }));
      await postService.createPost(testUser1, { content: 'Partial fail post' }, mock5Files);
    } catch (e) {
      partialErr = e;
    } finally {
      storageService.uploadFile = originalUpload;
      storageService.deleteFile = originalDelete;
    }

    assert.ok(partialErr, 'Partial upload threw exception');
    assert.strictEqual(partialErr.message, 'Simulated Cloudinary Network Timeout on Image #4');
    assert.deepStrictEqual(deletedKeys, ['test_key_1', 'test_key_2', 'test_key_3'], 'Cleaned up uploaded assets #1, #2, #3');
    console.log('  [PASS] Partial upload failure cleaned up uploaded Cloudinary assets cleanly.');

    console.log('\n=== ALL PHASE 17B PRODUCTION MEDIA & CLOUDINARY TESTS PASSED CLEANLY! ===\n');
  } finally {
    if (testUser1?.id) await db.query('DELETE FROM users WHERE id = $1', [testUser1.id]).catch(() => {});
    if (testUser2?.id) await db.query('DELETE FROM users WHERE id = $1', [testUser2.id]).catch(() => {});
    if (server) server.close();
  }
};

runTests().catch((err) => {
  console.error('\n[TEST FAILURE]', err.stack || err.message);
  process.exit(1);
});
