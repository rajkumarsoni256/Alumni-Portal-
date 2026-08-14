const messageService = require('../services/messageService');
const { successResponse } = require('../utils/response');

const createOrGetConversation = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    const data = await messageService.createOrGetConversation(req.user, targetUserId);
    return successResponse(res, data, 'Conversation ready', 201);
  } catch (err) {
    next(err);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const data = await messageService.getConversations(req.user.id);
    return successResponse(res, data, 'Conversations fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await messageService.getConversationById(req.user.id, id);
    return successResponse(res, data, 'Conversation fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await messageService.getMessages(req.user.id, id, req.query);
    return successResponse(res, data, 'Messages fetched successfully');
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await messageService.sendMessage(req.user, id, req.body);
    return successResponse(res, data, 'Message sent successfully', 201);
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await messageService.markAsRead(req.user.id, id);
    return successResponse(res, data, 'Conversation marked as read');
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const data = await messageService.getUnreadCount(req.user.id);
    return successResponse(res, data, 'Unread count fetched successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrGetConversation,
  getConversations,
  getConversationById,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
};
