const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const adminDataQualityController = require('../controllers/adminDataQualityController');
const adminExportController = require('../controllers/adminExportController');
const adminVerificationController = require('../controllers/adminVerificationController');
const adminAuditController = require('../controllers/adminAuditController');
const adminDashboardController = require('../controllers/adminDashboardController');
const adminSettingsController = require('../controllers/adminSettingsController');
const adminNotificationController = require('../controllers/adminNotificationController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Phase 3 — Admin User Directory & Details
router.get('/users', authenticateToken, requireAdmin, adminUserController.getUsers);
router.get('/users/:id', authenticateToken, requireAdmin, adminUserController.getUserById);

// Phase 4 — Data Quality & Hygiene Stats
router.get('/data-quality/stats', authenticateToken, requireAdmin, adminDataQualityController.getDataQualityStats);

// Phase 5 — CSV Export & Data Streaming
router.post('/users/export', authenticateToken, requireAdmin, adminExportController.exportUsers);

// Phase 6 — Alumni Verification & Moderation
router.get('/verifications', authenticateToken, requireAdmin, adminVerificationController.getVerifications);
router.patch('/verifications/:id', authenticateToken, requireAdmin, adminVerificationController.updateVerificationStatus);

// Phase 7 — Admin Audit Logging & Activity Streams
router.get('/audit-logs', authenticateToken, requireAdmin, adminAuditController.getAuditLogs);
router.get('/activity', authenticateToken, requireAdmin, adminAuditController.getRecentActivity);

// Phase 8 — Admin Dashboard Analytics & Reporting
router.get('/dashboard/stats', authenticateToken, requireAdmin, adminDashboardController.getDashboardStats);

// Phase 9 — Admin Settings & System Configuration
router.get('/settings', authenticateToken, requireAdmin, adminSettingsController.getSettings);
router.patch('/settings', authenticateToken, requireAdmin, adminSettingsController.updateSettings);

// Phase 10 — Admin Communication & Notification Management
router.get('/notifications', authenticateToken, requireAdmin, adminNotificationController.getNotifications);
router.post('/notifications', authenticateToken, requireAdmin, adminNotificationController.createNotification);
router.post('/notifications/preview-audience', authenticateToken, requireAdmin, adminNotificationController.previewAudience);
router.get('/notifications/:id', authenticateToken, requireAdmin, adminNotificationController.getNotificationById);
router.patch('/notifications/:id', authenticateToken, requireAdmin, adminNotificationController.updateNotification);
router.post('/notifications/:id/publish', authenticateToken, requireAdmin, adminNotificationController.publishNotification);
router.post('/notifications/:id/cancel', authenticateToken, requireAdmin, adminNotificationController.cancelNotification);
router.delete('/notifications/:id', authenticateToken, requireAdmin, adminNotificationController.deleteNotification);

module.exports = router;
