/**
 * JECRC Community — Real Authentication Service
 * Communicates with Express backend via /api/v1/auth
 */

import { apiClient, setAuthToken, clearAuthToken, getAuthToken } from './apiClient';

export const authService = {
  register: async (payload) => {
    const formattedRole = payload && payload.role ? String(payload.role).toUpperCase() : 'ALUMNI';
    return apiClient.post('/api/v1/auth/register', {
      ...payload,
      email: payload && payload.email ? payload.email.trim().toLowerCase() : '',
      role: formattedRole,
    });
  },

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

  /** Silently restore the session using the HttpOnly refresh cookie. */
  refreshToken: async () => {
    const response = await apiClient.post('/api/v1/auth/refresh');
    const token = response?.accessToken || response?.token;
    if (!token) throw new Error('No access token returned by refresh endpoint');
    setAuthToken(token);
    return response;
  },

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

  verifyEmail: async ({ email, code }) => {
    return apiClient.post('/api/v1/auth/verify-email', {
      email: email.trim().toLowerCase(),
      code: code.trim(),
    });
  },

  forgotPassword: async (email) => {
    return apiClient.post('/api/v1/auth/forgot-password', {
      email: email.trim().toLowerCase(),
    });
  },

  resetPassword: async ({ token, code, email, newPassword }) => {
    return apiClient.post('/api/v1/auth/reset-password', {
      token,
      code,
      email,
      newPassword,
    });
  },

  getCurrentUser: async () => {
    const token = getAuthToken();
    if (!token) return null;
    const response = await apiClient.get('/api/v1/auth/me');
    return response && response.user ? response.user : response;
  },

  logout: async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch (err) {
      console.warn('Backend logout notification warning:', err.message);
    } finally {
      clearAuthToken();
    }
  },

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
