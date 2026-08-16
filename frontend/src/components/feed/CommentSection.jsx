import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { postService } from '../../services/postService';
import { 
  Smile, 
  AtSign, 
  Loader2, 
  Heart, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  CornerDownRight, 
  ChevronDown, 
  MessageSquare,
  AlertCircle,
  Pin,
  PinOff
} from 'lucide-react';

const COMMON_EMOJIS = ['👍', '❤️', '👏', '🎉', '🔥', '💡', '🙌', '🚀', '😊', '🎯', '✨', '🤝'];

export const CommentSection = ({ post, forceExpanded = false, onExpand }) => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    usersMap, 
    myConnections, 
    addComment, 
    editComment, 
    deleteComment, 
    toggleLikeComment, 
    togglePinComment,
    showNotification 
  } = useApp();

  // Expansion & View Mode State
  const [isFullyExpanded, setIsFullyExpanded] = useState(forceExpanded);
  
  // Comment Data
  const [comments, setComments] = useState([]);
  const [totalCount, setTotalCount] = useState(post.commentsCount || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sorting & Pagination
  const [sortOption, setSortOption] = useState('recent'); // recent | oldest | popular
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Composer State
  const [commentText, setCommentText] = useState('');
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionList, setShowMentionList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active interaction states
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [expandedRepliesMap, setExpandedRepliesMap] = useState({});
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const textareaRef = useRef(null);
  const menuRef = useRef(null);
  const observerTarget = useRef(null);

  // Sync forceExpanded prop
  useEffect(() => {
    if (forceExpanded && !isFullyExpanded) {
      setIsFullyExpanded(true);
    }
  }, [forceExpanded]);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch comments (Preview or Full Thread)
  const fetchComments = async (isInitial = true, p = 1, sort = sortOption, expanded = isFullyExpanded) => {
    if (!post.id) return;
    if (isInitial) {
      setIsLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const limitVal = expanded ? 10 : 2;
      const res = await postService.getComments(post.id, {
        page: p,
        limit: limitVal,
        sort: sort,
      });

      const list = res.comments || [];
      const total = res.total !== undefined ? res.total : (res.totalCount || list.length);

      if (isInitial) {
        setComments(list);
        setTotalCount(total);
        setPage(p);
      } else {
        // Append & deduplicate by comment.id
        setComments((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const newUnique = list.filter((c) => !existingIds.has(c.id));
          return [...prev, ...newUnique];
        });
        setPage(p);
      }

      setHasMore(Boolean(res.hasMore));
    } catch (err) {
      console.warn('Failed to load comments:', err);
      if (isInitial) setError(err.message || 'Unable to load comments.');
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial fetch (runs on post.id change or sort change or expand toggle)
  useEffect(() => {
    fetchComments(true, 1, sortOption, isFullyExpanded);
  }, [post.id, sortOption, isFullyExpanded]);

  // Infinite Scroll Observer when fully expanded
  const handleObserver = useCallback((entries) => {
    const [target] = entries;
    if (target.isIntersecting && isFullyExpanded && hasMore && !loadingMore && !isLoading) {
      fetchComments(false, page + 1, sortOption, true);
    }
  }, [isFullyExpanded, hasMore, loadingMore, isLoading, page, sortOption]);

  useEffect(() => {
    const element = observerTarget.current;
    if (!element || !isFullyExpanded || !hasMore) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    observer.observe(element);
    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver, isFullyExpanded, hasMore]);

  // Expand Comments Thread
  const handleExpandAll = () => {
    setIsFullyExpanded(true);
    if (onExpand) onExpand();
  };

  // Handle Comment Submit
  const handleSubmitComment = async (e) => {
    if (e) e.preventDefault();
    const text = commentText.trim();
    if (!text || isSubmitting) return;

    setIsSubmitting(true);
    setShowEmojiPicker(false);
    setShowMentionList(false);

    const tempId = `temp_${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      postId: post.id,
      parentCommentId: null,
      authorId: currentUser?.id,
      authorName: currentUser?.name || 'You',
      authorAvatar: currentUser?.avatarUrl || currentUser?.avatar,
      authorRole: currentUser?.role || 'student',
      isAlumni: currentUser?.role === 'alumni',
      content: text,
      isPinned: false,
      likeCount: 0,
      likesCount: 0,
      likedByCurrentUser: false,
      likedByMe: false,
      replyCount: 0,
      replies: [],
      createdAt: 'Just now',
      createdAtRaw: new Date().toISOString(),
      author: {
        id: currentUser?.id,
        name: currentUser?.name || 'You',
        avatar: currentUser?.avatarUrl || currentUser?.avatar,
        headline: currentUser?.headline || 'JECRC Member',
      },
      isOptimistic: true,
    };

    setComments((prev) => [optimisticComment, ...prev]);
    setTotalCount((prev) => prev + 1);
    setCommentText('');
    setIsComposerExpanded(false);

    try {
      const result = await addComment(post.id, { content: text });
      const created = result?.comment || result;

      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? { ...created, isOptimistic: false } : c))
      );
    } catch (err) {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setTotalCount((prev) => Math.max(0, prev - 1));
      showNotification('Comment failed to post. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reply Submit
  const handleReplySubmit = async (parentComment) => {
    const text = replyText.trim();
    if (!text || isSubmittingReply) return;

    setIsSubmittingReply(true);

    const tempReplyId = `temp_reply_${Date.now()}`;
    const optimisticReply = {
      id: tempReplyId,
      postId: post.id,
      parentCommentId: parentComment.id,
      authorId: currentUser?.id,
      authorName: currentUser?.name || 'You',
      authorAvatar: currentUser?.avatarUrl || currentUser?.avatar,
      authorRole: currentUser?.role || 'student',
      isAlumni: currentUser?.role === 'alumni',
      content: text,
      likeCount: 0,
      likesCount: 0,
      likedByCurrentUser: false,
      likedByMe: false,
      createdAt: 'Just now',
      author: {
        id: currentUser?.id,
        name: currentUser?.name || 'You',
        avatar: currentUser?.avatarUrl || currentUser?.avatar,
        headline: currentUser?.headline || 'JECRC Member',
      },
    };

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === parentComment.id) {
          return {
            ...c,
            replyCount: (c.replyCount || 0) + 1,
            replies: [...(c.replies || []), optimisticReply],
          };
        }
        return c;
      })
    );

    setExpandedRepliesMap((prev) => ({ ...prev, [parentComment.id]: true }));
    setReplyText('');
    setReplyingToId(null);

    try {
      const res = await postService.addComment(post.id, {
        content: text,
        parentCommentId: parentComment.id,
      });

      const confirmedReply = res?.comment || res;

      setComments((prev) =>
        prev.map((c) => {
          if (c.id === parentComment.id) {
            return {
              ...c,
              replies: (c.replies || []).map((r) =>
                r.id === tempReplyId ? confirmedReply : r
              ),
            };
          }
          return c;
        })
      );
    } catch (err) {
      showNotification('Failed to post reply', 'error');
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === parentComment.id) {
            return {
              ...c,
              replyCount: Math.max(0, (c.replyCount || 1) - 1),
              replies: (c.replies || []).filter((r) => r.id !== tempReplyId),
            };
          }
          return c;
        })
      );
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Toggle Comment Like
  const handleToggleLikeComment = async (commentId) => {
    const toggleInList = (list) =>
      list.map((c) => {
        if (c.id === commentId) {
          const isLiked = c.likedByCurrentUser || c.likedByMe;
          const newCount = isLiked ? Math.max(0, (c.likeCount || c.likesCount || 0) - 1) : (c.likeCount || c.likesCount || 0) + 1;
          return {
            ...c,
            likedByCurrentUser: !isLiked,
            likedByMe: !isLiked,
            likeCount: newCount,
            likesCount: newCount,
          };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: toggleInList(c.replies) };
        }
        return c;
      });

    setComments((prev) => toggleInList(prev));

    try {
      const res = await toggleLikeComment(post.id, commentId);
      if (res) {
        const isLiked = res.likedByCurrentUser ?? res.isLiked ?? res.liked;
        const newCount = res.likeCount ?? res.likesCount;

        const updateConfirmedInList = (list) =>
          list.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                likedByCurrentUser: isLiked,
                likedByMe: isLiked,
                likeCount: newCount,
                likesCount: newCount,
              };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: updateConfirmedInList(c.replies) };
            }
            return c;
          });

        setComments((prev) => updateConfirmedInList(prev));
      }
    } catch (err) {
      console.warn('Comment like error:', err);
    }
  };

  // Toggle Pin Comment (Post Owner / Admin only)
  const handleTogglePinComment = async (comment) => {
    setActiveMenuId(null);
    const newPinned = !comment.isPinned;

    setComments((prev) => {
      return prev.map((c) => {
        if (c.id === comment.id) {
          return { ...c, isPinned: newPinned };
        }
        // If pinning a new comment, unpin any other comment
        if (newPinned) {
          return { ...c, isPinned: false };
        }
        return c;
      }).sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAtRaw || 0) - new Date(a.createdAtRaw || 0);
      });
    });

    try {
      await togglePinComment(comment.id);
    } catch (err) {
      showNotification(err.message || 'Failed to update comment pin status', 'error');
      fetchComments(true, 1, sortOption, isFullyExpanded);
    }
  };

  // Save Edit Comment
  const handleSaveEdit = async (commentId) => {
    const text = editText.trim();
    if (!text || isSavingEdit) return;

    setIsSavingEdit(true);

    const updateContentInList = (list) =>
      list.map((c) => {
        if (c.id === commentId) {
          return { ...c, content: text, edited: true };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: updateContentInList(c.replies) };
        }
        return c;
      });

    setComments((prev) => updateContentInList(prev));
    setEditingCommentId(null);
    setEditText('');

    try {
      await editComment(commentId, text);
    } catch (err) {
      showNotification(err.message || 'Failed to edit comment', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId) => {
    const deleteFromList = (list) =>
      list.filter((c) => c.id !== commentId).map((c) => {
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: deleteFromList(c.replies) };
        }
        return c;
      });

    setComments((prev) => deleteFromList(prev));
    setTotalCount((prev) => Math.max(0, prev - 1));
    setDeleteConfirmId(null);
    setActiveMenuId(null);

    try {
      await deleteComment(post.id, commentId);
    } catch (err) {
      showNotification('Failed to delete comment', 'error');
    }
  };

  // Helper: Format @Mentions into Red, Bold, Clickable Links
  const renderFormattedContent = (content) => {
    if (!content) return null;

    // Pattern matches @Name or @[Name](userId)
    const mentionRegex = /(@[A-Za-z0-9_\s]{2,30})/g;
    const parts = content.split(mentionRegex);

    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        const nameClean = part.slice(1).trim();
        
        // Find matching user in connections or usersMap
        const matchedUser = Object.values(usersMap || {}).find(
          (u) => (u.name || u.fullName || '').toLowerCase() === nameClean.toLowerCase()
        ) || (myConnections || []).find(
          (c) => (c.name || c.fullName || '').toLowerCase() === nameClean.toLowerCase()
        );

        const userId = matchedUser?.id || matchedUser?.userId;
        const linkPath = userId ? `/profile/${userId}` : '/network';

        return (
          <Link
            key={idx}
            to={linkPath}
            className="text-red-700 font-bold hover:underline cursor-pointer transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Helper: Append Emoji to Comment Text
  const handleInsertEmoji = (emoji) => {
    setCommentText((prev) => prev + emoji);
    if (textareaRef.current) textareaRef.current.focus();
  };

  // Helper: Insert Mention
  const handleInsertMention = (person) => {
    const name = person.name || person.fullName;
    setCommentText((prev) => `${prev}@${name} `);
    setShowMentionList(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  // Toggle Replies Expand/Collapse
  const toggleRepliesExpand = (commentId) => {
    setExpandedRepliesMap((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const isPostOwnerOrAdmin = currentUser && (
    currentUser.id === post.authorId || 
    currentUser.id === post.author_id || 
    (currentUser.role || '').toUpperCase() === 'ADMIN'
  );

  return (
    <div className="pt-3 space-y-3">
      {/* 1. ALWAYS-VISIBLE COMMENTS LIST (Preview of latest 2 or Full List) */}
      {isLoading && comments.length === 0 && (
        <div className="space-y-3 py-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-12 bg-slate-100 rounded-xl" />
                <div className="w-24 h-3 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ERROR STATE */}
      {!isLoading && error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-700 font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchComments(true, 1, sortOption, isFullyExpanded)}
            className="px-3 py-1 bg-rose-700 text-white rounded-lg hover:bg-rose-800 transition-colors cursor-pointer text-xs font-semibold"
          >
            Try again
          </button>
        </div>
      )}

      {/* RENDER COMMENTS (Preview or Full Thread) */}
      {!isLoading && !error && comments.length > 0 && (
        <div className="space-y-3">
          {/* Header Controls (Only when fully expanded) */}
          {isFullyExpanded && (
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900">All Comments</h4>
                <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-700">
                  {totalCount}
                </span>
              </div>

              <div className="relative flex items-center gap-1 text-xs text-slate-500 font-medium">
                <span>Sort:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 hover:text-red-700 cursor-pointer outline-none transition-colors border-none py-0.5 pr-4 appearance-none"
                >
                  <option value="recent">Most recent</option>
                  <option value="oldest">Oldest</option>
                  <option value="popular">Most liked</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none -ml-3" />
              </div>
            </div>
          )}

          {comments.map((comment) => {
            const author = comment.author || usersMap[comment.authorId] || {
              id: comment.authorId,
              name: comment.authorName || 'JECRC Member',
              avatar: comment.authorAvatar,
              headline: comment.authorRole || 'Community Member',
              isAlumni: comment.isAlumni || false,
            };

            const isAlumni = author.isAlumni || author.role === 'alumni' || author.role === 'ALUMNI';
            const authorId = author.id || comment.authorId;
            const profileLink = isAlumni ? `/alumni/${authorId}` : `/profile/${authorId}`;

            const isOwnComment = currentUser && (currentUser.id === authorId || currentUser.userId === authorId);
            const isEditing = editingCommentId === comment.id;
            const isReplying = replyingToId === comment.id;

            const replies = comment.replies || [];
            const hasReplies = replies.length > 0 || (comment.replyCount > 0);
            const areRepliesExpanded = Boolean(expandedRepliesMap[comment.id]);

            return (
              <div key={comment.id} className="space-y-2 group">
                <div className="flex items-start gap-3">
                  <Link to={profileLink} className="shrink-0">
                    <UserAvatar
                      src={author.avatar || author.avatarUrl || author.profilePhotoUrl || comment.authorAvatar}
                      name={author.name || comment.authorName}
                      className="w-8 h-8 shrink-0 mt-0.5 hover:ring-2 hover:ring-red-600/30 transition-all"
                    />
                  </Link>

                  <div className="flex-1 space-y-1 min-w-0">
                    {/* Content Card */}
                    <div className={`rounded-2xl p-3 space-y-1 relative transition-colors ${
                      comment.isPinned ? 'bg-amber-50/80 border border-amber-200/80' : 'bg-slate-100/90'
                    }`}>
                      {/* Pinned Badge Indicator */}
                      {comment.isPinned && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-800 pb-0.5">
                          <Pin className="w-3 h-3 fill-amber-700 text-amber-700" />
                          <span>Pinned comment</span>
                        </div>
                      )}

                      {/* Header Info */}
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            to={profileLink}
                            className="text-xs font-bold text-slate-900 hover:text-red-700 hover:underline truncate inline-block"
                          >
                            {author.name || comment.authorName}
                          </Link>
                          {author.headline && (
                            <span className="text-[11px] text-slate-500 font-normal truncate block leading-tight">
                              {author.headline}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {comment.createdAt}
                            {comment.edited && <span className="ml-1 text-[9px] font-semibold text-slate-400">(Edited)</span>}
                          </span>

                          {/* Options Menu Trigger (•••) */}
                          <div className="relative" ref={menuRef}>
                            <button
                              type="button"
                              onClick={() => setActiveMenuId((prev) => (prev === comment.id ? null : comment.id))}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                              title="Comment options"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Options Menu */}
                            {activeMenuId === comment.id && (
                              <div className="absolute right-0 top-6 z-20 bg-white border border-slate-200 rounded-xl shadow-md py-1 w-36 animate-in zoom-in-95 duration-100">
                                {isPostOwnerOrAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePinComment(comment)}
                                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    {comment.isPinned ? (
                                      <>
                                        <PinOff className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Unpin comment</span>
                                      </>
                                    ) : (
                                      <>
                                        <Pin className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Pin comment</span>
                                      </>
                                    )}
                                  </button>
                                )}

                                {isOwnComment && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommentId(comment.id);
                                      setEditText(comment.content);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Edit</span>
                                  </button>
                                )}

                                {(isOwnComment || isPostOwnerOrAdmin) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteConfirmId(comment.id);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                )}

                                {!isOwnComment && !isPostOwnerOrAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      showNotification('Comment reported to moderators', 'info');
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Report</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Content or Edit Form */}
                      {isEditing ? (
                        <div className="pt-2 space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={2}
                            className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-slate-500 text-slate-900"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingCommentId(null)}
                              className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(comment.id)}
                              disabled={!editText.trim() || isSavingEdit}
                              className="px-3 py-1 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-md cursor-pointer disabled:opacity-50"
                            >
                              {isSavingEdit ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-800 font-normal leading-relaxed whitespace-pre-line pt-0.5">
                          {renderFormattedContent(comment.content)}
                        </div>
                      )}
                    </div>

                    {/* Actions Row: Like, Reply, Thread Toggle */}
                    <div className="flex items-center gap-4 pl-2 pt-0.5 text-[11px] text-slate-500 font-medium">
                      <button
                        type="button"
                        onClick={() => handleToggleLikeComment(comment.id)}
                        className={`hover:text-red-700 transition-colors cursor-pointer inline-flex items-center gap-1 ${
                          (comment.likedByCurrentUser || comment.likedByMe) ? 'text-red-700 font-bold' : ''
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            (comment.likedByCurrentUser || comment.likedByMe) ? 'fill-red-700 text-red-700' : ''
                          }`}
                        />
                        <span>
                          {(comment.likeCount || comment.likesCount || 0) > 0 ? (comment.likeCount || comment.likesCount) : 'Like'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(isReplying ? null : comment.id);
                          setReplyText('');
                        }}
                        className="hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        Reply
                      </button>

                      {hasReplies && (
                        <button
                          type="button"
                          onClick={() => toggleRepliesExpand(comment.id)}
                          className="text-slate-600 hover:text-red-700 font-semibold cursor-pointer transition-colors"
                        >
                          {areRepliesExpanded
                            ? 'Hide replies'
                            : `${replies.length || comment.replyCount} ${ (replies.length || comment.replyCount) === 1 ? 'reply' : 'replies'}`}
                        </button>
                      )}
                    </div>

                    {/* Inline Reply Form */}
                    {isReplying && (
                      <div className="pt-2 pl-2 animate-in fade-in duration-150">
                        <div className="flex items-start gap-2">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-2" />
                          <div className="flex-1 space-y-1.5">
                            <input
                              type="text"
                              autoFocus
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleReplySubmit(comment);
                              }}
                              placeholder={`Reply to ${(author.name || 'member').split(' ')[0]}...`}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-500"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setReplyingToId(null)}
                                className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReplySubmit(comment)}
                                disabled={!replyText.trim() || isSubmittingReply}
                                className="px-3 py-1 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg cursor-pointer disabled:opacity-50"
                              >
                                {isSubmittingReply ? 'Replying...' : 'Reply'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Nested Replies */}
                    {hasReplies && areRepliesExpanded && (
                      <div className="ml-2 pt-2 border-l-2 border-slate-200/80 pl-3.5 space-y-2.5 animate-in fade-in duration-150">
                        {replies.map((reply) => {
                          const replyAuthor = reply.author || usersMap[reply.authorId] || {
                            id: reply.authorId,
                            name: reply.authorName || 'JECRC Member',
                            avatar: reply.authorAvatar,
                          };

                          const isOwnReply = currentUser && (currentUser.id === reply.authorId || currentUser.userId === reply.authorId);

                          return (
                            <div key={reply.id} className="flex items-start gap-2.5 group/reply">
                              <UserAvatar
                                src={replyAuthor.avatar || replyAuthor.avatarUrl || reply.authorAvatar}
                                name={replyAuthor.name || reply.authorName}
                                className="w-6 h-6 shrink-0 mt-0.5"
                              />

                              <div className="flex-1 space-y-1 min-w-0">
                                <div className="bg-slate-100/90 rounded-xl p-2.5 space-y-0.5 relative">
                                  <div className="flex items-baseline justify-between gap-1">
                                    <span className="text-xs font-bold text-slate-900 truncate">
                                      {replyAuthor.name || reply.authorName}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-medium">{reply.createdAt}</span>
                                  </div>

                                  <div className="text-xs text-slate-800 font-normal leading-snug">
                                    {renderFormattedContent(reply.content)}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 pl-1 text-[10px] text-slate-500 font-medium">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleLikeComment(reply.id)}
                                    className={`hover:text-red-700 cursor-pointer inline-flex items-center gap-1 ${
                                      (reply.likedByCurrentUser || reply.likedByMe) ? 'text-red-700 font-bold' : ''
                                    }`}
                                  >
                                    <Heart className={`w-3 h-3 ${(reply.likedByCurrentUser || reply.likedByMe) ? 'fill-red-700 text-red-700' : ''}`} />
                                    <span>{(reply.likeCount || reply.likesCount || 0) > 0 ? (reply.likeCount || reply.likesCount) : 'Like'}</span>
                                  </button>

                                  {isOwnReply && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteComment(reply.id)}
                                      className="hover:text-rose-600 cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete Confirmation */}
                {deleteConfirmId === comment.id && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-800 animate-in fade-in duration-100">
                    <span className="font-semibold">Delete this comment permanently?</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="px-3 py-1 font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2. "VIEW ALL X COMMENTS" BUTTON (When in preview mode and total > visible) */}
      {!isFullyExpanded && totalCount > comments.length && (
        <button
          type="button"
          onClick={handleExpandAll}
          className="text-xs font-semibold text-red-700 hover:text-red-800 hover:underline cursor-pointer transition-colors block pt-1"
        >
          View all {totalCount} comments
        </button>
      )}

      {/* 3. INFINITE SCROLL LOADER SENTINEL & STATUS (When in fully expanded mode) */}
      {isFullyExpanded && (
        <div className="pt-2 text-center">
          {hasMore && (
            <div ref={observerTarget} className="py-2 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-red-700" />
              <span>Loading more comments...</span>
            </div>
          )}

          {!hasMore && comments.length > 2 && (
            <p className="text-[11px] font-medium text-slate-400 py-2 border-t border-slate-100">
              You've reached the end of the comments.
            </p>
          )}
        </div>
      )}

      {/* 4. EXPANDABLE COMMENT COMPOSER */}
      <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3 space-y-2 transition-all shadow-2xs mt-2">
        <div className="flex items-start gap-3">
          <UserAvatar
            src={currentUser?.avatarUrl || currentUser?.avatar}
            name={currentUser?.name}
            className="w-8 h-8 shrink-0 mt-0.5"
          />

          <div className="flex-1 space-y-2">
            <textarea
              ref={textareaRef}
              value={commentText}
              onFocus={() => setIsComposerExpanded(true)}
              onChange={(e) => {
                const val = e.target.value;
                setCommentText(val);
                if (!isComposerExpanded) setIsComposerExpanded(true);
                const cursorPos = e.target.selectionStart;
                const textBeforeCursor = val.slice(0, cursorPos);
                if (/(?:^|\s)@([a-zA-Z0-9_]*)$/.test(textBeforeCursor)) {
                  setShowMentionList(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSubmitComment(e);
                }
              }}
              rows={isComposerExpanded ? 3 : 1}
              placeholder="Write a comment..."
              className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none resize-none transition-all shadow-2xs leading-relaxed"
            />

            {isComposerExpanded && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 animate-in fade-in duration-150">
                <div className="flex items-center gap-1 relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition-colors cursor-pointer"
                    title="Add emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMentionList((prev) => !prev)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition-colors cursor-pointer"
                    title="Mention someone"
                  >
                    <AtSign className="w-4 h-4" />
                  </button>

                  {/* Emoji Grid */}
                  {showEmojiPicker && (
                    <div className="absolute left-0 top-9 z-30 bg-white border border-slate-200 rounded-xl shadow-lg p-2 grid grid-cols-6 gap-1 w-48 animate-in zoom-in-95 duration-100">
                      {COMMON_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleInsertEmoji(emoji)}
                          className="p-1.5 hover:bg-slate-100 rounded text-base text-center cursor-pointer transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Mention Autocomplete */}
                  {showMentionList && (
                    <div className="absolute left-6 top-9 z-30 bg-white border border-slate-200 rounded-xl shadow-lg p-2 max-h-48 overflow-y-auto w-56 space-y-1 animate-in zoom-in-95 duration-100">
                      <span className="text-[10px] font-bold text-slate-400 block px-2 uppercase">
                        Mention Connections
                      </span>
                      {myConnections && myConnections.length > 0 ? (
                        myConnections.map((person) => (
                          <button
                            key={person.id || person.userId}
                            type="button"
                            onClick={() => handleInsertMention(person)}
                            className="w-full text-left px-2 py-1.5 hover:bg-slate-100 rounded flex items-center gap-2 cursor-pointer"
                          >
                            <UserAvatar src={person.avatar} name={person.name} className="w-5 h-5 shrink-0" />
                            <span className="text-xs font-semibold text-slate-800 truncate">{person.name}</span>
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 p-2">No connections available</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsComposerExpanded(false);
                      setShowEmojiPicker(false);
                      setShowMentionList(false);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || isSubmitting}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Posting...</span>
                      </>
                    ) : (
                      <span>Comment</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
