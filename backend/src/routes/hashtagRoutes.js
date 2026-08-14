const express = require('express');
const router = express.Router();
const hashtagController = require('../controllers/hashtagController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public or authenticated trending hashtags
router.get('/trending', hashtagController.getTrendingHashtags);

// Posts by hashtag
router.get('/:hashtag/posts', authenticateToken, hashtagController.getPostsByHashtag);

module.exports = router;
