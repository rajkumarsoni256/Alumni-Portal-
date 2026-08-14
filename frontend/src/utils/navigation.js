/**
 * Portal Navigation Utility
 * Centralizes role-aware routing logic for JECRC / JU Connect platform.
 */

/**
 * Returns the home path for a given user role.
 * @param {string} role - 'admin' | 'alumni' | 'student'
 * @returns {string} Target path
 */
export const getPortalHomePath = (role) => {
  const normalizedRole = String(role || '').toUpperCase();
  if (normalizedRole === 'ADMIN') {
    return '/admin/dashboard';
  }
  if (normalizedRole === 'ALUMNI') {
    return '/feed';
  }
  if (normalizedRole === 'STUDENT') {
    return '/feed';
  }
  return '/welcome';
};

/**
 * Returns the profile path for a given user role.
 * @param {string} role - 'admin' | 'alumni' | 'student'
 * @param {string} [userId] - Optional user ID for alumni/student
 * @returns {string} Target profile path
 */
export const getProfilePath = (role, userId) => {
  const normalizedRole = String(role || '').toUpperCase();
  if (normalizedRole === 'ADMIN') {
    return '/admin/profile';
  }
  if (normalizedRole === 'STUDENT') {
    return '/student-dashboard';
  }
  if (normalizedRole === 'ALUMNI') {
    return userId ? `/alumni/${userId}` : '/alumni-dashboard';
  }
  return '/profile';
};

/**
 * Returns the settings path for a given user role.
 * @param {string} role - 'admin' | 'alumni' | 'student'
 * @returns {string} Target settings path
 */
export const getSettingsPath = (role) => {
  const normalizedRole = String(role || '').toUpperCase();
  if (normalizedRole === 'ADMIN') {
    return '/admin/settings';
  }
  return '/settings';
};
