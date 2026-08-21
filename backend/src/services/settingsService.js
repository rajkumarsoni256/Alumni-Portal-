const bcrypt = require('bcryptjs');
const db = require('../config/db');
const emailService = require('../email/emailService');

const ALLOWED_VISIBILITY = ['EVERYONE', 'COMMUNITY', 'CONNECTIONS', 'ONLY_ME'];
const ALLOWED_MESSAGES_FROM = ['EVERYONE', 'CONNECTIONS'];
const ALLOWED_CONN_REQ_FROM = ['EVERYONE', 'COMMUNITY', 'NOBODY'];
const ALLOWED_THEMES = ['LIGHT', 'DARK', 'SYSTEM'];
const ALLOWED_CAREER_STATUS = ['OPEN_TO_INTERNSHIPS', 'OPEN_TO_FULLTIME', 'NOT_LOOKING'];

const parseList = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  return String(input).split(/\s*,\s*/).filter(Boolean);
};

const formatSettingsDTO = (row, userRow = {}, sessionsCount = 1) => {
  return {
    account: {
      email: userRow.email || row.email || '',
      emailVerified: userRow.email_verified !== false,
      role: (userRow.role || 'STUDENT').toLowerCase(),
      roleUpper: (userRow.role || 'STUDENT').toUpperCase(),
      accountStatus: userRow.account_status || 'ACTIVE',
      twoFactorEnabled: Boolean(row.two_factor_enabled),
      activeSessionsCount: sessionsCount,
    },
    privacy: {
      profileVisibility: row.profile_visibility || 'COMMUNITY',
      emailVisibility: row.email_visibility || 'CONNECTIONS',
      phoneVisibility: row.phone_visibility || 'ONLY_ME',
      connectionsVisibility: row.connections_visibility || 'COMMUNITY',
      searchVisibility: Boolean(row.search_visibility),
      directoryVisibility: Boolean(row.directory_visibility),
      onlineStatusVisible: Boolean(row.online_status_visible),
      mentorshipVisibility: Boolean(row.mentorship_visibility),
    },
    notifications: {
      postLikes: Boolean(row.post_like_notifications),
      postComments: Boolean(row.post_comment_notifications),
      commentReplies: Boolean(row.comment_reply_notifications),
      mentions: Boolean(row.mention_notifications),
      postShares: Boolean(row.post_share_notifications),
      connectionRequests: Boolean(row.connection_request_notifications),
      connectionAccepted: Boolean(row.connection_accepted_notifications),
      messages: Boolean(row.message_notifications),
      jobs: Boolean(row.job_notifications),
      events: Boolean(row.event_notifications),
      mentorship: Boolean(row.mentorship_notifications),
      emailNotifications: Boolean(row.email_notifications),
      pushNotifications: Boolean(row.push_notifications),
    },
    messaging: {
      allowMessagesFrom: row.allow_messages_from || 'CONNECTIONS',
      allowConnectionRequestsFrom: row.allow_connection_requests_from || 'EVERYONE',
      showReadReceipts: Boolean(row.show_read_receipts),
      showTypingIndicator: Boolean(row.show_typing_indicator),
      onlineStatusVisible: Boolean(row.online_status_visible),
    },
    career: {
      careerStatus: row.career_status || 'OPEN_TO_FULLTIME',
      workTypeRemote: Boolean(row.work_type_remote),
      workTypeHybrid: Boolean(row.work_type_hybrid),
      workTypeOnsite: Boolean(row.work_type_onsite),
      preferredRoles: parseList(row.preferred_roles),
      preferredLocations: parseList(row.preferred_locations),
      mentorshipTopics: parseList(row.mentorship_topics),
      lookingForMentor: Boolean(row.mentorship_visibility),
    },
    alumni: {
      showCompany: Boolean(row.show_company),
      showDesignation: Boolean(row.show_designation),
      showLocation: Boolean(row.show_location),
      availableAsMentor: Boolean(row.mentorship_visibility),
      mentorshipTopics: parseList(row.mentorship_topics),
    },
    appearance: {
      theme: row.theme || 'SYSTEM',
    },
  };
};

