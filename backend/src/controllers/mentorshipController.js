const mentorshipService = require('../services/mentorshipService');
const { successResponse } = require('../utils/response');

const getMentorshipRequests = async (req, res, next) => {
  try {
    const data = await mentorshipService.getMentorshipRequests(req.user, req.query);
    return successResponse(res, data, 'Mentorship requests fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getMentorshipRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await mentorshipService.getMentorshipRequestById(req.user, id);
    return successResponse(res, data, 'Mentorship request fetched successfully');
  } catch (err) {
    next(err);
  }
};

const createMentorshipRequest = async (req, res, next) => {
  try {
    const data = await mentorshipService.createMentorshipRequest(req.user, req.body);
    return successResponse(res, data, 'Mentorship request sent successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateMentorshipRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await mentorshipService.updateMentorshipRequestStatus(req.user, id, req.body);
    return successResponse(res, data, 'Mentorship request status updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMentorshipRequests,
  getMentorshipRequestById,
  createMentorshipRequest,
  updateMentorshipRequestStatus,
};
