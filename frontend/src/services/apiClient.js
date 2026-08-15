/**
 * Centralized API Client for JECRC Community Platform
 * Communicates with Express backend under /api/v1
 */

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').trim().replace(/\/+$/, '');
const API_BASE_URL = rawBaseUrl;
const JWT_STORAGE_KEY = 'jecrc_community_jwt';

let inMemoryToken = null;

export const getAuthToken = () => {
  return inMemoryToken || localStorage.getItem(JWT_STORAGE_KEY);
};

export const setAuthToken = (token) => {
  if (token) {
    inMemoryToken = token;
    localStorage.setItem(JWT_STORAGE_KEY, token);
  } else {
    inMemoryToken = null;
    localStorage.removeItem(JWT_STORAGE_KEY);
  }
};

export const clearAuthToken = () => {
  inMemoryToken = null;
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

// Single-refresh lock & promise queue to handle multiple concurrent 401s cleanly
let isRefreshing = false;
let refreshPromise = null;

const refreshAccessToken = async () => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const url = `${API_BASE_URL}/api/v1/auth/refresh`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Session expired or invalid refresh token');
      }

      const data = await response.json();
      const newAccessToken = data?.data?.accessToken || data?.accessToken;

      if (newAccessToken) {
        setAuthToken(newAccessToken);
        return newAccessToken;
      }
      throw new Error('No access token in refresh response');
    } catch (err) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }
      throw err;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Generic request wrapper using native fetch with silent token refresh interceptor
 */
export const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = `${API_BASE_URL}${cleanEndpoint}`;

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
    credentials: 'include', // Ensure HttpOnly cookies are passed with cross-origin & credentials requests
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

  // Intercept 401 Unauthorized for Access Token Expiration & Silent Refresh
  if (response.status === 401) {
    const isAuthEndpoint =
      cleanEndpoint.includes('/auth/login') ||
      cleanEndpoint.includes('/auth/refresh') ||
      cleanEndpoint.includes('/auth/register') ||
      cleanEndpoint.includes('/auth/google') ||
      cleanEndpoint.includes('/auth/verify-email') ||
      cleanEndpoint.includes('/auth/resend-verification') ||
      cleanEndpoint.includes('/auth/student/verify-otp');

    if (!isAuthEndpoint && !options._isRetry) {
      try {
        const newAccessToken = await refreshAccessToken();
        // Retry the original request once with the new access token
        return await request(endpoint, {
          ...options,
          _isRetry: true,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        });
      } catch (refreshErr) {
        // Refresh failed (e.g. 10-day session expired or session revoked)
        let message = 'Your session has expired. Please log in again.';
        throw new ApiError(message, 401, 'SESSION_EXPIRED');
      }
    }
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
      const isAuthEndpoint =
        cleanEndpoint.includes('/auth/login') ||
        cleanEndpoint.includes('/auth/register') ||
        cleanEndpoint.includes('/auth/google') ||
        cleanEndpoint.includes('/auth/verify-email') ||
        cleanEndpoint.includes('/auth/resend-verification');

      defaultMessage = isAuthEndpoint
        ? 'Invalid email or password.'
        : 'Session expired or unauthorized. Please log in again.';

      if (!isAuthEndpoint) {
        clearAuthToken();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
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
