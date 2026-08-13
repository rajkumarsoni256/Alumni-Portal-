/**
 * JECRC Community — Post & Feed Service Layer
 * 
 * Production-ready mock service simulating async REST API responses for posts,
 * comments, likes, shares, bookmarks, and user connections.
 * 
 * Ready to be swapped with backend endpoints (e.g. GET /api/posts?page=1&limit=20).
 */

import { MOCK_COMMUNITY_POSTS, MOCK_USERS } from '../data/mockData';

export const postService = {
  /**
   * Fetch paginated and filtered community posts
   */
  getPosts: async ({ page = 1, limit = 20, filter = 'all', searchQuery = '' } = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let allPosts = [...MOCK_COMMUNITY_POSTS];

        // Apply tab category filtering
        let filtered = allPosts.filter((post) => {
          const author = MOCK_USERS[post.authorId] || {};

          if (filter === 'alumni' && post.category !== 'alumni' && !author.isAlumni) return false;
          if (filter === 'student' && post.category !== 'student' && author.isAlumni) return false;
          if (filter === 'jobs' && post.type !== 'JOB') return false;
          if (filter === 'saved' && !post.savedByCurrentUser) return false;

          // Apply search filtering
          if (searchQuery && searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const matchesContent = post.content && post.content.toLowerCase().includes(q);
            const matchesAuthor = author.name && author.name.toLowerCase().includes(q);
            const matchesTags = post.tags && post.tags.some((t) => t.toLowerCase().includes(q));
            const matchesJob = post.jobData && (
              (post.jobData.title && post.jobData.title.toLowerCase().includes(q)) ||
              (post.jobData.company && post.jobData.company.toLowerCase().includes(q))
            );

            return matchesContent || matchesAuthor || matchesTags || matchesJob;
          }

          return true;
        });

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const pagedData = filtered.slice(startIndex, endIndex);

        resolve({
          posts: pagedData,
          total: filtered.length,
          page,
          totalPages: Math.ceil(filtered.length / limit),
          hasMore: endIndex < filtered.length,
        });
      }, 100);
    });
  },

  /**
   * Create a new post
   */
  createPost: async (postData, currentUser) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPost = {
          id: `post_${Date.now()}`,
          authorId: currentUser.id,
          createdAt: 'Just now',
          timestamp: Date.now(),
          content: postData.content.trim(),
          type: postData.type || 'TEXT',
          category: currentUser.isAlumni ? 'alumni' : 'student',
          image: postData.image || null,
          jobData: postData.jobData || null,
          achievementData: postData.achievementData || null,
          likes: 0,
          likedByCurrentUser: false,
          savedByCurrentUser: false,
          commentsCount: 0,
          sharesCount: 0,
          tags: postData.tags || ['#JECRCCommunity'],
          comments: [],
        };
        resolve(newPost);
      }, 80);
    });
  },

  /**
   * Edit an existing post
   */
  editPost: async (postId, updatedFields) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          postId,
          ...updatedFields,
          updatedAt: 'Edited just now',
        });
      }, 80);
    });
  },

  /**
   * Delete a post
   */
  deletePost: async (postId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, postId });
      }, 80);
    });
  },

  /**
   * Toggle Like on a post
   */
  toggleLike: async (postId, currentlyLiked) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          postId,
          liked: !currentlyLiked,
        });
      }, 50);
    });
  },

  /**
   * Toggle Save on a post
   */
  toggleSave: async (postId, currentlySaved) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          postId,
          saved: !currentlySaved,
        });
      }, 50);
    });
  },

  /**
   * Add a comment to a post
   */
  addComment: async (postId, { content, authorId }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newComment = {
          id: `c_${Date.now()}`,
          authorId,
          content: content.trim(),
          createdAt: 'Just now',
          likes: 0,
          likedByCurrentUser: false,
          replies: [],
        };
        resolve(newComment);
      }, 80);
    });
  },

  /**
   * Add a single-level reply to a comment
   */
  addReply: async (postId, commentId, { content, authorId }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newReply = {
          id: `r_${Date.now()}`,
          authorId,
          content: content.trim(),
          createdAt: 'Just now',
        };
        resolve(newReply);
      }, 80);
    });
  },

  /**
   * Toggle Like on a comment
   */
  toggleCommentLike: async (postId, commentId, currentlyLiked) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          postId,
          commentId,
          liked: !currentlyLiked,
        });
      }, 50);
    });
  },

  /**
   * Toggle connection request status (none <-> pending)
   */
  toggleConnect: async (targetUserId, currentStatus) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const nextStatus = currentStatus === 'pending' ? 'none' : 'pending';
        resolve({
          targetUserId,
          status: nextStatus,
        });
      }, 80);
    });
  }
};
