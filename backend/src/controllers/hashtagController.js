const hashtagService = require('../services/hashtagService');
const { successResponse } = require('../utils/response');

const getTrendingHashtags = async (req, res, next) => {
  try {
    const limit = req.query.limit || 10;
    const data = await hashtagService.getTrendingHashtags(limit);
    return successResponse(res, data, 'Trending hashtags fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getPostsByHashtag = async (req, res, next) => {
  try {
    const { hashtag } = req.params;
    const data = await hashtagService.getPostsByHashtag(hashtag, req.user?.id, req.query);
    return successResponse(res, data, `Posts for #${hashtag} fetched successfully`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTrendingHashtags,
  getPostsByHashtag,
};
