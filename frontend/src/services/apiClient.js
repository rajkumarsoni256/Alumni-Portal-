/**
 * Centralized API Client for JECRC Community Platform
 * Communicates with Spring Boot backend under /api/v1
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const JWT_STORAGE_KEY = 'jecrc_community_jwt';

export const getAuthToken = () => {
  return localStorage.getItem(JWT_STORAGE_KEY);
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(JWT_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(JWT_STORAGE_KEY);
  }
};

export const clearAuthToken = () => {
  localStorage.removeItem(JWT_STORAGE_KEY);
};

/**
 * Custom Error class capturing API error responses
 */
export class ApiError extends Error {
  constructor(message, status, errorCode = null, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.errors = errors;
  }
}

/**
 * Generic request wrapper using native fetch
 */
export const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    throw new ApiError('Unable to connect to backend service. Please ensure the server is running.', 0, 'NETWORK_ERROR');
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  }

  if (!response.ok) {
    const message = (data && data.message) || `HTTP error ${response.status}`;
    const errorCode = (data && data.errorCode) || 'UNKNOWN_ERROR';
    const errors = (data && data.errors) || null;

    throw new ApiError(message, response.status, errorCode, errors);
  }

  // Handle standard ApiResponse wrapper: { success: true, message: '...', data: T }
  if (data && typeof data === 'object' && 'success' in data) {
    return data.data !== undefined ? data.data : data;
  }

  return data;
};

export const apiClient = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};
