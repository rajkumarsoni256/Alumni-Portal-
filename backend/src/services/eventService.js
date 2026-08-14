const crypto = require('crypto');
const db = require('../config/db');
const notificationService = require('./notificationService');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const formatDateStr = (dateObj) => {
  if (!dateObj) return 'Upcoming';
  const date = new Date(dateObj);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTimeStr = (startObj, endObj) => {
  if (!startObj) return 'TBA';
  const start = new Date(startObj);
  const startFormatted = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (!endObj) return startFormatted;
  const end = new Date(endObj);
  const endFormatted = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${startFormatted} - ${endFormatted}`;
};

const formatEventDTO = (row, authUserId = null) => {
  const isCreatorAlumni = (row.creator_role || '').toUpperCase() === 'ALUMNI';
  const creatorName = row.creator_name || (row.creator_email ? row.creator_email.split('@')[0] : 'JECRC Board');

  const createdByObj = {
    id: row.created_by,
    name: creatorName,
    email: row.creator_email,
    role: (row.creator_role || 'ADMIN').toLowerCase(),
    avatar: row.creator_avatar || null,
  };

  const regCount = parseInt(row.registered_count || '0', 10);
  const cap = row.capacity ? parseInt(row.capacity, 10) : null;
  const seatsLeft = cap !== null ? Math.max(0, cap - regCount) : 'Unlimited';

  const isReg = row.is_registered_by_user === true || row.is_registered_by_user === 'true' || row.is_registered_by_user === 1;

  const now = new Date();
  const deadlinePassed = row.registration_deadline ? new Date(row.registration_deadline) < now : false;
  const isCapFull = cap !== null && regCount >= cap;
  const isRegistrationOpen = (row.status || 'PUBLISHED').toUpperCase() === 'PUBLISHED' && !deadlinePassed && !isCapFull;

  return {
    id: row.id,
    eventId: row.id,
    title: row.title,
    description: row.description,
    category: row.category || 'Workshops',
    eventType: row.event_type || 'ALUMNI_MEETUP',
    date: formatDateStr(row.start_at),
    time: formatTimeStr(row.start_at, row.end_at),
    startAt: row.start_at,
    endAt: row.end_at,
    registrationDeadline: row.registration_deadline,
    speaker: row.speaker || creatorName,
    speakerRole: isCreatorAlumni ? 'JECRC Alumni Guest Speaker' : 'JECRC Leadership & Board',
    speakerAvatar: createdByObj.avatar,
    location: row.location,
    isOnline: Boolean(row.is_online),
    meetingUrl: row.meeting_url || null,
    registeredCount: regCount,
    capacity: cap,
    seatsLeft: seatsLeft,
    isRegistered: isReg,
    isRegistrationOpen: isRegistrationOpen,
    status: row.status || 'PUBLISHED',
    imageUrl: row.image_url || null,
    createdBy: createdByObj,
    createdAt: row.created_at,
  };
};

const getEvents = async (authUserId, queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page || 1, 10));
  const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit || 10, 10)));
  const offset = (page - 1) * limit;

  const whereClauses = [];
  const values = [];
  let paramIndex = 1;

  // Status filter (default PUBLISHED unless requested by admin)
  if (queryParams.status) {
    whereClauses.push(`e.status = $${paramIndex}`);
    values.push(queryParams.status.toUpperCase());
    paramIndex++;
  } else {
    whereClauses.push(`e.status = 'PUBLISHED'`);
  }

  // Category filter
  if (queryParams.category && queryParams.category !== 'All') {
    whereClauses.push(`e.category ILIKE $${paramIndex}`);
    values.push(queryParams.category);
    paramIndex++;
  }

  // Event Type filter
  if (queryParams.eventType && queryParams.eventType !== 'All') {
    whereClauses.push(`e.event_type ILIKE $${paramIndex}`);
    values.push(queryParams.eventType);
    paramIndex++;
  }

  // Upcoming vs Past filter
  if (queryParams.upcoming === 'true' || queryParams.upcoming === true) {
    whereClauses.push(`e.start_at >= NOW()`);
  } else if (queryParams.past === 'true' || queryParams.past === true) {
    whereClauses.push(`e.start_at < NOW()`);
  }

  // Search query filter
  if (queryParams.search && queryParams.search.trim() !== '') {
    const q = `%${queryParams.search.trim().toLowerCase()}%`;
    whereClauses.push(`(
      LOWER(e.title) LIKE $${paramIndex} OR
      LOWER(e.description) LIKE $${paramIndex} OR
      LOWER(e.speaker) LIKE $${paramIndex} OR
      LOWER(e.location) LIKE $${paramIndex}
    )`);
    values.push(q);
    paramIndex++;
  }

  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count total matching events
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM events e
    ${whereString};
  `;
  const countResult = await db.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);
  const pages = Math.ceil(total / limit) || 1;

  // Auth User param index for IsRegistered
  values.push(authUserId);
  const authUserIdParamIdx = paramIndex;
  paramIndex++;

  values.push(limit, offset);
  const limitParamIdx = paramIndex;
  const offsetParamIdx = paramIndex + 1;

  const dataQuery = `
    SELECT e.*,
           u.email AS creator_email, u.role AS creator_role,
           p.full_name AS creator_name, p.avatar_url AS creator_avatar,
           (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status = 'REGISTERED') AS registered_count,
           EXISTS (
             SELECT 1 FROM event_registrations er2 WHERE er2.event_id = e.id AND er2.user_id = $${authUserIdParamIdx} AND er2.status = 'REGISTERED'
           ) AS is_registered_by_user
    FROM events e
    JOIN users u ON e.created_by = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ${whereString}
    ORDER BY e.start_at ASC
    LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx};
  `;

  const dataResult = await db.query(dataQuery, values);
  const events = dataResult.rows.map((row) => formatEventDTO(row, authUserId));

  return {
    events,
    total,
    page,
    limit,
    pages,
    totalCount: total,
    totalPages: pages,
    hasMore: offset + limit < total,
  };
};

