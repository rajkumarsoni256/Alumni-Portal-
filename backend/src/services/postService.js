const crypto = require('crypto');
const db = require('../config/db');
const storageService = require('./storageService');
const notificationService = require('./notificationService');
const { logger } = require('../utils/logger');

const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://localhost:8080';

const getFullMediaUrl = (urlStr) => {
  if (!urlStr) return null;
  if (urlStr.startsWith('http://') || urlStr.startsWith('https://') || urlStr.startsWith('data:')) {
    return urlStr;
  }
  const cleanPath = urlStr.startsWith('/') ? urlStr : `/${urlStr}`;
  return `${BACKEND_BASE_URL}${cleanPath}`;
};

const parseTags = (input) => {
  if (Array.isArray(input)) return input.filter(Boolean);
  if (!input || typeof input !== 'string') return ['#JECRC'];
  return input.split(/\s*,\s*|\s+/).filter(Boolean);
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  const date = new Date(dateStr);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 7)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getUserName = async (userId) => {
  const res = await db.query(
    `SELECT p.full_name, u.email FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1`,
    [userId]
  );
  if (res.rows.length === 0) return 'JECRC Member';
  return res.rows[0].full_name || res.rows[0].email.split('@')[0];
};

const formatAuthor = (row) => {
  const isAlumni = (row.author_role || '').toUpperCase() === 'ALUMNI';
  const gradYr = row.author_graduation_year ? parseInt(row.author_graduation_year, 10) : null;

  return {
    id: row.author_id,
    userId: row.author_id,
    name: row.author_name || (row.author_email ? row.author_email.split('@')[0] : 'JECRC Member'),
    fullName: row.author_name || '',
    email: row.author_email,
    role: (row.author_role || 'STUDENT').toLowerCase(),
    roleUpper: (row.author_role || 'STUDENT').toUpperCase(),
    avatar: getFullMediaUrl(row.author_avatar),
    avatarUrl: getFullMediaUrl(row.author_avatar),
    headline: isAlumni
      ? `${row.author_designation || 'Alumnus'}${row.author_company ? ` @ ${row.author_company}` : ''}`
      : `${row.author_degree || 'B.Tech'} ${row.author_branch || ''}${gradYr ? ` • Class of ${gradYr}` : ''}`.trim(),
    batch: gradYr ? `Class of ${gradYr}` : (isAlumni ? 'Alumni' : 'Student'),
    company: row.author_company || null,
    designation: row.author_designation || null,
    verified: true,
    isAlumni: isAlumni,
  };
};

const formatPostDTO = (row, mediaRows = [], hashtagRows = [], authUserId = null) => {
  const tags = hashtagRows.length > 0
    ? hashtagRows.map(h => `#${h.name.replace(/^#/, '')}`)
    : parseTags(row.tags);

  const mediaList = mediaRows.map(m => {
    const fullUrl = getFullMediaUrl(m.media_url);
    return {
      id: m.id,
      type: m.media_type,
      mediaType: m.media_type,
      url: fullUrl,
      mediaUrl: fullUrl,
      storageKey: m.storage_key,
      originalFilename: m.original_filename,
      mimeType: m.mime_type,
      fileSize: m.file_size ? parseInt(m.file_size, 10) : null,
    };
  });

  const likesCount = parseInt(row.likes_count || '0', 10);
  const commentsCount = parseInt(row.comments_count || '0', 10);
  const isLiked = row.is_liked_by_user === true || row.is_liked_by_user === 'true' || row.is_liked_by_user === 1;

  let firstImageUrl = getFullMediaUrl(row.image_url) || null;
  if (!firstImageUrl && mediaList.length > 0) {
    const imgMedia = mediaList.find(m => m.type === 'IMAGE');
    if (imgMedia) firstImageUrl = imgMedia.url;
  }

  let videoUrl = null;
  if (mediaList.length > 0) {
    const vidMedia = mediaList.find(m => m.type === 'VIDEO');
    if (vidMedia) videoUrl = vidMedia.url;
  }

  return {
    id: row.id,
    authorId: row.author_id,
    author: formatAuthor(row),
    content: row.content || '',
    image: firstImageUrl,
    imageUrl: firstImageUrl,
    videoUrl: videoUrl,
    category: (row.category || 'all').toLowerCase(),
    postType: row.post_type || 'TEXT',
    type: row.post_type || 'TEXT',
    visibility: row.visibility || 'PUBLIC',
    tags: tags.length > 0 ? tags : ['#JECRC'],
    hashtags: tags.length > 0 ? tags : ['#JECRC'],
    media: mediaList,

    // Job Post Fields
    jobDetails: row.job_title ? {
      title: row.job_title,
      jobTitle: row.job_title,
      company: row.company_name,
      companyName: row.company_name,
      location: row.job_location,
      employmentType: row.employment_type || 'Full-time',
      description: row.job_description,
      applicationUrl: row.job_url,
      jobUrl: row.job_url,
    } : null,
    jobTitle: row.job_title || null,
    companyName: row.company_name || null,
    jobLocation: row.job_location || null,
    employmentType: row.employment_type || null,
    jobDescription: row.job_description || null,
    jobUrl: row.job_url || null,

    // Achievement Post Fields
    achievementDetails: row.achievement_title ? {
      title: row.achievement_title,
      achievementTitle: row.achievement_title,
      organization: row.achievement_organization,
      achievementOrganization: row.achievement_organization,
      description: row.achievement_description,
      achievementDescription: row.achievement_description,
      date: row.achievement_date,
      achievementDate: row.achievement_date,
    } : null,
    achievementTitle: row.achievement_title || null,
    achievementOrganization: row.achievement_organization || null,
    achievementDescription: row.achievement_description || null,
    achievementDate: row.achievement_date || null,

    likes: likesCount,
    likesCount: likesCount,
    commentsCount: commentsCount,
    likedByCurrentUser: isLiked,
    isLiked: isLiked,
    savedByCurrentUser: false,
    createdAt: formatTimeAgo(row.created_at),
    createdAtRaw: row.created_at,
    updatedAt: row.updated_at && row.updated_at !== row.created_at ? 'Edited' : null,
  };
};

