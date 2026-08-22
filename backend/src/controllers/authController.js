const authService = require('../services/authService');
const sessionService = require('../services/sessionService');
const { successResponse, errorResponse } = require('../utils/response');

const COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || 'ju_connect_refresh';

const getCookieOptions = (rememberMe = true) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction || true, // Must be true for SameSite=None on cross-origin Vercel -> Render requests
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: rememberMe ? 10 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 10 days if rememberMe, 24 hours otherwise
  };
};

const setRefreshCookie = (res, refreshToken, rememberMe = true) => {
  if (!refreshToken) return;
  res.cookie(COOKIE_NAME, refreshToken, getCookieOptions(rememberMe));
};

const clearRefreshCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    ...getCookieOptions(false),
    maxAge: 0,
  });
};

const register = async (req, res, next) => {
  try {
    const userResponse = await authService.register(req.body || {});
    const isAlumni = userResponse.role === 'ALUMNI';
    const msg = isAlumni
      ? 'Your registration request has been sent to the JU Connect team for approval.'
      : 'Registration successful. Please check your email for the verification code.';
    return successResponse(res, userResponse, msg, 201);
  } catch (err) {
    next(err);
  }
};

const registerStudent = async (req, res, next) => {
  try {
    const payload = { ...(req.body || {}) };
    delete payload.role;
    const userResponse = await authService.register({ ...payload, role: 'STUDENT' });
    return successResponse(res, userResponse, 'Registration successful. Please check your email for the verification code.', 201);
  } catch (err) {
    next(err);
  }
};

const registerAlumni = async (req, res, next) => {
  try {
    const payload = { ...(req.body || {}) };
    delete payload.role;
    const userResponse = await authService.register({ ...payload, role: 'ALUMNI' });
    return successResponse(res, userResponse, 'Your registration request has been sent to the JU Connect team for approval.', 201);
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
    const result = await authService.verifyStudentRegistrationOTP({ ...req.body, req });
    if (result.refreshToken) {
      setRefreshCookie(res, result.refreshToken, req.body?.rememberMe !== false);
      delete result.refreshToken;
    }
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
    const { email, password, rememberMe } = req.body;
    const isRemember = rememberMe !== false;
    const authResponse = await authService.login({ email, password, rememberMe: isRemember, req });
    
    if (authResponse.refreshToken) {
      setRefreshCookie(res, authResponse.refreshToken, isRemember);
      delete authResponse.refreshToken;
    }

    return successResponse(res, authResponse, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { idToken, role } = req.body || {};
    const result = await authService.loginWithGoogle({ idToken, requestedRole: role, req });
    if (result.refreshToken) {
      setRefreshCookie(res, result.refreshToken);
    }
    return successResponse(res, result, 'Authenticated successfully with Google.', 200);
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.[COOKIE_NAME] || req.cookies?.refresh_token || req.body?.refreshToken;
    const ipAddress = req.ip || req.headers?.['x-forwarded-for'] || null;
    const userAgent = req.headers ? req.headers['user-agent'] : null;

    const { newRawRefreshToken, accessToken } = await sessionService.refreshSession({
      rawRefreshToken,
      ipAddress,
      userAgent,
    });

    setRefreshCookie(res, newRawRefreshToken);

    return successResponse(res, { accessToken }, 'Access token refreshed successfully');
  } catch (err) {
    clearRefreshCookie(res);
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.[COOKIE_NAME] || req.cookies?.refresh_token || req.body?.refreshToken;
    if (rawRefreshToken) {
      const tokenHash = sessionService.hashToken(rawRefreshToken);
      const db = require('../config/db');
      await db.query(`UPDATE auth_sessions SET revoked_at = NOW() WHERE refresh_token_hash = $1`, [tokenHash]).catch(() => {});
    }

    if (req.user?.id) {
      await sessionService.revokeAllUserSessions(req.user.id, 'LOGOUT').catch(() => {});
    }

    clearRefreshCookie(res);
    return successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    clearRefreshCookie(res);
    next(err);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', 401);
    }

    const count = await sessionService.revokeAllUserSessions(req.user.id, 'LOGOUT_ALL');
    clearRefreshCookie(res);

    return successResponse(res, { revokedCount: count }, 'Logged out from all devices successfully');
  } catch (err) {
    clearRefreshCookie(res);
    next(err);
  }
};

const getSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', 401);
    }

    const rawRefreshToken = req.cookies?.[COOKIE_NAME] || req.cookies?.refresh_token;
    const details = await sessionService.getSessionDetails(req.user.id, rawRefreshToken);

    return successResponse(res, {
      authenticated: true,
      expiresAt: details?.expiresAt || null,
      user: {
        id: req.user.id,
        role: req.user.role,
      },
    }, 'Active session details fetched');
  } catch (err) {
    next(err);
  }
};

const getUserSessions = async (req, res, next) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', 401);
    }

    const rawRefreshToken = req.cookies?.[COOKIE_NAME] || req.cookies?.refresh_token;
    const sessions = await sessionService.getUserSessions(req.user.id, rawRefreshToken);

    return successResponse(res, sessions, 'Active user sessions fetched');
  } catch (err) {
    next(err);
  }
};

const revokeUserSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', 401);
    }

    const { sessionId } = req.params;
    await sessionService.revokeSession(sessionId, req.user.id);

    return successResponse(res, null, 'Session revoked successfully');
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

const verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyResetOTP({ email, otp });
    return successResponse(res, result, 'OTP verified successfully');
  } catch (err) {
    next(err);
  }
};

const resendResetOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const message = await authService.resendResetOTP({ email });
    return successResponse(res, null, message);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    const message = await authService.resetPassword({ resetToken, newPassword });
    clearRefreshCookie(res);
    return successResponse(res, null, message);
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
  registerStudent,
  registerAlumni,
  initiateStudentRegistration,
  verifyStudentRegistrationOTP,
  verifyEmail,
  resendVerificationCode,
  login,
  googleLogin,
  refresh,
  logout,
  logoutAll,
  getSession,
  getUserSessions,
  revokeUserSession,
  forgotPassword,
  verifyResetOTP,
  resendResetOTP,
  resetPassword,
  getCurrentUser,
};
