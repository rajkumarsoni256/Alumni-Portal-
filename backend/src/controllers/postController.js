const postService = require('../services/postService');
const { successResponse } = require('../utils/response');

const createPost = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    const post = await postService.createPost(req.user, req.body, files);
    return successResponse(res, post, 'Post created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getPosts = async (req, res, next) => {
  try {
    const authUserId = req.user ? req.user.id : null;
    const data = await postService.getPosts(authUserId, req.query);
    return successResponse(res, data, 'Community posts fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const authUserId = req.user ? req.user.id : null;
    const data = await postService.getPostById(authUserId, id);
    return successResponse(res, data, 'Post details fetched successfully');
  } catch (err) {
    next(err);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await postService.updatePost(req.user, id, req.body);
    return successResponse(res, data, 'Post updated successfully');
  } catch (err) {
    next(err);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await postService.deletePost(req.user, id);
    return successResponse(res, data, 'Post deleted successfully');
  } catch (err) {
    next(err);
  }
};

const toggleLikePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await postService.toggleLikePost(req.user, id);
    return successResponse(res, data, data.isLiked ? 'Post liked' : 'Post unliked');
  } catch (err) {
    next(err);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await postService.addComment(req.user, id, req.body);
    return successResponse(res, data, 'Comment added successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getCommentsByPostId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const authUserId = req.user ? req.user.id : null;
    const data = await postService.getCommentsByPostId(id, authUserId, req.query);
    return successResponse(res, data, 'Comments fetched successfully');
  } catch (err) {
    next(err);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const commentId = req.params.commentId || req.params.id;
    const data = await postService.updateComment(req.user, commentId, req.body);
    return successResponse(res, data, 'Comment updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const postId = req.params.postId || req.params.id;
    const commentId = req.params.commentId || req.params.id;
    const data = await postService.deleteComment(req.user, postId, commentId);
    return successResponse(res, data, 'Comment deleted successfully');
  } catch (err) {
    next(err);
  }
};

const toggleLikeComment = async (req, res, next) => {
  try {
    const commentId = req.params.commentId || req.params.id;
    const data = await postService.toggleLikeComment(req.user, commentId);
    return successResponse(res, data, 'Comment like toggled successfully');
  } catch (err) {
    next(err);
  }
};

const togglePinComment = async (req, res, next) => {
  try {
    const commentId = req.params.commentId || req.params.id;
    const data = await postService.togglePinComment(req.user, commentId);
    return successResponse(res, data, 'Comment pin status updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLikePost,
  addComment,
  getCommentsByPostId,
  updateComment,
  deleteComment,
  toggleLikeComment,
  togglePinComment,
};
