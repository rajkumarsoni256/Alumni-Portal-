const userService = require('../services/userService');
const { successResponse } = require('../utils/response');

const getUsers = async (req, res, next) => {
  try {
    const authUserId = req.user ? req.user.id : null;
    const data = await userService.discoverUsers(req.query, authUserId);
    return successResponse(res, data, 'Community members fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const authUserId = req.user ? req.user.id : null;
    const user = await userService.getPublicUserById(id, authUserId);
    return successResponse(res, user, 'Public user profile fetched successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getUserById,
};
