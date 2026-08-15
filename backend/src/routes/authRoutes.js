const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authRateLimiter } = require('../middleware/rateLimiter');

router.post('/register', authRateLimiter, authController.register);
router.post('/student/register-init', authRateLimiter, authController.initiateStudentRegistration);
router.post('/student/verify-otp', authRateLimiter, authController.verifyStudentRegistrationOTP);
router.post('/verify-email', authRateLimiter, authController.verifyEmail);
router.post('/resend-verification', authRateLimiter, authController.resendVerificationCode);
router.post('/send-verification', authRateLimiter, authController.resendVerificationCode);
router.post('/login', authRateLimiter, authController.login);
router.post('/google', authRateLimiter, authController.googleLogin);
router.post('/refresh', authRateLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticateToken, authController.logoutAll);
router.get('/session', authenticateToken, authController.getSession);
router.get('/sessions', authenticateToken, authController.getUserSessions);
router.delete('/sessions/:sessionId', authenticateToken, authController.revokeUserSession);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/reset-password', authRateLimiter, authController.resetPassword);
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
