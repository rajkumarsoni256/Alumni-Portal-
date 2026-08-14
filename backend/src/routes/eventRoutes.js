const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', eventController.getEvents);
router.get('/registrations/me', eventController.getMyRegistrations);
router.get('/:id', eventController.getEventById);
router.post('/', eventController.createEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

router.post('/:id/register', eventController.registerForEvent);
router.delete('/:id/register', eventController.cancelRegistration);

module.exports = router;
