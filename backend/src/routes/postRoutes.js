const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { uploadPostMedia } = require('../middleware/uploadMiddleware');

// Post CRUD
router.post('/', authenticateToken, uploadPostMedia, postController.createPost);
router.get('/', authenticateToken, postController.getPosts);
router.get('/:id', authenticateToken, postController.getPostById);
router.put('/:id', authenticateToken, uploadPostMedia, postController.updatePost);
router.patch('/:id', authenticateToken, uploadPostMedia, postController.updatePost);
router.delete('/:id', authenticateToken, postController.deletePost);

// Likes & Comments
router.post('/:id/like', authenticateToken, postController.toggleLikePost);
router.post('/:id/comments', authenticateToken, postController.addComment);
router.get('/:id/comments', authenticateToken, postController.getCommentsByPostId);
router.patch('/:postId/comments/:commentId', authenticateToken, postController.updateComment);
router.delete('/:postId/comments/:commentId', authenticateToken, postController.deleteComment);

// Direct Comment operations
router.post('/comments/:commentId/like', authenticateToken, postController.toggleLikeComment);
router.patch('/comments/:commentId/pin', authenticateToken, postController.togglePinComment);
router.post('/comments/:commentId/pin', authenticateToken, postController.togglePinComment);
router.patch('/comments/:commentId', authenticateToken, postController.updateComment);
router.delete('/comments/:commentId', authenticateToken, postController.deleteComment);

module.exports = router;
