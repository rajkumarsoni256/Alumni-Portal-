const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/', messageController.createOrGetConversation);
router.get('/', messageController.getConversations);
router.get('/unread-count', messageController.getUnreadCount);
router.get('/:id', messageController.getConversationById);
router.get('/:id/messages', messageController.getMessages);
router.post('/:id/messages', messageController.sendMessage);
router.patch('/:id/read', messageController.markAsRead);

module.exports = router;
