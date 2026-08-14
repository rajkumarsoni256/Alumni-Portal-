const eventService = require('../services/eventService');
const { successResponse } = require('../utils/response');

const getEvents = async (req, res, next) => {
  try {
    const data = await eventService.getEvents(req.user.id, req.query);
    return successResponse(res, data, 'Events fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await eventService.getEventById(req.user.id, id);
    return successResponse(res, data, 'Event details fetched successfully');
  } catch (err) {
    next(err);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const data = await eventService.createEvent(req.user, req.body);
    return successResponse(res, data, 'Event created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await eventService.updateEvent(req.user, id, req.body);
    return successResponse(res, data, 'Event updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await eventService.deleteEvent(req.user, id);
    return successResponse(res, data, 'Event deleted successfully');
  } catch (err) {
    next(err);
  }
};

const registerForEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await eventService.registerForEvent(req.user, id);
    return successResponse(res, data, 'Registered for event successfully');
  } catch (err) {
    next(err);
  }
};

const cancelRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await eventService.cancelRegistration(req.user, id);
    return successResponse(res, data, 'Event registration cancelled');
  } catch (err) {
    next(err);
  }
};

const getMyRegistrations = async (req, res, next) => {
  try {
    const data = await eventService.getMyRegistrations(req.user);
    return successResponse(res, data, 'My event registrations fetched successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
};