const getEventById = async (authUserId, eventId) => {
  if (!UUID_REGEX.test(eventId)) {
    const err = new Error('Invalid event ID format');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const queryText = `
    SELECT e.*,
           u.email AS creator_email, u.role AS creator_role,
           p.full_name AS creator_name, p.avatar_url AS creator_avatar,
           (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status = 'REGISTERED') AS registered_count,
           EXISTS (
             SELECT 1 FROM event_registrations er2 WHERE er2.event_id = e.id AND er2.user_id = $2 AND er2.status = 'REGISTERED'
           ) AS is_registered_by_user
    FROM events e
    JOIN users u ON e.created_by = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE e.id = $1;
  `;

  const result = await db.query(queryText, [eventId, authUserId]);

  if (result.rows.length === 0) {
    const err = new Error(`Event not found with ID '${eventId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const event = formatEventDTO(result.rows[0], authUserId);
  return { event };
};

const createEvent = async (user, eventData) => {
  if (user.account_status === 'DISABLED') {
    const err = new Error('Disabled accounts cannot create events');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  const roleUpper = (user.role || '').toUpperCase();
  if (roleUpper !== 'ADMIN' && roleUpper !== 'ALUMNI') {
    const err = new Error('Only Alumni and Admin users are authorized to organize events');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const title = (eventData.title || '').trim();
  const description = (eventData.description || '').trim();
  const location = (eventData.location || '').trim();
  const startAt = eventData.startAt ? new Date(eventData.startAt) : null;
  const endAt = eventData.endAt ? new Date(eventData.endAt) : null;

  if (!title || !description || !location || !startAt || isNaN(startAt.getTime())) {
    const err = new Error('Event title, description, location, and valid start time are required');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const actualEndAt = endAt && !isNaN(endAt.getTime()) ? endAt : new Date(startAt.getTime() + 7200 * 1000); // Default 2h
  if (actualEndAt < startAt) {
    const err = new Error('Event end time cannot be before start time');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const regDeadline = eventData.registrationDeadline ? new Date(eventData.registrationDeadline) : new Date(startAt.getTime() - 3600 * 1000);
  const capacity = eventData.capacity ? parseInt(eventData.capacity, 10) : null;
  const category = eventData.category || 'Workshops';
  const eventType = eventData.eventType || 'ALUMNI_MEETUP';
  const speaker = eventData.speaker || null;
  const isOnline = Boolean(eventData.isOnline);
  const meetingUrl = eventData.meetingUrl || null;
  const imageUrl = eventData.imageUrl || null;
  const status = eventData.status || 'PUBLISHED';

  const eventId = crypto.randomUUID();
  await db.query(
    `INSERT INTO events (id, created_by, title, description, event_type, category, speaker, location, is_online, meeting_url, start_at, end_at, registration_deadline, capacity, image_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [eventId, user.id, title, description, eventType, category, speaker, location, isOnline, meetingUrl, startAt, actualEndAt, regDeadline, capacity, imageUrl, status]
  );

  return getEventById(user.id, eventId);
};

const updateEvent = async (user, eventId, updateData) => {
  if (!UUID_REGEX.test(eventId)) {
    const err = new Error('Invalid event ID format');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
  if (eventRes.rows.length === 0) {
    const err = new Error(`Event not found with ID '${eventId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const event = eventRes.rows[0];
  const isOwner = event.created_by === user.id;
  const isAdmin = (user.role || '').toUpperCase() === 'ADMIN';

  if (!isOwner && !isAdmin) {
    const err = new Error('Only the organizer or an Admin can edit this event');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  const title = (updateData.title || event.title).trim();
  const description = (updateData.description || event.description).trim();
  const location = (updateData.location || event.location).trim();
  const category = updateData.category || event.category;
  const eventType = updateData.eventType || event.event_type;
  const status = updateData.status || event.status;

  await db.query(
    `UPDATE events 
     SET title = $1, description = $2, location = $3, category = $4, event_type = $5, status = $6, updated_at = NOW()
     WHERE id = $7`,
    [title, description, location, category, eventType, status, eventId]
  );

  return getEventById(user.id, eventId);
};

const deleteEvent = async (user, eventId) => {
  if (!UUID_REGEX.test(eventId)) {
    const err = new Error('Invalid event ID format');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
  if (eventRes.rows.length === 0) {
    const err = new Error(`Event not found with ID '${eventId}'`);
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const event = eventRes.rows[0];
  const isOwner = event.created_by === user.id;
  const isAdmin = (user.role || '').toUpperCase() === 'ADMIN';

  if (!isOwner && !isAdmin) {
    const err = new Error('Only the organizer or an Admin can cancel/delete this event');
    err.statusCode = 403;
    err.errorCode = 'FORBIDDEN';
    throw err;
  }

  await db.query('DELETE FROM events WHERE id = $1', [eventId]);
  return { success: true, message: 'Event deleted successfully' };
};

const registerForEvent = async (user, eventId) => {
  if (!UUID_REGEX.test(eventId)) {
    const err = new Error('Invalid event ID format');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  if (user.account_status === 'DISABLED') {
    const err = new Error('Disabled accounts cannot register for events');
    err.statusCode = 400;
    err.errorCode = 'BAD_REQUEST';
    throw err;
  }

  // PostgreSQL Transaction with FOR UPDATE lock to safely enforce capacity & deadline
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const eventRes = await client.query(
      'SELECT id, title, capacity, registration_deadline, status FROM events WHERE id = $1 FOR UPDATE',
      [eventId]
    );

    if (eventRes.rows.length === 0) {
      await client.query('ROLLBACK');
      const err = new Error(`Event not found with ID '${eventId}'`);
      err.statusCode = 404;
      err.errorCode = 'RESOURCE_NOT_FOUND';
      throw err;
    }

    const event = eventRes.rows[0];

    if ((event.status || '').toUpperCase() !== 'PUBLISHED') {
      await client.query('ROLLBACK');
      const err = new Error('This event is not open for registration');
      err.statusCode = 400;
      err.errorCode = 'BAD_REQUEST';
      throw err;
    }

    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      await client.query('ROLLBACK');
      const err = new Error('Registration deadline for this event has passed');
      err.statusCode = 400;
      err.errorCode = 'BAD_REQUEST';
      throw err;
    }

    // Capacity Check
    const regCountRes = await client.query(
      "SELECT COUNT(*) AS count FROM event_registrations WHERE event_id = $1 AND status = 'REGISTERED'",
      [eventId]
    );
    const registeredCount = parseInt(regCountRes.rows[0].count, 10);

    if (event.capacity !== null && registeredCount >= parseInt(event.capacity, 10)) {
      await client.query('ROLLBACK');
      const err = new Error('Event has reached maximum registration capacity');
      err.statusCode = 400;
      err.errorCode = 'BAD_REQUEST';
      throw err;
    }

    // Duplicate Check
    const existingReg = await client.query(
      'SELECT id, status FROM event_registrations WHERE event_id = $1 AND user_id = $2',
      [eventId, user.id]
    );

    let regId;
    if (existingReg.rows.length > 0) {
      if (existingReg.rows[0].status === 'REGISTERED') {
        await client.query('ROLLBACK');
        const err = new Error('You are already registered for this event');
        err.statusCode = 409;
        err.errorCode = 'CONFLICT';
        throw err;
      }

      regId = existingReg.rows[0].id;
      await client.query(
        "UPDATE event_registrations SET status = 'REGISTERED', updated_at = NOW() WHERE id = $1",
        [regId]
      );
    } else {
      regId = crypto.randomUUID();
      await client.query(
        `INSERT INTO event_registrations (id, event_id, user_id, status) VALUES ($1, $2, $3, 'REGISTERED')`,
        [regId, eventId, user.id]
      );
    }

    await client.query('COMMIT');

    // Trigger Notification for User
    await notificationService.createNotification({
      recipientId: user.id,
      actorId: null,
      type: 'EVENT_REGISTRATION',
      title: 'Event registration confirmed',
      message: `You are registered for ${event.title}`,
      entityType: 'EVENT',
      entityId: eventId,
    });

    const newRegCount = registeredCount + 1;
    const seatsLeft = event.capacity ? Math.max(0, parseInt(event.capacity, 10) - newRegCount) : 'Unlimited';

    return {
      registration: {
        id: regId,
        eventId,
        userId: user.id,
        status: 'REGISTERED',
        registeredAt: new Date().toISOString(),
      },
      isRegistered: true,
      registeredCount: newRegCount,
      seatsLeft: seatsLeft,
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};

const cancelRegistration = async (user, eventId) => {
  if (!UUID_REGEX.test(eventId)) {
    const err = new Error('Invalid event ID format');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const existingReg = await db.query(
    'SELECT id, status FROM event_registrations WHERE event_id = $1 AND user_id = $2',
    [eventId, user.id]
  );

  if (existingReg.rows.length === 0 || existingReg.rows[0].status !== 'REGISTERED') {
    const err = new Error('You do not have an active registration for this event');
    err.statusCode = 404;
    err.errorCode = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  await db.query(
    "UPDATE event_registrations SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1",
    [existingReg.rows[0].id]
  );

  const regCountRes = await db.query(
    "SELECT COUNT(*) AS count FROM event_registrations WHERE event_id = $1 AND status = 'REGISTERED'",
    [eventId]
  );

  return {
    eventId,
    isRegistered: false,
    registeredCount: parseInt(regCountRes.rows[0].count, 10),
  };
};

const getMyRegistrations = async (user) => {
  const queryText = `
    SELECT e.*,
           u.email AS creator_email, u.role AS creator_role,
           p.full_name AS creator_name, p.avatar_url AS creator_avatar,
           (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status = 'REGISTERED') AS registered_count,
           true AS is_registered_by_user
    FROM event_registrations reg
    JOIN events e ON reg.event_id = e.id
    JOIN users u ON e.created_by = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE reg.user_id = $1 AND reg.status = 'REGISTERED'
    ORDER BY e.start_at ASC;
  `;

  const result = await db.query(queryText, [user.id]);
  const events = result.rows.map((row) => formatEventDTO(row, user.id));
  return { events, total: events.length };
};

const getUpcomingEvents = async (authUserId, limit = 5) => {
  const limitVal = Math.min(20, Math.max(1, parseInt(limit || 5, 10)));
  const data = await getEvents(authUserId, {
    status: 'PUBLISHED',
    upcoming: 'true',
    limit: limitVal,
    page: 1,
  });
  return { events: data.events, total: data.total };
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getUpcomingEvents,
};
