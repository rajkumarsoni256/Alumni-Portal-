const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const profileController = require('../controllers/profileController');
const connectionController = require('../controllers/connectionController');
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/authMiddleware');

// Profile & Connection aliases under /users
router.get('/me', authenticateToken, profileController.getCurrentProfile);
router.put('/me', authenticateToken, profileController.updateProfile);
router.put('/onboarding', authenticateToken, profileController.completeOnboarding);
router.post('/onboarding', authenticateToken, profileController.completeOnboarding);
router.put('/profile', authenticateToken, profileController.updateProfile);
router.get('/connections', authenticateToken, connectionController.getMyConnections);
router.get('/:userId/connections', authenticateToken, connectionController.getUserConnections);

// Discovery API (Optional auth for public featured alumni landing page)
router.get('/', optionalAuthenticateToken, userController.getUsers);

// Public profile retrieval by ID
router.get('/:id', optionalAuthenticateToken, userController.getUserById);

module.exports = router;