const getOrCreateUserSettings = async (userId) => {
  let settingsRes = await db.query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
  if (settingsRes.rows.length === 0) {
    await db.query('INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId]);
    settingsRes = await db.query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
  }
  return settingsRes.rows[0];
};

const getSettings = async (user) => {
  const settingsRow = await getOrCreateUserSettings(user.id);
  const userRes = await db.query('SELECT id, email, role, email_verified, account_status FROM users WHERE id = $1', [user.id]);
  const userRow = userRes.rows[0] || user;

  const sessionsRes = await db.query(
    `SELECT COUNT(*) AS count FROM user_sessions WHERE user_id = $1 AND is_active = TRUE`,
    [user.id]
  );
  const sessionsCount = Math.max(1, parseInt(sessionsRes.rows[0]?.count || 1, 10));

  return getSettingsDTO(settingsRow, userRow, sessionsCount);
};

const getSettingsDTO = (settingsRow, userRow, sessionsCount) => formatSettingsDTO(settingsRow, userRow, sessionsCount);

const updateSettings = async (user, patchData) => {
  const current = await getOrCreateUserSettings(user.id);

  const setClause = [];
  const values = [user.id];
  let idx = 2;

  const addField = (colName, value) => {
    if (value !== undefined && value !== null) {
      setClause.push(`${colName} = $${idx}`);
      values.push(value);
      idx++;
    }
  };

  // 1. Privacy Section
  if (patchData.profileVisibility) {
    const val = String(patchData.profileVisibility).toUpperCase();
    if (ALLOWED_VISIBILITY.includes(val)) addField('profile_visibility', val);
  }
  if (patchData.emailVisibility) {
    const val = String(patchData.emailVisibility).toUpperCase();
    if (ALLOWED_VISIBILITY.includes(val)) addField('email_visibility', val);
  }
  if (patchData.phoneVisibility) {
    const val = String(patchData.phoneVisibility).toUpperCase();
    if (ALLOWED_VISIBILITY.includes(val)) addField('phone_visibility', val);
  }
  if (patchData.connectionsVisibility) {
    const val = String(patchData.connectionsVisibility).toUpperCase();
    if (ALLOWED_VISIBILITY.includes(val)) addField('connections_visibility', val);
  }

  addField('search_visibility', patchData.searchVisibility);
  addField('directory_visibility', patchData.directoryVisibility);
  addField('online_status_visible', patchData.onlineStatusVisible);
  addField('mentorship_visibility', patchData.mentorshipVisibility);

  // 2. Messaging Section
  if (patchData.allowMessagesFrom) {
    const val = String(patchData.allowMessagesFrom).toUpperCase();
    if (ALLOWED_MESSAGES_FROM.includes(val)) addField('allow_messages_from', val);
  }
  if (patchData.allowConnectionRequestsFrom) {
    const val = String(patchData.allowConnectionRequestsFrom).toUpperCase();
    if (ALLOWED_CONN_REQ_FROM.includes(val)) addField('allow_connection_requests_from', val);
  }
  addField('show_read_receipts', patchData.showReadReceipts);
  addField('show_typing_indicator', patchData.showTypingIndicator);

  // 3. Notifications Section
  addField('post_like_notifications', patchData.postLikes);
  addField('post_comment_notifications', patchData.postComments);
  addField('comment_reply_notifications', patchData.commentReplies);
  addField('mention_notifications', patchData.mentions);
  addField('post_share_notifications', patchData.postShares);
  addField('connection_request_notifications', patchData.connectionRequests);
  addField('connection_accepted_notifications', patchData.connectionAccepted);
  addField('message_notifications', patchData.messages);
  addField('job_notifications', patchData.jobs);
  addField('event_notifications', patchData.events);
  addField('mentorship_notifications', patchData.mentorship);
  addField('email_notifications', patchData.emailNotifications);
  addField('push_notifications', patchData.pushNotifications);

  // 4. Career & Alumni Section
  if (patchData.careerStatus) {
    const val = String(patchData.careerStatus).toUpperCase();
    if (ALLOWED_CAREER_STATUS.includes(val)) addField('career_status', val);
  }
  addField('work_type_remote', patchData.workTypeRemote);
  addField('work_type_hybrid', patchData.workTypeHybrid);
  addField('work_type_onsite', patchData.workTypeOnsite);

  if (patchData.preferredRoles !== undefined) {
    addField('preferred_roles', Array.isArray(patchData.preferredRoles) ? patchData.preferredRoles.join(', ') : patchData.preferredRoles);
  }
  if (patchData.preferredLocations !== undefined) {
    addField('preferred_locations', Array.isArray(patchData.preferredLocations) ? patchData.preferredLocations.join(', ') : patchData.preferredLocations);
  }
  if (patchData.mentorshipTopics !== undefined) {
    addField('mentorship_topics', Array.isArray(patchData.mentorshipTopics) ? patchData.mentorshipTopics.join(', ') : patchData.mentorshipTopics);
  }

  addField('show_company', patchData.showCompany);
  addField('show_designation', patchData.showDesignation);
  addField('show_location', patchData.showLocation);
  addField('two_factor_enabled', patchData.twoFactorEnabled);

  // 5. Appearance
  if (patchData.theme) {
    const val = String(patchData.theme).toUpperCase();
    if (ALLOWED_THEMES.includes(val)) addField('theme', val);
  }

  if (setClause.length > 0) {
    setClause.push(`updated_at = NOW()`);
    const query = `UPDATE user_settings SET ${setClause.join(', ')} WHERE user_id = $1 RETURNING *`;
    const res = await db.query(query, values);
    return getSettings(user);
  }

  return getSettings(user);
};

const changeEmail = async (user, newEmail, currentPassword) => {
  if (!newEmail || typeof newEmail !== 'string' || !newEmail.includes('@')) {
    const err = new Error('Valid email address is required');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const cleanEmail = newEmail.trim().toLowerCase();
  const oldEmail = user.email;

  const userRes = await db.query(
    `SELECT u.password_hash, p.full_name FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1`,
    [user.id]
  );
  if (userRes.rows.length === 0) {
    const err = new Error('User account not found');
    err.statusCode = 404;
    throw err;
  }

  const userName = userRes.rows[0].full_name;

  if (currentPassword) {
    const isValid = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
    if (!isValid) {
      const err = new Error('Current password is incorrect');
      err.statusCode = 400;
      err.errorCode = 'INVALID_PASSWORD';
      throw err;
    }
  }

  const dupRes = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [cleanEmail, user.id]);
  if (dupRes.rows.length > 0) {
    const err = new Error('This email address is already in use by another account');
    err.statusCode = 400;
    err.errorCode = 'EMAIL_IN_USE';
    throw err;
  }

  await db.query('UPDATE users SET email = $1, email_verified = true, updated_at = NOW() WHERE id = $2', [cleanEmail, user.id]);

  // Send Security Notification Email to Old Email Address
  if (oldEmail && oldEmail !== cleanEmail) {
    try {
      await emailService.sendEmailChangedAlert(oldEmail, cleanEmail, user.id, userName);
    } catch (err) {
      console.warn('[Email Changed Alert Warning]', err.message);
    }
  }

  return {
    success: true,
    message: 'Email address updated successfully',
    email: cleanEmail,
  };
};

const changePassword = async (user, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    const err = new Error('Current password and new password are required');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  if (newPassword.length < 6) {
    const err = new Error('New password must be at least 6 characters long');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [user.id]);
  if (userRes.rows.length === 0) {
    const err = new Error('User account not found');
    err.statusCode = 404;
    throw err;
  }

  const isValid = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
  if (!isValid) {
    const err = new Error('Current password is incorrect');
    err.statusCode = 400;
    err.errorCode = 'INVALID_PASSWORD';
    throw err;
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, user.id]);

  // Send Password Changed Security Alert Email
  try {
    const uRes = await db.query('SELECT u.email, p.full_name FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1', [user.id]);
    if (uRes.rows.length > 0) {
      await emailService.sendPasswordChangedAlert(uRes.rows[0].email, user.id, { userName: uRes.rows[0].full_name });
    }
  } catch (err) {
    console.warn('[Password Changed Alert Warning]', err.message);
  }

  return {
    success: true,
    message: 'Password changed successfully',
  };
};

