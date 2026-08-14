/**
 * Profile Service Layer
 * 
 * Provides abstraction for retrieving and editing student and alumni profiles.
 * Communicates with backend REST API under /api/v1/profiles.
 */

import { apiClient } from './apiClient';

export const profileService = {
  /**
   * Submit onboarding data or create/update profile
   */
  createOrUpdateProfile: async (data) => {
    try {
      const res = await apiClient.post('/api/v1/profiles/onboarding', data);
      return res ? (res.profile || res) : null;
    } catch (err) {
      console.error('Failed to create/update profile:', err);
      throw err;
    }
  },

  /**
   * Submit onboarding data to backend
   */
  completeOnboarding: async (data) => {
    try {
      const res = await apiClient.post('/api/v1/profiles/onboarding', data);
      return res ? (res.profile || res) : null;
    } catch (err) {
      console.error('Backend onboarding failed:', err);
      throw err;
    }
  },

  /**
   * Fetch current user profile
   */
  getCurrentProfile: async () => {
    try {
      const res = await apiClient.get('/api/v1/profiles/me');
      return res ? (res.profile || res) : null;
    } catch (err) {
      console.warn('Failed to fetch current profile:', err);
      return null;
    }
  },

  /**
   * Update profile
   */
  updateProfile: async (data) => {
    try {
      const res = await apiClient.put('/api/v1/profiles/me', data);
      return res ? (res.profile || res) : null;
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  },

  /**
   * Fetch public profile by user ID
   * @param {string} userId
   */
  getProfileById: async (userId) => {
    try {
      const res = await apiClient.get(`/api/v1/profiles/${userId}`);
      return res ? (res.profile || res) : null;
    } catch (err) {
      console.warn(`Failed to fetch profile for user ${userId}:`, err);
      return null;
    }
  },

  /**
   * Update basic profile info
   */
  updateBasicInfo: async (userId, data) => {
    try {
      const res = await apiClient.put('/api/v1/profiles/me', data);
      return res ? (res.profile || res) : null;
    } catch (err) {
      console.error('Failed to update basic info:', err);
      throw err;
    }
  },

  /**
   * Update about summary / bio
   */
  updateAbout: async (userId, aboutText) => {
    try {
      const res = await apiClient.put('/api/v1/profiles/me', { bio: aboutText });
      return res ? (res.profile || res) : null;
    } catch (err) {
      console.error('Failed to update bio:', err);
      throw err;
    }
  },
};
