const jobService = require('../services/jobService');
const { successResponse } = require('../utils/response');

const createJob = async (req, res, next) => {
  try {
    const job = await jobService.createJob(req.user, req.body);
    return successResponse(res, job, 'Job opportunity posted successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getJobs = async (req, res, next) => {
  try {
    const authUserId = req.user ? req.user.id : null;
    const data = await jobService.getJobs(authUserId, req.query);
    return successResponse(res, data, 'Jobs fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const authUserId = req.user ? req.user.id : null;
    const data = await jobService.getJobById(authUserId, id);
    return successResponse(res, data, 'Job details fetched successfully');
  } catch (err) {
    next(err);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await jobService.updateJob(req.user, id, req.body);
    return successResponse(res, data, 'Job posting updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await jobService.deleteJob(req.user, id);
    return successResponse(res, data, 'Job posting deleted successfully');
  } catch (err) {
    next(err);
  }
};

const toggleBookmarkJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await jobService.toggleBookmarkJob(req.user, id);
    return successResponse(res, data, data.isBookmarked ? 'Job bookmarked' : 'Bookmark removed');
  } catch (err) {
    next(err);
  }
};

const applyForJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await jobService.applyForJob(req.user, id, req.body);
    return successResponse(res, data, 'Application submitted successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getMyApplications = async (req, res, next) => {
  try {
    const data = await jobService.getMyApplications(req.user);
    return successResponse(res, data, 'User applications fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getMyBookmarks = async (req, res, next) => {
  try {
    const data = await jobService.getMyBookmarks(req.user);
    return successResponse(res, data, 'Bookmarked jobs fetched successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  toggleBookmarkJob,
  applyForJob,
  getMyApplications,
  getMyBookmarks,
};
