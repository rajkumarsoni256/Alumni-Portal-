/**
 * Centralized API Client for JECRC Community Platform
 * Communicates with Express backend under /api/v1
 */

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').trim().replace(/\/+$/, '');
const API_BASE_URL = rawBaseUrl;
const JWT_STORAGE_KEY = 'jecrc_community_jwt';

let inMemoryToken = null;

export const getAuthToken = () => inMemoryToken || localStorage.getItem(JWT_STORAGE_KEY);

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

export const resolveMediaUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return null;
  const clean = urlStr.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:') || clean.startsWith('blob:')) return clean;
  const cleanPath = clean.startsWith('/') ? clean : `/${clean}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export class ApiError extends Error {
  constructor(message, status, errorCode = null, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.errors = errors;
  }
}

// Single refresh lock prevents a dashboard burst of expired-token requests
// from rotating the refresh token multiple times concurrently.
let isRefreshing = false;
let refreshPromise = null;

const refreshAccessToken = async () => {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Session expired or invalid refresh token');
      }

      const data = await response.json();
      const newAccessToken = data?.data?.accessToken || data?.accessToken || data?.data?.token || data?.token;
      if (!newAccessToken) throw new Error('No access token in refresh response');

      setAuthToken(newAccessToken);
      return newAccessToken;
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
    if (queryString) url += (url.includes('?') ? '&' : '?') + queryString;
  }

  const isFormData = typeof options.body === 'object' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const config = {
    ...options,
    headers,
    credentials: 'include',
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

  const isAuthEndpoint =
    cleanEndpoint.includes('/auth/login') ||
    cleanEndpoint.includes('/auth/refresh') ||
    cleanEndpoint.includes('/auth/register') ||
    cleanEndpoint.includes('/auth/google') ||
    cleanEndpoint.includes('/auth/verify-email') ||
    cleanEndpoint.includes('/auth/resend-verification') ||
    cleanEndpoint.includes('/auth/student/verify-otp');

  // IMPORTANT: only attempt silent refresh when the request actually carried
  // an access token. This prevents logged-out/public pages from calling
  // /auth/refresh and producing "Refresh token is required" noise.
  if (response.status === 401 && token && !isAuthEndpoint && !options._isRetry) {
    try {
      const newAccessToken = await refreshAccessToken();
      return await request(endpoint, {
        ...options,
        _isRetry: true,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newAccessToken}`,
        },
      });
    } catch (refreshErr) {
      throw new ApiError('Your session has expired. Please log in again.', 401, 'SESSION_EXPIRED');
    }
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let defaultMessage = `HTTP error ${response.status}`;
    if (response.status === 401) {
      defaultMessage = isAuthEndpoint
        ? 'Invalid email or password.'
        : 'Session expired or unauthorized. Please log in again.';

      // Do not broadcast session-expired when the user was never authenticated.
      if (!isAuthEndpoint && token) {
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

  if (data && typeof data === 'object' && 'success' in data) {
    if (data.data !== undefined && data.data !== null) {
      if (Array.isArray(data.data)) {
        const arrayResult = data.data;
        arrayResult.data = data.data;
        arrayResult.notifications = data.data;
        arrayResult.comments = data.data;
        arrayResult.requests = data.data;
        arrayResult.connections = data.data;
        arrayResult.posts = data.data;
        arrayResult.summary = data.summary;
        arrayResult.pagination = data.pagination;
        arrayResult.totalCount = data.pagination?.totalCount ?? data.data.length;
        arrayResult.totalPages = data.pagination?.totalPages ?? 1;
        arrayResult.page = data.pagination?.page ?? 1;
        arrayResult.pageSize = data.pagination?.pageSize ?? data.data.length;
        arrayResult.hasNext = data.pagination?.hasNext ?? false;
        arrayResult.hasPrev = data.pagination?.hasPrev ?? false;
        if (data.message) arrayResult.message = data.message;
        return arrayResult;
      }
      if (typeof data.data === 'object' && data.message && !data.data.message) data.data.message = data.message;
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
  resolveMediaUrl,
};
