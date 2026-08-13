/**
 * JECRC Community — Mock Authentication Service
 * 
 * Production-ready mock auth layer simulating async REST API responses.
 * Structured so that this file can later be swapped with real Axios / Fetch API endpoints.
 */

import { MOCK_USERS, MOCK_STUDENT } from '../data/mockData';

// Storage key for local mock session
const AUTH_STORAGE_KEY = 'jecrc_community_auth';

export const TEST_ACCOUNTS = {
  student: {
    email: 'student@jecrc.test',
    password: 'password123',
    name: 'Tokir Khan',
    role: 'student',
    headline: 'B.Tech CSE (AI-ML) | 3rd Year • Seeking SDE / AI Internships',
    batch: 'JECRC CSE • 2026',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
  },
  alumni: {
    email: 'alumni@jecrc.test',
    password: 'password123',
    name: 'Priya Sharma',
    role: 'alumni',
    headline: 'Senior AI Engineer @ Google | LLMs & Distributed Systems',
    company: 'Google',
    batch: 'JECRC CSE • 2018',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
  },
  admin: {
    email: 'admin@jecrc.test',
    password: 'password123',
    name: 'Dean of Alumni Relations',
    role: 'admin',
    headline: 'JECRC University Administration',
    batch: 'Faculty & Admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300',
  }
};

export const authService = {
  /**
   * Simulate user login
   */
  login: async ({ email, password }) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const cleanEmail = email.toLowerCase().trim();
        
        // Check test accounts first
        if (cleanEmail === TEST_ACCOUNTS.student.email && password === TEST_ACCOUNTS.student.password) {
          const user = {
            id: 'st_101',
            ...TEST_ACCOUNTS.student,
            emailVerified: true,
            profileCompleted: true,
          };
          resolve({ user, token: 'mock-jwt-token-student-123' });
          return;
        }

        if (cleanEmail === TEST_ACCOUNTS.alumni.email && password === TEST_ACCOUNTS.alumni.password) {
          const user = {
            id: 'alm_1',
            ...TEST_ACCOUNTS.alumni,
            emailVerified: true,
            profileCompleted: true,
          };
          resolve({ user, token: 'mock-jwt-token-alumni-456' });
          return;
        }

        if (cleanEmail === TEST_ACCOUNTS.admin.email && password === TEST_ACCOUNTS.admin.password) {
          const user = {
            id: 'admin_1',
            ...TEST_ACCOUNTS.admin,
            emailVerified: true,
            profileCompleted: true,
          };
          resolve({ user, token: 'mock-jwt-token-admin-789' });
          return;
        }

        // Generic mock acceptance if email has @ and password is >= 6 chars
        if (cleanEmail.includes('@') && password && password.length >= 6) {
          const isAlumni = cleanEmail.includes('alumni') || cleanEmail.includes('google') || cleanEmail.includes('amazon');
          const name = cleanEmail.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase());
          const user = {
            id: `user_${Date.now()}`,
            email: cleanEmail,
            name: name || 'Community Member',
            role: isAlumni ? 'alumni' : 'student',
            headline: isAlumni ? 'Software Engineer • JECRC Alumni' : 'Student at JECRC University',
            batch: isAlumni ? 'JECRC Alumni' : 'Class of 2026',
            avatar: isAlumni ? TEST_ACCOUNTS.alumni.avatar : TEST_ACCOUNTS.student.avatar,
            emailVerified: true,
            profileCompleted: true,
          };
          resolve({ user, token: `mock-jwt-${Date.now()}` });
          return;
        }

        reject(new Error('Invalid email or password. Please check your credentials and try again.'));
      }, 600);
    });
  },

  /**
   * Simulate user registration
   */
  register: async ({ name, email, password, role = 'student' }) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const cleanEmail = email.toLowerCase().trim();
        if (!name || !cleanEmail || !password) {
          reject(new Error('Please fill in all required fields.'));
          return;
        }

        if (password.length < 8) {
          reject(new Error('Password must be at least 8 characters long.'));
          return;
        }

        const newUser = {
          id: `user_${Date.now()}`,
          name: name.trim(),
          email: cleanEmail,
          role,
          emailVerified: false,
          profileCompleted: false,
          avatar: role === 'alumni' ? TEST_ACCOUNTS.alumni.avatar : TEST_ACCOUNTS.student.avatar,
          headline: role === 'alumni' ? 'JECRC Graduate' : 'Student at JECRC University',
          batch: role === 'alumni' ? 'JECRC Alumni' : 'Class of 2026',
        };

        resolve({ user: newUser, token: `mock-jwt-reg-${Date.now()}` });
      }, 600);
    });
  },

  /**
   * Simulate 6-digit email OTP verification
   */
  verifyEmail: async ({ email, code }) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Any 6-digit code or default '123456' is valid in mock mode
        if (code && code.trim().length === 6) {
          resolve({ success: true, emailVerified: true });
        } else {
          reject(new Error('Invalid 6-digit verification code. Try entering 123456.'));
        }
      }, 500);
    });
  },

  /**
   * Simulate resending email OTP
   */
  resendVerificationCode: async (email) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: `Verification code resent to ${email}` });
      }, 400);
    });
  },

  /**
   * Simulate forgot password request
   */
  forgotPassword: async (email) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!email || !email.includes('@')) {
          reject(new Error('Please enter a valid email address.'));
          return;
        }
        resolve({ success: true, message: 'Password reset link sent to your email.' });
      }, 500);
    });
  },

  /**
   * Simulate password reset
   */
  resetPassword: async ({ newPassword }) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!newPassword || newPassword.length < 8) {
          reject(new Error('Password must be at least 8 characters long.'));
          return;
        }
        resolve({ success: true, message: 'Password has been reset successfully.' });
      }, 500);
    });
  },

  /**
   * Simulate onboarding profile completion
   */
  completeOnboarding: async ({ userId, profileData }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          profileCompleted: true,
          profileData,
        });
      }, 600);
    });
  },
};
