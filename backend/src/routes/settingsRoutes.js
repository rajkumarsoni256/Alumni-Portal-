const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const adminSettingsService = require('../services/adminSettingsService');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public system settings status (e.g. maintenance mode check)
router.get('/settings/public', async (req, res, next) => {
  try {
    const data = await adminSettingsService.getPublicSettings();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// General Settings
router.get('/settings', authenticateToken, settingsController.getSettings);
router.patch('/settings', authenticateToken, settingsController.updateSettings);
router.put('/settings', authenticateToken, settingsController.updateSettings);

// Specialized Settings Sub-routes
router.patch('/settings/privacy', authenticateToken, settingsController.updateSettings);
router.patch('/settings/notifications', authenticateToken, settingsController.updateSettings);
router.patch('/settings/messaging', authenticateToken, settingsController.updateSettings);
router.patch('/settings/career', authenticateToken, settingsController.updateSettings);
router.patch('/settings/appearance', authenticateToken, settingsController.updateSettings);

// Account Actions
router.post('/settings/account/email', authenticateToken, settingsController.changeEmail);
router.post('/settings/account/password', authenticateToken, settingsController.changePassword);
router.post('/settings/account/deactivate', authenticateToken, settingsController.deactivateAccount);
router.delete('/settings/account', authenticateToken, settingsController.deleteAccount);
router.post('/settings/account/delete', authenticateToken, settingsController.deleteAccount);

// Data Export
router.get('/settings/data/export', authenticateToken, settingsController.exportUserData);

// Sessions
router.get('/settings/sessions', authenticateToken, settingsController.getActiveSessions);
router.delete('/settings/sessions/:sessionId', authenticateToken, settingsController.revokeSession);

// Blocked Users Endpoints (/blocks and /settings/blocks)
router.get('/blocks', authenticateToken, settingsController.getBlockedUsers);
router.post('/blocks', authenticateToken, settingsController.blockUser);
router.post('/blocks/:userId', authenticateToken, settingsController.blockUser);
router.delete('/blocks/:userId', authenticateToken, settingsController.unblockUser);

router.get('/settings/blocks', authenticateToken, settingsController.getBlockedUsers);
router.post('/settings/blocks', authenticateToken, settingsController.blockUser);
router.post('/settings/blocks/:userId', authenticateToken, settingsController.blockUser);
router.delete('/settings/blocks/:userId', authenticateToken, settingsController.unblockUser);

module.exports = router;
