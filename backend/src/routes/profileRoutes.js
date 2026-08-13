const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/onboarding', authenticateToken, profileController.completeOnboarding);
router.get('/me', authenticateToken, profileController.getCurrentProfile);
router.put('/me', authenticateToken, profileController.updateProfile);
router.get('/:userId', authenticateToken, profileController.getProfileById);

module.exports = router;
