const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticateToken } = require('../middleware/authMiddleware');

// User applications & bookmarks
router.get('/applications/me', authenticateToken, jobController.getMyApplications);
router.get('/bookmarks/me', authenticateToken, jobController.getMyBookmarks);

// Job CRUD & Discovery
router.post('/', authenticateToken, jobController.createJob);
router.get('/', authenticateToken, jobController.getJobs);
router.get('/:id', authenticateToken, jobController.getJobById);
router.put('/:id', authenticateToken, jobController.updateJob);
router.delete('/:id', authenticateToken, jobController.deleteJob);

// Bookmarking & Applying
router.post('/:id/bookmark', authenticateToken, jobController.toggleBookmarkJob);
router.post('/:id/apply', authenticateToken, jobController.applyForJob);

module.exports = router;
