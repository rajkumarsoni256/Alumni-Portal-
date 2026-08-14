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
  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (options.params && typeof options.params === 'object') {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          if (value.length > 0) searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const isFormData = typeof options.body === 'object' && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !isFormData) {
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
    let defaultMessage = `HTTP error ${response.status}`;
    if (response.status === 401) {
      defaultMessage = 'Session expired or unauthorized. Please log in again.';
      // Clear dead JWT so future requests do not resend it, and notify app.
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }
    } else if (response.status === 403) {
      defaultMessage = 'Access denied. Administrative privileges are required.';
    } else if (response.status === 404) {
      defaultMessage = 'Requested resource not found.';
    } else if (response.status >= 500) {
      defaultMessage = 'Internal server error. Please try again later.';
    }

    const message = (data && data.message) || defaultMessage;
    const errorCode = (data && data.errorCode) || 'UNKNOWN_ERROR';
    const errors = (data && data.errors) || null;

    throw new ApiError(message, response.status, errorCode, errors);
  }

  // Handle standard ApiResponse wrapper: { success: true, message: '...', data: T }
  if (data && typeof data === 'object' && 'success' in data) {
    if (data.data !== undefined) {
      // When the payload is a list, always pass through the full enriched
      // envelope (summary, pagination, etc.) so callers get metadata even
      // if only one of those keys is present in a given response.
      if (Array.isArray(data.data)) {
        return {
          notifications: data.data,
          data: data.data,
          summary: data.summary ?? undefined,
          pagination: data.pagination ?? undefined,
          totalCount: data.pagination?.totalCount ?? data.data.length,
          totalPages: data.pagination?.totalPages ?? 1,
          page: data.pagination?.page ?? 1,
          pageSize: data.pagination?.pageSize ?? 20,
          hasNext: data.pagination?.hasNext ?? false,
          hasPrev: data.pagination?.hasPrev ?? false,
        };
      }
      return data.data;
    }
    return data;
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