const verifyPostAccess = async (authUserId, post) => {
  if (!post) return false;
  const visibility = (post.visibility || 'PUBLIC').toUpperCase();
  if (visibility === 'PUBLIC') return true;
  if (post.author_id === authUserId) return true;

  const connRes = await db.query(
    `SELECT 1 FROM connections 
     WHERE ((requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1))
     AND UPPER(status) = 'ACCEPTED'`,
    [authUserId, post.author_id]
  );
  return connRes.rows.length > 0;
};

const createPost = async (user, postData, files = []) => {
  if (user.account_status === 'DISABLED') {
    const err = new Error('Disabled accounts cannot create posts');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  if ((user.role || '').toUpperCase() === 'ADMIN') {
    const err = new Error('Admin accounts cannot post in public community feed');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  const postType = (postData.postType || postData.type || 'TEXT').toUpperCase();
  const visibility = (postData.visibility || 'PUBLIC').toUpperCase();

  const content = (postData.content || '').trim();
  const jobTitle = (postData.jobTitle || postData.title || '').trim();
  const companyName = (postData.companyName || postData.company || '').trim();
  const jobLocation = (postData.jobLocation || postData.location || '').trim();
  const employmentType = (postData.employmentType || postData.type || 'Full-time').trim();
  const jobDescription = (postData.jobDescription || postData.description || '').trim();
  const jobUrl = (postData.jobUrl || postData.applicationUrl || '').trim();

  const achievementTitle = (postData.achievementTitle || postData.title || '').trim();
  const achievementOrg = (postData.achievementOrganization || postData.organization || '').trim();
  const achievementDesc = (postData.achievementDescription || postData.description || '').trim();
  const achievementDate = postData.achievementDate || postData.date || null;

  if (postType === 'JOB') {
    if (!jobTitle) {
      const err = new Error('Job title is required for Job post');
      err.statusCode = 400;
      err.errorCode = 'VALIDATION_ERROR';
      throw err;
    }
    if (!companyName) {
      const err = new Error('Company name is required for Job post');
      err.statusCode = 400;
      err.errorCode = 'VALIDATION_ERROR';
      throw err;
    }
  } else if (postType === 'ACHIEVEMENT') {
    if (!achievementTitle) {
      const err = new Error('Achievement title is required for Achievement post');
      err.statusCode = 400;
      err.errorCode = 'VALIDATION_ERROR';
      throw err;
    }
  } else {
    if (!content && (!files || files.length === 0) && !postData.imageUrl && !postData.image) {
      const err = new Error('Post content or media is required');
      err.statusCode = 400;
      err.errorCode = 'VALIDATION_ERROR';
      throw err;
    }
  }

  if (content && content.length > 5000) {
    const err = new Error('Post content exceeds maximum length of 5000 characters');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const uploadedMediaRecords = [];
  try {
    if (files && files.length > 0) {
      for (const file of files) {
        const record = await storageService.uploadFile(file);
        if (record) {
          uploadedMediaRecords.push(record);
        }
      }
    }
  } catch (uploadErr) {
    throw uploadErr;
  }

  let imageUrl = postData.imageUrl || postData.image || null;
  if (!imageUrl && uploadedMediaRecords.length > 0) {
    const firstImg = uploadedMediaRecords.find(m => m.mediaType === 'IMAGE');
    if (firstImg) imageUrl = firstImg.mediaUrl;
  }

  const rawCat = (postData.category || '').toUpperCase();
  const category = ['ALUMNI', 'STUDENT', 'JOBS', 'ACHIEVEMENTS'].includes(rawCat)
    ? rawCat
    : (postType === 'JOB' ? 'JOBS' : (postType === 'ACHIEVEMENT' ? 'ACHIEVEMENTS' : (user.role.toUpperCase() === 'ALUMNI' ? 'ALUMNI' : 'STUDENT')));

  const hashtagsInput = postData.hashtags || postData.tags || '#JECRC';
  const tagsList = parseTags(hashtagsInput);
  const tagsStr = tagsList.join(',');

  const client = await db.pool.connect();
  const postId = crypto.randomUUID();

  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO posts (
        id, author_id, content, image_url, category, post_type, tags, visibility,
        job_title, company_name, job_location, employment_type, job_description, job_url,
        achievement_title, achievement_organization, achievement_description, achievement_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        postId, user.id, content || (postType === 'JOB' ? jobDescription : achievementDesc) || '',
        imageUrl, category, postType, tagsStr, visibility,
        jobTitle || null, companyName || null, jobLocation || null, employmentType || null, jobDescription || null, jobUrl || null,
        achievementTitle || null, achievementOrg || null, achievementDesc || null, achievementDate || null
      ]
    );

    for (const m of uploadedMediaRecords) {
      await client.query(
        `INSERT INTO post_media (post_id, media_type, storage_key, media_url, original_filename, mime_type, file_size)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [postId, m.mediaType, m.storageKey, m.mediaUrl, m.originalFilename, m.mimeType, m.fileSize]
      );
    }

    // Combine tagsList with inline hashtags extracted from content
    const allTagsSet = new Set();
    for (const tagRaw of tagsList) {
      const clean = tagRaw.replace(/^#/, '').trim().toLowerCase();
      if (clean) allTagsSet.add(clean);
    }
    const contentMatches = (content || '').match(/#[a-zA-Z0-9_]+/g);
    if (contentMatches) {
      for (const match of contentMatches) {
        const clean = match.replace(/^#/, '').trim().toLowerCase();
        if (clean) allTagsSet.add(clean);
      }
    }

    for (const cleanTag of allTagsSet) {
      const tagRes = await client.query(
        `INSERT INTO hashtags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [cleanTag]
      );
      const hashtagId = tagRes.rows[0].id;

      await client.query(
        `INSERT INTO post_hashtags (post_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [postId, hashtagId]
      );
    }

    await client.query('COMMIT');

    logger.block('POST', 'POST CREATION SUCCESS', {
      Author: user.email || user.id,
      'Post ID': postId,
      'Post Type': postType,
      Category: category,
      'Media Attached': uploadedMediaRecords.length,
      'Primary Media URL': imageUrl || 'NONE',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('POST', `Post creation failed for ${user.email || user.id}`, err);
    for (const m of uploadedMediaRecords) {
      await storageService.deleteFile(m.storageKey);
    }
    throw err;
  } finally {
    client.release();
  }

  const createdPost = await getPostById(user.id, postId);
  return createdPost ? (createdPost.post || createdPost) : null;
};

const getPosts = async (authUserId, queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page || 1, 10));
  const rawLimit = parseInt(queryParams.limit || 10, 10);
  const limit = Math.min(50, Math.max(1, isNaN(rawLimit) ? 10 : rawLimit));
  const offset = (page - 1) * limit;

  const whereClauses = [`u.account_status != 'DISABLED'`];
  const values = [];
  let paramIndex = 1;

  // Visibility clause: Public posts or author posts or accepted connection posts
  if (authUserId) {
    values.push(authUserId);
    whereClauses.push(`(
      po.visibility = 'PUBLIC' OR
      po.author_id = $${paramIndex} OR
      EXISTS (
        SELECT 1 FROM connections conn 
        WHERE ((conn.requester_id = $${paramIndex} AND conn.receiver_id = po.author_id) OR (conn.requester_id = po.author_id AND conn.receiver_id = $${paramIndex}))
        AND UPPER(conn.status) = 'ACCEPTED'
      )
    )`);
    paramIndex++;
  } else {
    whereClauses.push(`po.visibility = 'PUBLIC'`);
  }

  // Category filter mapping
  const categoryFilter = (queryParams.category || '').toLowerCase();
  if (categoryFilter && categoryFilter !== 'all' && categoryFilter !== 'saved') {
    if (categoryFilter === 'alumni') {
      whereClauses.push(`(UPPER(po.category) = 'ALUMNI' OR UPPER(u.role) = 'ALUMNI')`);
    } else if (categoryFilter === 'student') {
      whereClauses.push(`(UPPER(po.category) = 'STUDENT' OR UPPER(u.role) = 'STUDENT')`);
    } else if (categoryFilter === 'jobs') {
      whereClauses.push(`(UPPER(po.post_type) = 'JOB' OR UPPER(po.category) = 'JOBS')`);
    } else if (categoryFilter === 'achievements') {
      whereClauses.push(`(UPPER(po.post_type) = 'ACHIEVEMENT' OR UPPER(po.category) = 'ACHIEVEMENTS')`);
    }
  }

  // Search query filter
  if (queryParams.query && queryParams.query.trim() !== '') {
    const q = `%${queryParams.query.trim().toLowerCase()}%`;
    whereClauses.push(`(
      LOWER(po.content) LIKE $${paramIndex} OR
      LOWER(po.tags) LIKE $${paramIndex} OR
      LOWER(p.full_name) LIKE $${paramIndex} OR
      LOWER(po.job_title) LIKE $${paramIndex} OR
      LOWER(po.achievement_title) LIKE $${paramIndex}
    )`);
    values.push(q);
    paramIndex++;
  }

  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM posts po
    JOIN users u ON po.author_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ${whereString};
  `;
  const countResult = await db.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);
  const pages = Math.ceil(total / limit) || 1;

  values.push(authUserId || null);
  const authUserIdParamIdx = paramIndex;
  paramIndex++;

  values.push(limit, offset);
  const limitParamIdx = paramIndex;
  const offsetParamIdx = paramIndex + 1;

  const dataQuery = `
    SELECT po.*,
           u.email AS author_email, u.role AS author_role,
           p.full_name AS author_name, p.avatar_url AS author_avatar,
           p.degree AS author_degree, p.branch AS author_branch,
           p.graduation_year AS author_graduation_year,
           p.company AS author_company, p.designation AS author_designation,
           (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = po.id) AS likes_count,
           (SELECT COUNT(*) FROM comments c WHERE c.post_id = po.id) AS comments_count,
           EXISTS (
             SELECT 1 FROM post_likes pl2 WHERE pl2.post_id = po.id AND pl2.user_id = $${authUserIdParamIdx}
           ) AS is_liked_by_user
    FROM posts po
    JOIN users u ON po.author_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ${whereString}
    ORDER BY po.created_at DESC
    LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx};
  `;

  const dataResult = await db.query(dataQuery, values);
  const postRows = dataResult.rows;

  const postIds = postRows.map(r => r.id);
  let mediaMap = {};
  let hashtagMap = {};

  if (postIds.length > 0) {
    const mediaRes = await db.query(
      `SELECT * FROM post_media WHERE post_id = ANY($1::uuid[]) ORDER BY created_at ASC`,
      [postIds]
    ).catch(() => ({ rows: [] }));

    for (const m of mediaRes.rows) {
      if (!mediaMap[m.post_id]) mediaMap[m.post_id] = [];
      mediaMap[m.post_id].push(m);
    }

    const tagRes = await db.query(
      `SELECT ph.post_id, h.name FROM post_hashtags ph JOIN hashtags h ON ph.hashtag_id = h.id WHERE ph.post_id = ANY($1::uuid[])`,
      [postIds]
    ).catch(() => ({ rows: [] }));

    for (const t of tagRes.rows) {
      if (!hashtagMap[t.post_id]) hashtagMap[t.post_id] = [];
      hashtagMap[t.post_id].push(t);
    }
  }

  const posts = postRows.map((row) => formatPostDTO(row, mediaMap[row.id] || [], hashtagMap[row.id] || [], authUserId));

  return {
    posts,
    total,
    page,
    limit,
    pages,
    totalCount: total,
    totalPages: pages,
    hasMore: offset + limit < total,
  };
};

const getPostById = async (authUserId, postId) => {
  const queryText = `
    SELECT po.*,
           u.email AS author_email, u.role AS author_role,
           p.full_name AS author_name, p.avatar_url AS author_avatar,
           p.degree AS author_degree, p.branch AS author_branch,
           p.graduation_year AS author_graduation_year,
           p.company AS author_company, p.designation AS author_designation,
           (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = po.id) AS likes_count,
           (SELECT COUNT(*) FROM comments c WHERE c.post_id = po.id) AS comments_count,
           EXISTS (
             SELECT 1 FROM post_likes pl2 WHERE pl2.post_id = po.id AND pl2.user_id = $2
           ) AS is_liked_by_user
    FROM posts po
    JOIN users u ON po.author_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE po.id = $1;
  `;

  const result = await db.query(queryText, [postId, authUserId]);

  if (result.rows.length === 0) {
    const err = new Error(`Post not found with ID '${postId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const row = result.rows[0];

  const hasAccess = await verifyPostAccess(authUserId, row);
  if (!hasAccess) {
    const err = new Error('Access denied: You must be connected with the author to view this post');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const mediaRes = await db.query(`SELECT * FROM post_media WHERE post_id = $1 ORDER BY created_at ASC`, [postId]).catch(() => ({ rows: [] }));
  const tagRes = await db.query(`SELECT ph.post_id, h.name FROM post_hashtags ph JOIN hashtags h ON ph.hashtag_id = h.id WHERE ph.post_id = $1`, [postId]).catch(() => ({ rows: [] }));

  const post = formatPostDTO(row, mediaRes.rows, tagRes.rows, authUserId);
  return { post };
};

const updatePost = async (user, postId, updateData) => {
  const postRes = await db.query('SELECT * FROM posts WHERE id = $1', [postId]);

  if (postRes.rows.length === 0) {
    const err = new Error(`Post not found with ID '${postId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const post = postRes.rows[0];
  if (post.author_id !== user.id && (user.role || '').toUpperCase() !== 'ADMIN') {
    const err = new Error('Only the author or admin can edit this post');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const content = (updateData.content !== undefined ? updateData.content : post.content).trim();
  const visibility = updateData.visibility || post.visibility || 'PUBLIC';
  const tagsStr = Array.isArray(updateData.tags) ? updateData.tags.join(',') : (updateData.tags || post.tags);

  const jobTitle = updateData.jobTitle !== undefined ? updateData.jobTitle : post.job_title;
  const companyName = updateData.companyName !== undefined ? updateData.companyName : post.company_name;
  const jobLocation = updateData.jobLocation !== undefined ? updateData.jobLocation : post.job_location;
  const employmentType = updateData.employmentType !== undefined ? updateData.employmentType : post.employment_type;
  const jobDescription = updateData.jobDescription !== undefined ? updateData.jobDescription : post.job_description;
  const jobUrl = updateData.jobUrl !== undefined ? updateData.jobUrl : post.job_url;

  const achievementTitle = updateData.achievementTitle !== undefined ? updateData.achievementTitle : post.achievement_title;
  const achievementOrg = updateData.achievementOrganization !== undefined ? updateData.achievementOrganization : post.achievement_organization;
  const achievementDesc = updateData.achievementDescription !== undefined ? updateData.achievementDescription : post.achievement_description;
  const achievementDate = updateData.achievementDate !== undefined ? updateData.achievementDate : post.achievement_date;

  await db.query(
    `UPDATE posts SET
      content = $1, tags = $2, visibility = $3,
      job_title = $4, company_name = $5, job_location = $6, employment_type = $7, job_description = $8, job_url = $9,
      achievement_title = $10, achievement_organization = $11, achievement_description = $12, achievement_date = $13,
      updated_at = NOW()
     WHERE id = $14`,
    [
      content, tagsStr, visibility,
      jobTitle, companyName, jobLocation, employmentType, jobDescription, jobUrl,
      achievementTitle, achievementOrg, achievementDesc, achievementDate,
      postId
    ]
  );

  return getPostById(user.id, postId);
};

const deletePost = async (user, postId) => {
  const postRes = await db.query('SELECT * FROM posts WHERE id = $1', [postId]);

  if (postRes.rows.length === 0) {
    const err = new Error(`Post not found with ID '${postId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const post = postRes.rows[0];
  if (post.author_id !== user.id && (user.role || '').toUpperCase() !== 'ADMIN') {
    const err = new Error('Only the author or admin can delete this post');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const mediaRes = await db.query('SELECT storage_key FROM post_media WHERE post_id = $1', [postId]).catch(() => ({ rows: [] }));
  for (const m of mediaRes.rows) {
    if (m.storage_key) {
      await storageService.deleteFile(m.storage_key);
    }
  }

  await db.query('DELETE FROM posts WHERE id = $1', [postId]);
  return { success: true, message: 'Post deleted successfully' };
};

const toggleLikePost = async (user, postId) => {
  if (user.account_status === 'DISABLED') {
    const err = new Error('Disabled accounts cannot like posts');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  const postRes = await db.query('SELECT id, author_id, visibility FROM posts WHERE id = $1', [postId]);
  if (postRes.rows.length === 0) {
    const err = new Error(`Post not found with ID '${postId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const post = postRes.rows[0];

  const hasAccess = await verifyPostAccess(user.id, post);
  if (!hasAccess) {
    const err = new Error('Access denied: You must be connected with the author to like this post');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const existingLike = await db.query(
    'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2',
    [postId, user.id]
  );

  let isLiked = false;
  if (existingLike.rows.length > 0) {
    await db.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, user.id]);
    isLiked = false;
  } else {
    await db.query(
      `INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT (post_id, user_id) DO NOTHING`,
      [postId, user.id]
    );
    isLiked = true;

    if (post.author_id !== user.id) {
      const actorName = await getUserName(user.id);
      await notificationService.createNotification({
        recipientId: post.author_id,
        actorId: user.id,
        type: 'POST_LIKE',
        title: 'New Like on Your Post',
        message: `${actorName} liked your post.`,
        entityType: 'POST',
        entityId: postId,
      }).catch((e) => console.warn('Failed to send post like notification:', e.message));
    }
  }

  const likesCountRes = await db.query('SELECT COUNT(*) AS count FROM post_likes WHERE post_id = $1', [postId]);
  const likesCount = parseInt(likesCountRes.rows[0].count, 10);

  return {
    success: true,
    liked: isLiked,
    isLiked: isLiked,
    likedByCurrentUser: isLiked,
    likeCount: likesCount,
    likesCount: likesCount,
    likes: likesCount,
  };
};

const addComment = async (user, postId, commentData) => {
  if (user.account_status === 'DISABLED') {
    const err = new Error('Disabled accounts cannot post comments');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  const content = (commentData.content || commentData.text || '').trim();
  if (!content) {
    const err = new Error('Comment content cannot be empty');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const parentCommentId = commentData.parentCommentId || commentData.parent_comment_id || null;

  const postRes = await db.query('SELECT id, author_id, visibility FROM posts WHERE id = $1', [postId]);
  if (postRes.rows.length === 0) {
    const err = new Error(`Post not found with ID '${postId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const post = postRes.rows[0];

  const hasAccess = await verifyPostAccess(user.id, post);
  if (!hasAccess) {
    const err = new Error('Access denied: You must be connected with the author to comment on this post');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  if (parentCommentId) {
    const parentRes = await db.query('SELECT id, author_id FROM comments WHERE id = $1 AND post_id = $2', [parentCommentId, postId]);
    if (parentRes.rows.length === 0) {
      const err = new Error('Parent comment not found');
      err.statusCode = 404;
      err.errorCode = 'RESOURCE_NOT_FOUND';
      throw err;
    }
  }

  const commentId = crypto.randomUUID();
  await db.query(
    `INSERT INTO comments (id, post_id, author_id, parent_comment_id, content) VALUES ($1, $2, $3, $4, $5)`,
    [commentId, postId, user.id, parentCommentId, content]
  );

  if (post.author_id !== user.id) {
    const actorName = await getUserName(user.id);
    await notificationService.createNotification({
      recipientId: post.author_id,
      actorId: user.id,
      type: 'POST_COMMENT',
      title: parentCommentId ? 'New Reply on Your Post' : 'New Comment on Your Post',
      message: `${actorName} ${parentCommentId ? 'replied' : 'commented'} on your post: "${content.substring(0, 40)}..."`,
      entityType: 'POST',
      entityId: postId,
    }).catch((e) => console.warn('Failed to send comment notification:', e.message));
  }

  const authorRes = await db.query(
    `SELECT p.full_name, p.avatar_url, p.company, p.designation, p.degree, p.branch, u.role, u.email
     FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1`,
    [user.id]
  );

  const authorRow = authorRes.rows[0] || {};
  const isAlumni = (authorRow.role || '').toUpperCase() === 'ALUMNI';
  const avatar = getFullMediaUrl(authorRow.avatar_url);
  const authorName = authorRow.full_name || (authorRow.email ? authorRow.email.split('@')[0] : 'JECRC Member');
  const headline = authorRow.designation
    ? `${authorRow.designation}${authorRow.company ? ` @ ${authorRow.company}` : ''}`
    : (authorRow.degree ? `${authorRow.degree} ${authorRow.branch || ''}` : 'JECRC Member');

  const commentObj = {
    id: commentId,
    postId,
    parentCommentId,
    authorId: user.id,
    authorName,
    authorAvatar: avatar,
    authorRole: (authorRow.role || 'STUDENT').toLowerCase(),
    isAlumni,
    content,
    edited: false,
    likeCount: 0,
    likesCount: 0,
    likedByCurrentUser: false,
    likedByMe: false,
    replyCount: 0,
    replies: [],
    createdAt: formatTimeAgo(new Date()),
    createdAtRaw: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: {
      id: user.id,
      name: authorName,
      profilePhotoUrl: avatar,
      avatar: avatar,
      avatarUrl: avatar,
      role: (authorRow.role || 'STUDENT').toLowerCase(),
      headline,
      isAlumni,
    },
  };

  const countRes = await db.query('SELECT COUNT(*) AS count FROM comments WHERE post_id = $1', [postId]);
  const commentsCount = parseInt(countRes.rows[0].count, 10);

  return {
    success: true,
    comment: commentObj,
    commentsCount: commentsCount,
  };
};

const getCommentsByPostId = async (postId, authUserId = null, queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page || 1, 10));
  const rawLimit = parseInt(queryParams.limit || 10, 10);
  const limit = Math.min(50, Math.max(1, isNaN(rawLimit) ? 10 : rawLimit));
  const offset = (page - 1) * limit;

  const sort = (queryParams.sort || 'recent').toLowerCase();

  let orderBy = 'c.is_pinned DESC, c.created_at DESC, c.id DESC';
  if (sort === 'oldest') {
    orderBy = 'c.is_pinned DESC, c.created_at ASC, c.id ASC';
  } else if (sort === 'popular' || sort === 'likes' || sort === 'most_liked') {
    orderBy = 'c.is_pinned DESC, like_count DESC, c.created_at DESC, c.id DESC';
  }

  const totalPostCommentsRes = await db.query('SELECT COUNT(*) AS total FROM comments WHERE post_id = $1', [postId]);
  const totalPostComments = parseInt(totalPostCommentsRes.rows[0].total, 10);

  const totalTopCommentsRes = await db.query('SELECT COUNT(*) AS total FROM comments WHERE post_id = $1 AND parent_comment_id IS NULL', [postId]);
  const totalTopComments = parseInt(totalTopCommentsRes.rows[0].total, 10);

  const queryText = `
    SELECT c.id, c.post_id, c.author_id, c.parent_comment_id, c.content, c.is_pinned, c.created_at, c.updated_at,
           u.email AS author_email, u.role AS author_role,
           p.full_name AS author_name, p.avatar_url AS author_avatar,
           p.company AS author_company, p.designation AS author_designation,
           p.degree AS author_degree, p.branch AS author_branch,
           (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) AS like_count,
           (SELECT COUNT(*) FROM comments r WHERE r.parent_comment_id = c.id) AS reply_count
           ${authUserId ? `, EXISTS (SELECT 1 FROM comment_likes cl2 WHERE cl2.comment_id = c.id AND cl2.user_id = $2) AS liked_by_me` : ', FALSE AS liked_by_me'}
    FROM comments c
    JOIN users u ON c.author_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE c.post_id = $1
    ORDER BY ${orderBy};
  `;

  const queryValues = authUserId ? [postId, authUserId] : [postId];
  const result = await db.query(queryText, queryValues);

  const allRows = result.rows;

  const formatCommentRow = (row) => {
    const isAlumni = (row.author_role || '').toUpperCase() === 'ALUMNI';
    const avatar = getFullMediaUrl(row.author_avatar);
    const authorName = row.author_name || (row.author_email ? row.author_email.split('@')[0] : 'JECRC Member');
    const headline = row.author_designation
      ? `${row.author_designation}${row.author_company ? ` @ ${row.author_company}` : ''}`
      : (row.author_degree ? `${row.author_degree} ${row.author_branch || ''}` : 'JECRC Member');

    const createdTime = new Date(row.created_at).getTime();
    const updatedTime = new Date(row.updated_at).getTime();
    const edited = updatedTime - createdTime > 5000;

    return {
      id: row.id,
      postId: row.post_id,
      parentCommentId: row.parent_comment_id || null,
      authorId: row.author_id,
      authorName: authorName,
      authorAvatar: avatar,
      authorRole: (row.author_role || 'STUDENT').toLowerCase(),
      isAlumni: isAlumni,
      content: row.content,
      isPinned: Boolean(row.is_pinned),
      edited: edited,
      likeCount: parseInt(row.like_count || 0, 10),
      likesCount: parseInt(row.like_count || 0, 10),
      likedByCurrentUser: Boolean(row.liked_by_me),
      likedByMe: Boolean(row.liked_by_me),
      replyCount: parseInt(row.reply_count || 0, 10),
      createdAt: formatTimeAgo(row.created_at),
      createdAtRaw: row.created_at,
      updatedAt: row.updated_at,
      author: {
        id: row.author_id,
        name: authorName,
        profilePhotoUrl: avatar,
        avatar: avatar,
        avatarUrl: avatar,
        role: (row.author_role || 'STUDENT').toLowerCase(),
        headline: headline,
        isAlumni: isAlumni,
      },
      replies: [],
    };
  };

  const formattedMap = {};
  const topLevelComments = [];
  const repliesGrouped = {};

  for (const row of allRows) {
    const formatted = formatCommentRow(row);
    formattedMap[formatted.id] = formatted;

    if (!row.parent_comment_id) {
      topLevelComments.push(formatted);
    } else {
      if (!repliesGrouped[row.parent_comment_id]) {
        repliesGrouped[row.parent_comment_id] = [];
      }
      repliesGrouped[row.parent_comment_id].push(formatted);
    }
  }

  for (const parentId in repliesGrouped) {
    if (formattedMap[parentId]) {
      formattedMap[parentId].replies = repliesGrouped[parentId];
    }
  }

  const paginatedTopComments = topLevelComments.slice(offset, offset + limit);

  return {
    comments: paginatedTopComments,
    allComments: paginatedTopComments,
    total: totalPostComments,
    totalCount: totalPostComments,
    totalTopLevel: totalTopComments,
    page: page,
    limit: limit,
    hasMore: offset + limit < topLevelComments.length,
  };
};

const updateComment = async (user, commentId, data) => {
  const content = (data.content || data.text || '').trim();
  if (!content) {
    const err = new Error('Comment content cannot be empty');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const commRes = await db.query('SELECT * FROM comments WHERE id = $1', [commentId]);
  if (commRes.rows.length === 0) {
    const err = new Error('Comment not found');
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const comment = commRes.rows[0];
  if (comment.author_id !== user.id && (user.role || '').toUpperCase() !== 'ADMIN') {
    const err = new Error('Only the author or admin can edit this comment');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  await db.query('UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2', [content, commentId]);

  return { success: true, message: 'Comment updated successfully', content };
};

const deleteComment = async (user, postId, commentId) => {
  const targetId = commentId || postId;
  const commRes = await db.query('SELECT * FROM comments WHERE id = $1', [targetId]);
  if (commRes.rows.length === 0) {
    const err = new Error(`Comment not found`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const comment = commRes.rows[0];
  if (comment.author_id !== user.id && (user.role || '').toUpperCase() !== 'ADMIN') {
    const err = new Error('Only the author or admin can delete this comment');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  await db.query('DELETE FROM comments WHERE id = $1', [targetId]);
  return { success: true, message: 'Comment deleted successfully' };
};

const toggleLikeComment = async (user, commentId) => {
  const commRes = await db.query('SELECT id FROM comments WHERE id = $1', [commentId]);
  if (commRes.rows.length === 0) {
    const err = new Error('Comment not found');
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const likeCheck = await db.query('SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, user.id]);
  let isLiked = false;

  if (likeCheck.rows.length > 0) {
    await db.query('DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, user.id]);
    isLiked = false;
  } else {
    await db.query('INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [commentId, user.id]);
    isLiked = true;
  }

  const countRes = await db.query('SELECT COUNT(*) AS count FROM comment_likes WHERE comment_id = $1', [commentId]);
  const likeCount = parseInt(countRes.rows[0].count, 10);

  return {
    success: true,
    liked: isLiked,
    isLiked: isLiked,
    likedByCurrentUser: isLiked,
    likedByMe: isLiked,
    likeCount: likeCount,
    likesCount: likeCount,
  };
};

const togglePinComment = async (user, commentId) => {
  const commRes = await db.query('SELECT id, post_id, is_pinned FROM comments WHERE id = $1', [commentId]);
  if (commRes.rows.length === 0) {
    const err = new Error('Comment not found');
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const comment = commRes.rows[0];
  const postRes = await db.query('SELECT author_id FROM posts WHERE id = $1', [comment.post_id]);
  if (postRes.rows.length === 0) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const postAuthorId = postRes.rows[0].author_id;
  const isPostOwner = postAuthorId === user.id;
  const isAdmin = (user.role || '').toUpperCase() === 'ADMIN';

  if (!isPostOwner && !isAdmin) {
    const err = new Error('Only the post author or an Admin can pin/unpin comments');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const currentlyPinned = Boolean(comment.is_pinned);
  const newPinnedState = !currentlyPinned;

  if (newPinnedState) {
    // Unpin any previously pinned comment for this post (max 1 pinned comment per post)
    await db.query('UPDATE comments SET is_pinned = FALSE WHERE post_id = $1 AND is_pinned = TRUE', [comment.post_id]);
    await db.query('UPDATE comments SET is_pinned = TRUE WHERE id = $1', [commentId]);
  } else {
    await db.query('UPDATE comments SET is_pinned = FALSE WHERE id = $1', [commentId]);
  }

  return {
    success: true,
    commentId,
    isPinned: newPinnedState,
    message: newPinnedState ? 'Comment pinned successfully' : 'Comment unpinned successfully',
  };
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLikePost,
  addComment,
  getCommentsByPostId,
  updateComment,
  deleteComment,
  toggleLikeComment,
  togglePinComment,
};
