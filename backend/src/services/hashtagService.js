const db = require('../config/db');

/**
 * Format hashtag display name (e.g., placements2026 -> #Placements2026)
 */
const formatHashtagDisplayName = (rawName) => {
  if (!rawName) return '#JECRC';
  const clean = rawName.replace(/^#/, '').trim();
  if (!clean) return '#JECRC';
  
  // Capitalize common acronyms/words or fallback to TitleCase
  const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
  return `#${capitalized}`;
};

/**
 * Fetch trending hashtags based on public post counts
 * @param {number} limit
 */
const getTrendingHashtags = async (limit = 10) => {
  const limitVal = Math.min(50, Math.max(1, parseInt(limit || 10, 10)));

  const queryText = `
    SELECT h.id, h.name, COUNT(ph.post_id) AS post_count
    FROM hashtags h
    JOIN post_hashtags ph ON h.id = ph.hashtag_id
    JOIN posts p ON p.id = ph.post_id
    JOIN users u ON p.author_id = u.id
    WHERE UPPER(p.visibility) = 'PUBLIC'
      AND UPPER(u.account_status) != 'DISABLED'
    GROUP BY h.id, h.name
    HAVING COUNT(ph.post_id) > 0
    ORDER BY post_count DESC, h.name ASC
    LIMIT $1;
  `;

  const result = await db.query(queryText, [limitVal]);

  const hashtags = result.rows.map((row) => {
    const countNum = parseInt(row.post_count, 10);
    const displayName = formatHashtagDisplayName(row.name);
    return {
      id: row.id,
      name: row.name,
      displayName: displayName,
      tag: displayName,
      postCount: countNum,
      count: `${countNum} ${countNum === 1 ? 'post' : 'posts'}`,
    };
  });

  return { hashtags, total: hashtags.length };
};

/**
 * Fetch posts matching a specific hashtag
 * @param {string} hashtagName
 * @param {string} authUserId
 * @param {Object} queryParams
 */
const getPostsByHashtag = async (hashtagName, authUserId, queryParams = {}) => {
  const cleanName = (hashtagName || '').replace(/^#/, '').trim().toLowerCase();
  const page = Math.max(1, parseInt(queryParams.page || 1, 10));
  const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit || 10, 10)));
  const offset = (page - 1) * limit;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM posts p
    JOIN post_hashtags ph ON p.id = ph.post_id
    JOIN hashtags h ON h.id = ph.hashtag_id
    JOIN users u ON p.author_id = u.id
    WHERE LOWER(h.name) = $1
      AND UPPER(p.visibility) = 'PUBLIC'
      AND UPPER(u.account_status) != 'DISABLED';
  `;

  const countRes = await db.query(countQuery, [cleanName]);
  const total = parseInt(countRes.rows[0].total, 10);

  const postService = require('./postService');
  
  const dataQuery = `
    SELECT p.id
    FROM posts p
    JOIN post_hashtags ph ON p.id = ph.post_id
    JOIN hashtags h ON h.id = ph.hashtag_id
    JOIN users u ON p.author_id = u.id
    WHERE LOWER(h.name) = $1
      AND UPPER(p.visibility) = 'PUBLIC'
      AND UPPER(u.account_status) != 'DISABLED'
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $3;
  `;

  const dataRes = await db.query(dataQuery, [cleanName, limit, offset]);
  
  const posts = [];
  for (const row of dataRes.rows) {
    try {
      const p = await postService.getPostById(authUserId, row.id);
      if (p) posts.push(p);
    } catch (e) {
      // skip deleted
    }
  }

  return {
    hashtag: formatHashtagDisplayName(cleanName),
    posts,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
  };
};

module.exports = {
  getTrendingHashtags,
  getPostsByHashtag,
};
