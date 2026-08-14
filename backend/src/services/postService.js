const crypto = require('crypto');
const db = require('../config/db');
const notificationService = require('./notificationService');

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
    avatar: row.author_avatar || (isAlumni
      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'),
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

const formatPostDTO = (row, authUserId = null) => {
  const tags = parseTags(row.tags);
  const likesCount = parseInt(row.likes_count || '0', 10);
  const commentsCount = parseInt(row.comments_count || '0', 10);
  const isLiked = row.is_liked_by_user === true || row.is_liked_by_user === 'true' || row.is_liked_by_user === 1;

  return {
    id: row.id,
    authorId: row.author_id,
    author: formatAuthor(row),
    content: row.content,
    image: row.image_url || null,
    imageUrl: row.image_url || null,
    category: (row.category || 'all').toLowerCase(),
    type: row.post_type || 'TEXT',
    tags: tags.length > 0 ? tags : ['#JECRC'],
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

const createPost = async (user, postData) => {
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

  const content = (postData.content || '').trim();
  if (!content) {
    const err = new Error('Post content cannot be empty');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  if (content.length > 5000) {
    const err = new Error('Post content exceeds maximum length of 5000 characters');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const imageUrl = postData.imageUrl || postData.image || null;
  const rawCat = (postData.category || '').toUpperCase();
  const category = ['ALUMNI', 'STUDENT', 'JOBS', 'ACHIEVEMENTS'].includes(rawCat)
    ? rawCat
    : (user.role.toUpperCase() === 'ALUMNI' ? 'ALUMNI' : 'STUDENT');

  const postType = (postData.type || postData.postType || 'TEXT').toUpperCase();
  const tagsStr = Array.isArray(postData.tags) ? postData.tags.join(',') : (postData.tags || '#JECRC');

  const postId = crypto.randomUUID();
  await db.query(
    `INSERT INTO posts (id, author_id, content, image_url, category, post_type, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [postId, user.id, content, imageUrl, category, postType, tagsStr]
  );

  return getPostById(user.id, postId);
};

const getPosts = async (authUserId, queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page || 1, 10));
  const rawLimit = parseInt(queryParams.limit || 10, 10);
  const limit = Math.min(50, Math.max(1, isNaN(rawLimit) ? 10 : rawLimit));
  const offset = (page - 1) * limit;

  const whereClauses = [`u.account_status != 'DISABLED'`];
  const values = [];
  let paramIndex = 1;

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
      LOWER(p.full_name) LIKE $${paramIndex}
    )`);
    values.push(q);
    paramIndex++;
  }

  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count total matching posts
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM posts po
    JOIN users u ON po.author_id = u.id
    ${whereString};
  `;
  const countResult = await db.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);
  const pages = Math.ceil(total / limit) || 1;

  // Auth User param index for IsLiked
  values.push(authUserId);
  const authUserIdParamIdx = paramIndex;
  paramIndex++;

  values.push(limit, offset);
  const limitParamIdx = paramIndex;
  const offsetParamIdx = paramIndex + 1;

  const dataQuery = `
    SELECT po.id, po.author_id, po.content, po.image_url, po.category, po.post_type,
           po.tags, po.created_at, po.updated_at,
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
  const posts = dataResult.rows.map((row) => formatPostDTO(row, authUserId));

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
    SELECT po.id, po.author_id, po.content, po.image_url, po.category, po.post_type,
           po.tags, po.created_at, po.updated_at,
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

  const post = formatPostDTO(result.rows[0], authUserId);
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
  if (post.author_id !== user.id) {
    const err = new Error('Only the author can edit this post');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const content = (updateData.content || post.content).trim();
  if (!content) {
    const err = new Error('Post content cannot be empty');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const tagsStr = Array.isArray(updateData.tags) ? updateData.tags.join(',') : (updateData.tags || post.tags);

  await db.query(
    `UPDATE posts SET content = $1, tags = $2, updated_at = NOW() WHERE id = $3`,
    [content, tagsStr, postId]
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
  if (post.author_id !== user.id) {
    const err = new Error('Only the author can delete this post');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
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

  const postRes = await db.query('SELECT id, author_id FROM posts WHERE id = $1', [postId]);
  if (postRes.rows.length === 0) {
    const err = new Error(`Post not found with ID '${postId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const post = postRes.rows[0];
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

    // Trigger Notification for Post Author
    const likerName = await getUserName(user.id);
    await notificationService.createNotification({
      recipientId: post.author_id,
      actorId: user.id,
      type: 'POST_LIKED',
      title: 'Post liked',
      message: `${likerName} liked your post`,
      entityType: 'POST',
      entityId: postId,
    });
  }

  const countRes = await db.query('SELECT COUNT(*) AS count FROM post_likes WHERE post_id = $1', [postId]);
  const likesCount = parseInt(countRes.rows[0].count, 10);

  return {
    postId,
    isLiked,
    likedByCurrentUser: isLiked,
    likes: likesCount,
    likesCount: likesCount,
  };
};

const addComment = async (user, postId, commentData) => {
  if (user.account_status === 'DISABLED') {
    const err = new Error('Disabled accounts cannot comment on posts');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  const postRes = await db.query('SELECT id, author_id FROM posts WHERE id = $1', [postId]);
  if (postRes.rows.length === 0) {
    const err = new Error(`Post not found with ID '${postId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const post = postRes.rows[0];
  const content = (commentData.text || commentData.content || '').trim();
  if (!content) {
    const err = new Error('Comment text cannot be empty');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  if (content.length > 1000) {
    const err = new Error('Comment exceeds maximum length of 1000 characters');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const parentCommentId = commentData.parentCommentId || null;
  let parentCommentAuthorId = null;

  if (parentCommentId) {
    const parentCheck = await db.query('SELECT author_id FROM comments WHERE id = $1', [parentCommentId]);
    if (parentCheck.rows.length > 0) {
      parentCommentAuthorId = parentCheck.rows[0].author_id;
    }
  }

  const commentId = crypto.randomUUID();
  await db.query(
    `INSERT INTO comments (id, post_id, author_id, parent_comment_id, content)
     VALUES ($1, $2, $3, $4, $5)`,
    [commentId, postId, user.id, parentCommentId, content]
  );

  // Trigger Notification
  const commenterName = await getUserName(user.id);
  const targetRecipientId = parentCommentAuthorId || post.author_id;
  const notifType = parentCommentId ? 'POST_REPLY' : 'POST_COMMENTED';
  const notifTitle = parentCommentId ? 'New reply to comment' : 'New comment on post';
  const notifMessage = `${commenterName} ${parentCommentId ? 'replied to your comment' : 'commented on your post'}`;

  await notificationService.createNotification({
    recipientId: targetRecipientId,
    actorId: user.id,
    type: notifType,
    title: notifTitle,
    message: notifMessage,
    entityType: 'POST',
    entityId: postId,
  });

  const countRes = await db.query('SELECT COUNT(*) AS count FROM comments WHERE post_id = $1', [postId]);
  const commentsCount = parseInt(countRes.rows[0].count, 10);

  // Fetch created comment with author info
  const commentRow = await db.query(
    `SELECT c.id, c.post_id, c.author_id, c.parent_comment_id, c.content, c.created_at,
            u.email AS author_email, u.role AS author_role,
            p.full_name AS author_name, p.avatar_url AS author_avatar,
            p.degree AS author_degree, p.branch AS author_branch,
            p.graduation_year AS author_graduation_year,
            p.company AS author_company, p.designation AS author_designation
     FROM comments c
     JOIN users u ON c.author_id = u.id
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE c.id = $1`,
    [commentId]
  );

  const row = commentRow.rows[0];
  const comment = {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    author: formatAuthor(row),
    content: row.content,
    text: row.content,
    createdAt: formatTimeAgo(row.created_at),
    createdAtRaw: row.created_at,
    likes: 0,
    likedByCurrentUser: false,
    replies: [],
  };

  return { comment, commentsCount };
};

const getCommentsByPostId = async (postId) => {
  const postRes = await db.query('SELECT id FROM posts WHERE id = $1', [postId]);
  if (postRes.rows.length === 0) {
    const err = new Error(`Post not found with ID '${postId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const result = await db.query(
    `SELECT c.id, c.post_id, c.author_id, c.parent_comment_id, c.content, c.created_at,
            u.email AS author_email, u.role AS author_role,
            p.full_name AS author_name, p.avatar_url AS author_avatar,
            p.degree AS author_degree, p.branch AS author_branch,
            p.graduation_year AS author_graduation_year,
            p.company AS author_company, p.designation AS author_designation
     FROM comments c
     JOIN users u ON c.author_id = u.id
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC`,
    [postId]
  );

  const commentsMap = new Map();
  const topLevelComments = [];

  result.rows.forEach((row) => {
    const comment = {
      id: row.id,
      postId: row.post_id,
      authorId: row.author_id,
      parentCommentId: row.parent_comment_id,
      author: formatAuthor(row),
      content: row.content,
      text: row.content,
      createdAt: formatTimeAgo(row.created_at),
      likes: 0,
      likedByCurrentUser: false,
      replies: [],
    };

    commentsMap.set(row.id, comment);

    if (!row.parent_comment_id) {
      topLevelComments.push(comment);
    }
  });

  // Attach single-level replies to parent comments
  result.rows.forEach((row) => {
    if (row.parent_comment_id && commentsMap.has(row.parent_comment_id)) {
      commentsMap.get(row.parent_comment_id).replies.push(commentsMap.get(row.id));
    }
  });

  return { comments: topLevelComments, total: result.rows.length };
};

const deleteComment = async (user, postId, commentId) => {
  const commentRes = await db.query('SELECT * FROM comments WHERE id = $1 AND post_id = $2', [commentId, postId]);

  if (commentRes.rows.length === 0) {
    const err = new Error(`Comment not found with ID '${commentId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const comment = commentRes.rows[0];
  if (comment.author_id !== user.id) {
    const err = new Error('Only the author can delete this comment');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  await db.query('DELETE FROM comments WHERE id = $1', [commentId]);

  const countRes = await db.query('SELECT COUNT(*) AS count FROM comments WHERE post_id = $1', [postId]);
  const commentsCount = parseInt(countRes.rows[0].count, 10);

  return { success: true, message: 'Comment deleted successfully', commentsCount };
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
  deleteComment,
};
