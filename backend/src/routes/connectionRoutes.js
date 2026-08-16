const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Authenticated Routes
router.post('/request', authenticateToken, connectionController.sendRequest);
router.post('/:id/accept', authenticateToken, connectionController.acceptRequest);
router.post('/:id/decline', authenticateToken, connectionController.declineRequest);
router.post('/:id/cancel', authenticateToken, connectionController.cancelRequest);
router.delete('/:id', authenticateToken, connectionController.removeConnection);

router.get('/status/:userId', authenticateToken, connectionController.getConnectionStatus);
router.get('/suggestions', authenticateToken, connectionController.getSuggestions);
router.get('/requests/incoming', authenticateToken, connectionController.getIncomingRequests);
router.get('/requests/outgoing', authenticateToken, connectionController.getOutgoingRequests);
router.get('/', authenticateToken, connectionController.getMyConnections);
router.get('/my', authenticateToken, connectionController.getMyConnections);
router.get('/user/:userId', authenticateToken, connectionController.getUserConnections);

module.exports = router;
