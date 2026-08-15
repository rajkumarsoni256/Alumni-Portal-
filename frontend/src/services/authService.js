/**
 * JECRC Community — Real Authentication Service
 * Communicates with Spring Boot backend via /api/v1/auth
 */

import { apiClient, setAuthToken, clearAuthToken, getAuthToken } from './apiClient';

export const authService = {
  /**
   * Register new user (STUDENT or ALUMNI)
   */
  register: async ({ name, email, password, role = 'student' }) => {
    const formattedRole = role.toUpperCase(); // 'STUDENT' | 'ALUMNI'
    const response = await apiClient.post('/api/v1/auth/register', {
      name,
      email: email.trim().toLowerCase(),
      password,
      role: formattedRole,
    });
    // Returns { user: UserAuthResponse, message: string }
    return response;
  },

  /**
   * User login with email and password
   */
  login: async ({ email, password }) => {
    const response = await apiClient.post('/api/v1/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });
    // Response structure: { token: 'JWT...', user: { id, email, role } }
    if (response && response.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  /**
   * User login with verified Google OAuth ID Token
   */
  loginWithGoogle: async (idToken) => {
    const response = await apiClient.post('/api/v1/auth/google', {
      idToken,
    });
    if (response && response.token) {
      setAuthToken(response.token);
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
      // Response structure: { user: { id, email, role } } or unwrapped user
      if (response && response.user) {
        return response.user;
      }
      return response;
    } catch (err) {
      // If token is invalid or expired (401/403), clear local state
      clearAuthToken();
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
