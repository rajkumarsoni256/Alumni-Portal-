const express = require('express');
const router = express.Router();
const mentorshipController = require('../controllers/mentorshipController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/requests', mentorshipController.getMentorshipRequests);
router.get('/requests/:id', mentorshipController.getMentorshipRequestById);
router.post('/requests', mentorshipController.createMentorshipRequest);
router.patch('/requests/:id', mentorshipController.updateMentorshipRequestStatus);

module.exports = router;
