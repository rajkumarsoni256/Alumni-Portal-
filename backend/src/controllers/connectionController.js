const connectionService = require('../services/connectionService');
const { successResponse } = require('../utils/response');

const sendRequest = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    const result = await connectionService.sendRequest(req.user, targetUserId);
    return successResponse(res, result, 'Connection request sent successfully', 201);
  } catch (err) {
    next(err);
  }
};

const acceptRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await connectionService.acceptRequest(req.user, id);
    return successResponse(res, result, 'Connection request accepted');
  } catch (err) {
    next(err);
  }
};

const declineRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await connectionService.declineRequest(req.user, id);
    return successResponse(res, result, 'Connection request declined');
  } catch (err) {
    next(err);
  }
};

const cancelRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await connectionService.cancelRequest(req.user, id);
    return successResponse(res, result, 'Connection request cancelled');
  } catch (err) {
    next(err);
  }
};

const removeConnection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await connectionService.removeConnection(req.user, id);
    return successResponse(res, result, 'Connection removed');
  } catch (err) {
    next(err);
  }
};

const getConnectionStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await connectionService.getConnectionStatus(req.user, userId);
    return successResponse(res, result, 'Connection status fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getIncomingRequests = async (req, res, next) => {
  try {
    const result = await connectionService.getIncomingRequests(req.user);
    return successResponse(res, result, 'Incoming connection requests fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getOutgoingRequests = async (req, res, next) => {
  try {
    const result = await connectionService.getOutgoingRequests(req.user);
    return successResponse(res, result, 'Outgoing connection requests fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getMyConnections = async (req, res, next) => {
  try {
    const result = await connectionService.getMyConnections(req.user);
    return successResponse(res, result, 'Accepted connections fetched successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendRequest,
  acceptRequest,
  declineRequest,
  cancelRequest,
  removeConnection,
  getConnectionStatus,
  getIncomingRequests,
  getOutgoingRequests,
  getMyConnections,
};
