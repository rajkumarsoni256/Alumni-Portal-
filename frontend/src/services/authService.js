/**
 * JECRC Community — Real Authentication Service
 * Communicates with Express backend via /api/v1/auth
 */

import { apiClient, setAuthToken, clearAuthToken, getAuthToken } from './apiClient';

export const authService = {
  /**
   * Register new user (STUDENT or ALUMNI)
   */
  register: async (payload) => {
    const formattedRole = payload && payload.role ? String(payload.role).toUpperCase() : 'ALUMNI';
    const response = await apiClient.post('/api/v1/auth/register', {
      ...payload,
      email: payload && payload.email ? payload.email.trim().toLowerCase() : '',
      role: formattedRole,
    });
    return response;
  },

  /**
   * User login with email and password
   */
  login: async ({ email, password, rememberMe = true }) => {
    const response = await apiClient.post('/api/v1/auth/login', {
      email: email.trim().toLowerCase(),
      password,
      rememberMe,
    });
    if (response && (response.token || response.accessToken)) {
      setAuthToken(response.token || response.accessToken);
    }
    return response;
  },

  /**
   * Silently restore an authenticated session using the HttpOnly refresh cookie.
   * The refresh token never becomes accessible to JavaScript.
   */
  refreshToken: async () => {
    const response = await apiClient.post('/api/v1/auth/refresh');
    const token = response?.accessToken || response?.token;
    if (!token) {
      throw new Error('No access token returned by refresh endpoint');
    }
    setAuthToken(token);
    return response;
  },

  /**
   * User login with verified Google OAuth ID Token
   */
  loginWithGoogle: async (idToken, role = null) => {
    const response = await apiClient.post('/api/v1/auth/google', {
      idToken,
      role: role ? String(role).toUpperCase() : undefined,
    });
    if (response && (response.token || response.accessToken)) {
      setAuthToken(response.token || response.accessToken);
    }
    return response;
  },

  /**
   * Verify email address with 6-digit OTP code
   */
  verifyEmail: async ({ email, code }) => {
    const response = await apiClient.post('/api/v1/auth/verify-email', {
      email: email.trim().toLowerCase(),
      code: code.trim(),
    });
    return response;
  },

  /**
   * Request password reset link (account enumeration safe)
   */
  forgotPassword: async (email) => {
    const response = await apiClient.post('/api/v1/auth/forgot-password', {
      email: email.trim().toLowerCase(),
    });
    return response;
  },

  /**
   * Reset password with single-use token
   */
  resetPassword: async ({ token, newPassword }) => {
    const response = await apiClient.post('/api/v1/auth/reset-password', {
      token,
      code: email,
      email,
      newPassword,
    });
    return response;
  },

  /**
   * Fetch current authenticated user session via JWT
   */
  getCurrentUser: async () => {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const response = await apiClient.get('/api/v1/auth/me');
      if (response && response.user) {
        return response.user;
      }
      return response;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Logout user and clear local session state
   */
  logout: async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch (err) {
      console.warn('Backend logout notification warning:', err.message);
    } finally {
      clearAuthToken();
    }
  },

  /**
   * Logout user from all active devices & revoke all server sessions
   */
  logoutAll: async () => {
    try {
      await apiClient.post('/api/v1/auth/logout-all');
    } catch (err) {
      console.warn('Logout all devices warning:', err.message);
    } finally {
      clearAuthToken();
    }
  },

  getToken: getAuthToken,
  setToken: setAuthToken,
  clearToken: clearAuthToken,
};

export default authService;