const deactivateAccount = async (user) => {
  await db.query(`UPDATE users SET account_status = 'DEACTIVATED', updated_at = NOW() WHERE id = $1`, [user.id]);
  
  try {
    const uRes = await db.query('SELECT u.email, p.full_name FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1', [user.id]);
    if (uRes.rows.length > 0) {
      await emailService.sendAccountDeactivatedAlert(uRes.rows[0].email, uRes.rows[0].full_name, user.id);
    }
  } catch (err) {
    console.warn('[Account Deactivated Alert Warning]', err.message);
  }

  return {
    success: true,
    message: 'Account deactivated successfully. You can log back in anytime to reactivate your profile.',
  };
};

const deleteAccount = async (user, password) => {
  const userRes = await db.query(
    'SELECT u.password_hash, u.email, p.full_name FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1',
    [user.id]
  );
  
  if (userRes.rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const userData = userRes.rows[0];

  if (userData.password_hash && password) {
    const isValid = await bcrypt.compare(password, userData.password_hash);
    if (!isValid) {
      const err = new Error('Incorrect password');
      err.statusCode = 400;
      err.errorCode = 'INVALID_PASSWORD';
      throw err;
    }
  }

  // Send Account Deleted confirmation email before dropping database records
  try {
    if (userData.email) {
      await emailService.sendAccountDeletedAlert(userData.email, userData.full_name || 'Community Member', user.id);
    }
  } catch (err) {
    console.warn('[Account Deleted Alert Warning]', err.message);
  }

  const isAlumni = (userData.role || user.role || '').toUpperCase() === 'ALUMNI';

  if (isAlumni) {
    // ALUMNI ACCOUNT:
    // Deactivate public-facing profile, clear personal info, revoke sessions, but preserve institutional verification & audit records
    await db.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1', [user.id]);
    await db.query(`
      UPDATE user_profiles
      SET bio = NULL, phone = NULL, avatar_url = NULL, banner_url = NULL,
          linkedin_url = NULL, github_url = NULL, is_profile_complete = false,
          updated_at = NOW()
      WHERE user_id = $1
    `, [user.id]);
    await db.query(`UPDATE users SET account_status = 'DEACTIVATED', updated_at = NOW() WHERE id = $1`, [user.id]);

    return {
      success: true,
      message: 'Your public alumni profile and personal data have been deactivated and cleared from JU Connect.',
    };
  }

  // STUDENT ACCOUNT:
  // Set user_id in audit_logs to null so foreign keys don't block deletion
  await db.query('UPDATE audit_logs SET user_id = NULL WHERE user_id = $1', [user.id]).catch(() => {});

  // Permanently delete student user record (foreign keys ON DELETE CASCADE will clean up profile, sessions, posts, comments, connections, enabling re-registration with same email)
  await db.query('DELETE FROM users WHERE id = $1', [user.id]);

  return {
    success: true,
    message: 'Your student account and personal data have been permanently deleted from JU Connect.',
  };
};

const exportUserData = async (user) => {
  const profileRes = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [user.id]);
  const postsRes = await db.query('SELECT id, content, created_at FROM posts WHERE author_id = $1', [user.id]);
  const commentsRes = await db.query('SELECT id, post_id, content, created_at FROM comments WHERE author_id = $1', [user.id]);
  const connRes = await db.query(
    `SELECT c.id, c.status, c.created_at,
            CASE WHEN c.requester_id = $1 THEN c.receiver_id ELSE c.requester_id END AS partner_id
     FROM connections c
     WHERE c.requester_id = $1 OR c.receiver_id = $1`,
    [user.id]
  );
  const settingsRes = await db.query('SELECT * FROM user_settings WHERE user_id = $1', [user.id]);

  return {
    exportDate: new Date().toISOString(),
    account: {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    profile: profileRes.rows[0] || null,
    settings: settingsRes.rows[0] || null,
    activitySummary: {
      totalPosts: postsRes.rows.length,
      totalComments: commentsRes.rows.length,
      totalConnections: connRes.rows.filter((r) => r.status === 'ACCEPTED').length,
    },
    posts: postsRes.rows,
    comments: commentsRes.rows,
    connections: connRes.rows,
  };
};

const getBlockedUsers = async (user) => {
  const query = `
    SELECT b.id AS block_id, b.blocked_id AS user_id, b.created_at,
           u.email, u.role, p.full_name AS name, p.avatar_url AS avatar,
           p.company, p.designation, p.degree, p.branch
    FROM user_blocks b
    JOIN users u ON b.blocked_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE b.blocker_id = $1
    ORDER BY b.created_at DESC;
  `;
  const res = await db.query(query, [user.id]);
  return {
    blockedUsers: res.rows.map((r) => ({
      blockId: r.block_id,
      id: r.user_id,
      userId: r.user_id,
      name: r.name || (r.email ? r.email.split('@')[0] : 'JECRC Member'),
      email: r.email,
      role: (r.role || 'STUDENT').toLowerCase(),
      avatar: r.avatar || null,
      headline: r.designation ? `${r.designation}${r.company ? ` @ ${r.company}` : ''}` : `${r.degree || ''} ${r.branch || ''}`.trim(),
      blockedAt: r.created_at,
    })),
  };
};

const blockUser = async (user, targetUserId) => {
  if (!targetUserId || targetUserId === user.id) {
    const err = new Error('Cannot block yourself');
    err.statusCode = 400;
    throw err;
  }

  await db.query(
    'INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT (blocker_id, blocked_id) DO NOTHING',
    [user.id, targetUserId]
  );

  return {
    success: true,
    message: 'User blocked successfully',
  };
};

const unblockUser = async (user, targetUserId) => {
  await db.query('DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2', [user.id, targetUserId]);
  return {
    success: true,
    message: 'User unblocked successfully',
  };
};

const getActiveSessions = async (user) => {
  const res = await db.query(
    'SELECT * FROM user_sessions WHERE user_id = $1 AND is_active = TRUE ORDER BY last_active_at DESC',
    [user.id]
  );

  const sessions = res.rows.length > 0 ? res.rows : [
    {
      id: 'current_session',
      user_id: user.id,
      device: 'Chrome / Windows Client',
      ip_address: '127.0.0.1',
      is_active: true,
      last_active_at: new Date().toISOString(),
      isCurrent: true,
    }
  ];

  return { sessions };
};

const revokeSession = async (user, sessionId) => {
  await db.query('UPDATE user_sessions SET is_active = FALSE WHERE id = $1 AND user_id = $2', [sessionId, user.id]);
  return {
    success: true,
    message: 'Session revoked successfully',
  };
};

module.exports = {
  getSettings,
  updateSettings,
  changeEmail,
  changePassword,
  deactivateAccount,
  deleteAccount,
  exportUserData,
  getBlockedUsers,
  blockUser,
  unblockUser,
  getActiveSessions,
  revokeSession,
};
