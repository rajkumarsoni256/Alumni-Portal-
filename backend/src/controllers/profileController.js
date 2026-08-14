const profileService = require('../services/profileService');
const { successResponse } = require('../utils/response');

const completeOnboarding = async (req, res, next) => {
  try {
    const profileResponse = await profileService.completeOnboarding(req.user, req.body);
    return successResponse(res, profileResponse, 'Profile onboarding completed successfully');
  } catch (err) {
    next(err);
  }
};

const getCurrentProfile = async (req, res, next) => {
  try {
    const profileResponse = await profileService.getCurrentProfile(req.user);
    return successResponse(res, profileResponse, 'Current user profile fetched successfully');
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const profileResponse = await profileService.updateProfile(req.user, req.body);
    return successResponse(res, profileResponse, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

const getProfileById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const profileResponse = await profileService.getProfileById(userId, req.user);
    return successResponse(res, profileResponse, 'User profile fetched successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  completeOnboarding,
  getCurrentProfile,
  updateProfile,
  getProfileById,
};
