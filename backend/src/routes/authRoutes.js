const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationCode);
router.post('/send-verification', authController.resendVerificationCode);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
