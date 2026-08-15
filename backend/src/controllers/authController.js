const authService = require('../services/authService');
const { successResponse } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const userResponse = await authService.register(req.body || {});
    return successResponse(res, userResponse, 'Registration successful. Please check your email for the verification code.', 201);
  } catch (err) {
    next(err);
  }
};

const initiateStudentRegistration = async (req, res, next) => {
  try {
    const result = await authService.initiateStudentRegistration(req.body || {});
    return successResponse(res, result, 'Verification OTP sent to your JECRC institutional email address.', 200);
  } catch (err) {
    next(err);
  }
};

const verifyStudentRegistrationOTP = async (req, res, next) => {
  try {
    const result = await authService.verifyStudentRegistrationOTP(req.body || {});
    return successResponse(res, result, 'Student account verified and created successfully.', 201);
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

const resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    const data = await authService.resendVerificationCode({ email });
    return successResponse(res, data, 'Verification code sent to your email address.');
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const authResponse = await authService.login({ email, password, req });
    return successResponse(res, authResponse, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const authResponse = await authService.authenticateWithGoogle({ idToken, req });
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
    const { token, code, email, newPassword } = req.body;
    await authService.resetPassword({ token, code, email, newPassword });
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
  initiateStudentRegistration,
  verifyStudentRegistrationOTP,
  verifyEmail,
  resendVerificationCode,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};
