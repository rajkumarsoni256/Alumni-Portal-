const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Post CRUD
router.post('/', authenticateToken, postController.createPost);
router.get('/', authenticateToken, postController.getPosts);
router.get('/:id', authenticateToken, postController.getPostById);
router.put('/:id', authenticateToken, postController.updatePost);
router.delete('/:id', authenticateToken, postController.deletePost);

// Likes & Comments
router.post('/:id/like', authenticateToken, postController.toggleLikePost);
router.post('/:id/comments', authenticateToken, postController.addComment);
router.get('/:id/comments', authenticateToken, postController.getCommentsByPostId);
router.delete('/:postId/comments/:commentId', authenticateToken, postController.deleteComment);

module.exports = router;
