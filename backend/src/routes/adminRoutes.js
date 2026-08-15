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
const adminModerationController = require('../controllers/adminModerationController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const adminContentController = require('../controllers/adminContentController');

// Phase 3 & 12D & 13 & 14 — Admin User Directory, Details, Role Promotion, Approvals & Account Status Control
router.get('/users', authenticateToken, requireAdmin, adminUserController.getUsers);
router.get('/users/stats', authenticateToken, requireAdmin, adminUserController.getUserStats);
router.get('/users/pending-alumni', authenticateToken, requireAdmin, adminUserController.getPendingAlumni);
router.get('/users/:id', authenticateToken, requireAdmin, adminUserController.getUserById);
router.patch('/users/:id/role', authenticateToken, requireAdmin, adminUserController.changeUserRole);
router.patch('/users/:id/status', authenticateToken, requireAdmin, adminUserController.updateUserStatus);
router.patch('/users/:id/approve', authenticateToken, requireAdmin, adminUserController.approveUser);
router.patch('/users/:id/reject', authenticateToken, requireAdmin, adminUserController.rejectUser);

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

// Phase 8 & 14 — Admin Dashboard Analytics & System Health
router.get('/dashboard/stats', authenticateToken, requireAdmin, adminDashboardController.getDashboardStats);
router.get('/health/email', authenticateToken, requireAdmin, adminDashboardController.getEmailHealthStats);

// Phase 9 — Admin Settings & System Configuration
router.get('/settings', authenticateToken, requireAdmin, adminSettingsController.getSettings);
router.patch('/settings', authenticateToken, requireAdmin, adminSettingsController.updateSettings);

// Phase 10 & 13 — Admin Communication & Notification Inbox Management
router.get('/notifications/inbox', authenticateToken, requireAdmin, adminNotificationController.getNotificationInbox);
router.patch('/notifications/read-all', authenticateToken, requireAdmin, adminNotificationController.markAllNotificationsRead);
router.patch('/notifications/:id/read', authenticateToken, requireAdmin, adminNotificationController.markNotificationRead);
router.get('/notifications', authenticateToken, requireAdmin, adminNotificationController.getNotifications);
router.post('/notifications', authenticateToken, requireAdmin, adminNotificationController.createNotification);
router.post('/notifications/preview-audience', authenticateToken, requireAdmin, adminNotificationController.previewAudience);
router.get('/notifications/:id', authenticateToken, requireAdmin, adminNotificationController.getNotificationById);
router.patch('/notifications/:id', authenticateToken, requireAdmin, adminNotificationController.updateNotification);
router.post('/notifications/:id/publish', authenticateToken, requireAdmin, adminNotificationController.publishNotification);
router.post('/notifications/:id/cancel', authenticateToken, requireAdmin, adminNotificationController.cancelNotification);
router.delete('/notifications/:id', authenticateToken, requireAdmin, adminNotificationController.deleteNotification);

// Phase 12 & 14 — Admin Content Moderation & Oversight
router.get('/posts', authenticateToken, requireAdmin, adminContentController.getAdminPosts);
router.delete('/posts/:id', authenticateToken, requireAdmin, adminModerationController.deletePost);
router.delete('/comments/:id', authenticateToken, requireAdmin, adminModerationController.deleteComment);

// Phase 14 — Admin Job Management
router.get('/jobs', authenticateToken, requireAdmin, adminContentController.getAdminJobs);
router.post('/jobs', authenticateToken, requireAdmin, adminContentController.createAdminJob);
router.get('/jobs/:id', authenticateToken, requireAdmin, adminContentController.getAdminJobById);
router.put('/jobs/:id', authenticateToken, requireAdmin, adminContentController.updateAdminJob);
router.patch('/jobs/:id/status', authenticateToken, requireAdmin, adminContentController.updateAdminJobStatus);
router.delete('/jobs/:id', authenticateToken, requireAdmin, adminModerationController.deleteJob);
router.get('/jobs/:id/applications', authenticateToken, requireAdmin, adminContentController.getJobApplicants);
router.post('/jobs/:id/applications/export', authenticateToken, requireAdmin, adminContentController.exportJobApplicants);

// Phase 14 — Admin Event Management
router.get('/events', authenticateToken, requireAdmin, adminContentController.getAdminEvents);
router.post('/events', authenticateToken, requireAdmin, adminContentController.createAdminEvent);
router.get('/events/:id', authenticateToken, requireAdmin, adminContentController.getAdminEventById);
router.patch('/events/:id/status', authenticateToken, requireAdmin, adminContentController.updateAdminEventStatus);
router.get('/events/:id/registrations', authenticateToken, requireAdmin, adminContentController.getEventAttendees);
router.post('/events/:id/registrations/export', authenticateToken, requireAdmin, adminContentController.exportEventAttendees);

// Phase 14 — Connections & Mentorship Oversight
router.get('/connections', authenticateToken, requireAdmin, adminContentController.getAdminConnections);
router.get('/mentorship', authenticateToken, requireAdmin, adminContentController.getAdminMentorship);

// Phase 13 — Graduation Lifecycle Detection Trigger
const { processStudentGraduations } = require('../services/graduationLifecycleService');
router.post('/lifecycle/graduation-check', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { year } = req.body || {};
    const result = await processStudentGraduations({ year });
    res.status(200).json({ success: true, message: 'Student graduation lifecycle check completed.', data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
