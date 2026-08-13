const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Onboarding endpoints (POST /onboarding, PUT /onboarding)
router.post('/onboarding', authenticateToken, profileController.completeOnboarding);
router.put('/onboarding', authenticateToken, profileController.completeOnboarding);

// Profile me & update endpoints
router.get('/me', authenticateToken, profileController.getCurrentProfile);
router.put('/me', authenticateToken, profileController.updateProfile);
router.put('/profile', authenticateToken, profileController.updateProfile);

// Public profile retrieval by ID
router.get('/:userId', authenticateToken, profileController.getProfileById);

module.exports = router;
