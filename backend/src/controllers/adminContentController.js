const adminContentService = require('../services/adminContentService');
const { successResponse, errorResponse } = require('../utils/response');

// 1. Admin Jobs
const getAdminJobs = async (req, res, next) => {
  try {
    const data = await adminContentService.getAdminJobs(req.query);
    return successResponse(res, data, 'Admin jobs retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createAdminJob = async (req, res, next) => {
  try {
    const job = await adminContentService.createAdminJob(req.user, req.body);
    return successResponse(res, job, 'Official JECRC Job opportunity published successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getAdminJobById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await adminContentService.getAdminJobById(id);
    return successResponse(res, data, 'Job details retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const updateAdminJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await adminContentService.updateAdminJob(req.user, id, req.body);
    return successResponse(res, job, 'Job updated successfully');
  } catch (err) {
    next(err);
  }
};

const updateAdminJobStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const job = await adminContentService.updateAdminJobStatus(req.user, id, status);
    return successResponse(res, job, `Job status updated to ${job.status}`);
  } catch (err) {
    next(err);
  }
};

const getJobApplicants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await adminContentService.getAdminJobById(id);
    return successResponse(res, { applicants: data.applicants, total: data.applicantsCount }, 'Job applicants retrieved');
  } catch (err) {
    next(err);
  }
};

const exportJobApplicants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await adminContentService.getAdminJobById(id);
    const applicants = data.applicants || [];

    const headers = ['Applicant ID', 'Name', 'Email', 'Role', 'Roll Number', 'Course', 'Branch', 'Graduation Year', 'Status', 'Applied At'];
    const rows = applicants.map((app) => [
      app.applicantId,
      `"${(app.name || '').replace(/"/g, '""')}"`,
      app.email,
      app.role,
      app.rollNumber,
      app.course,
      app.branch,
      app.graduationYear,
      app.status,
      app.appliedAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=job_applicants_${id}.csv`);
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

// 2. Admin Events
const getAdminEvents = async (req, res, next) => {
  try {
    const data = await adminContentService.getAdminEvents(req.query);
    return successResponse(res, data, 'Admin events retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createAdminEvent = async (req, res, next) => {
  try {
    const event = await adminContentService.createAdminEvent(req.user, req.body);
    return successResponse(res, event, 'Official JECRC Event created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getAdminEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await adminContentService.getAdminEventById(id);
    return successResponse(res, data, 'Event details retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const updateAdminEventStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const event = await adminContentService.updateAdminEventStatus(req.user, id, status);
    return successResponse(res, event, `Event status updated to ${event.status}`);
  } catch (err) {
    next(err);
  }
};

const getEventAttendees = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await adminContentService.getAdminEventById(id);
    return successResponse(res, { attendees: data.attendees, total: data.registeredCount }, 'Event attendees retrieved');
  } catch (err) {
    next(err);
  }
};

const exportEventAttendees = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await adminContentService.getAdminEventById(id);
    const attendees = data.attendees || [];

    const headers = ['Attendee ID', 'Name', 'Email', 'Role', 'Roll Number', 'Course', 'Branch', 'Graduation Year', 'Status', 'Registered At'];
    const rows = attendees.map((att) => [
      att.attendeeId,
      `"${(att.name || '').replace(/"/g, '""')}"`,
      att.email,
      att.role,
      att.rollNumber,
      att.course,
      att.branch,
      att.graduationYear,
      att.status,
      att.registeredAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=event_attendees_${id}.csv`);
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

// 3. Moderation, Connections & Mentorship
const getAdminPosts = async (req, res, next) => {
  try {
    const data = await adminContentService.getAdminPosts(req.query);
    return successResponse(res, data, 'Posts retrieved for moderation');
  } catch (err) {
    next(err);
  }
};

const getAdminConnections = async (req, res, next) => {
  try {
    const data = await adminContentService.getAdminConnections(req.query);
    return successResponse(res, data, 'Connections overview retrieved');
  } catch (err) {
    next(err);
  }
};

const getAdminMentorship = async (req, res, next) => {
  try {
    const data = await adminContentService.getAdminMentorship(req.query);
    return successResponse(res, data, 'Mentorship oversight retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminJobs,
  createAdminJob,
  getAdminJobById,
  updateAdminJob,
  updateAdminJobStatus,
  getJobApplicants,
  exportJobApplicants,
  getAdminEvents,
  createAdminEvent,
  getAdminEventById,
  updateAdminEventStatus,
  getEventAttendees,
  exportEventAttendees,
  getAdminPosts,
  getAdminConnections,
  getAdminMentorship,
};
