const authService = require('../services/authService');
const { successResponse } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const userResponse = await authService.register({ name, email, password, role });
    return successResponse(res, userResponse, 'Registration successful. Please check your email for the verification code.', 201);
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    await authService.verifyEmail({ email, code });
    return successResponse(res, null, 'Email verified successfully. You may now log in.');
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const authResponse = await authService.login({ email, password });
    return successResponse(res, authResponse, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const authResponse = await authService.authenticateWithGoogle({ idToken });
    return successResponse(res, authResponse, 'Google authentication successful');
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const message = await authService.forgotPassword({ email });
    return successResponse(res, null, message);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword({ token, newPassword });
    return successResponse(res, null, 'Password reset successfully. You may now log in with your new password.');
  } catch (err) {
    next(err);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const userResponse = await authService.getCurrentUser(req.user);
    return successResponse(res, userResponse, 'Current authenticated user profile fetched');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};
