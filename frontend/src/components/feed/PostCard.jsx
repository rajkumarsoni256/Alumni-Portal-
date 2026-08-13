import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CommentSection } from './CommentSection';
import { ShareModal } from './FeedStates';
import { CreatePostComposer } from './CreatePostComposer';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  MoreHorizontal, 
  Briefcase, 
  Award, 
  Trash2, 
  Edit3,
  Flag, 
  EyeOff, 
  Copy, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

export const PostCard = ({ post }) => {
  const { 
    currentUser, 
    usersMap, 
    toggleLikePost, 
    toggleSavePost, 
    deletePost, 
    editPost,
    showNotification,
    setSearchQuery
  } = useApp();

  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const menuRef = useRef(null);

  const author = usersMap[post.authorId] || {
    id: post.authorId,
    name: 'JECRC Member',
    role: 'Member',
    headline: 'JECRC Network',
    batch: 'JECRC',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    verified: false,
    isAlumni: false,
  };

  const isOwnPost = currentUser.id === post.authorId;
  const isAlumni = author.isAlumni || author.role === 'Alumni' || author.role === 'alumni';
  const profileLink = isAlumni ? `/alumni/${author.id}` : (author.id === currentUser.id ? '/student-dashboard' : '#');

  // Long text handling for "Show more"
  const isLongContent = (post.content || '').length > 280;
  const displayedContent = isLongContent && !isExpanded 
    ? `${post.content.slice(0, 260)}...` 
    : post.content;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = () => {
    deletePost(post.id);
    setShowDeleteConfirm(false);
  };

  const handleShareClick = () => {
    setShowShareModal(true);
    setShowMenu(false);
  };

  const handleCopyDirectLink = () => {
    const url = `${window.location.origin}/#post-${post.id}`;
    navigator.clipboard.writeText(url);
    showNotification('Link copied', 'info');
    setShowMenu(false);
  };

  return (
    <>
      <article className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all hover:border-slate-300">
        
        {/* 1. Post Header */}
        <div className="p-4 pb-2.5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Author Avatar */}
            <Link to={profileLink} className="shrink-0 group">
              <img
                src={author.avatar}
                alt={author.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:opacity-90 transition-opacity"
              />
            </Link>

            {/* Author Meta */}
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link 
                  to={profileLink}
                  className="text-xs font-bold text-slate-900 hover:text-red-700 hover:underline truncate"
                >
                  {author.name}
                </Link>

                {author.verified && (
                  <CheckCircle2 
                    className="w-3.5 h-3.5 text-red-700 shrink-0" 
                    title="Verified JECRC Profile"
                  />
                )}

                {isAlumni && (
                  <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-1.5 py-0.2 rounded shrink-0">
                    Alum
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 truncate leading-snug">
                {author.headline}
              </p>

              <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                <span>{author.batch}</span>
                <span>·</span>
                <span>{post.createdAt}</span>
                {post.updatedAt && (
                  <>
                    <span>·</span>
                    <span className="italic">{post.updatedAt}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 3-Dot More Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-30 w-44 bg-white rounded-lg border border-slate-200 shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100">
                {isOwnPost ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit post</span>
                    </button>

                    <button
                      onClick={() => {
                        toggleSavePost(post.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                      <span>{post.savedByCurrentUser ? 'Unsave post' : 'Save post'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors border-t border-slate-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete post</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        toggleSavePost(post.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                      <span>{post.savedByCurrentUser ? 'Unsave post' : 'Save post'}</span>
                    </button>

                    <button
                      onClick={handleCopyDirectLink}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy link</span>
                    </button>

                    <button
                      onClick={() => {
                        showNotification('Post hidden from feed', 'info');
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                      <span>Not interested</span>
                    </button>

                    <button
                      onClick={() => {
                        showNotification('Post reported for review', 'info');
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-500 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. Content Body */}
        <div className="px-4 pb-3 space-y-2.5">
          <div className="text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-line">
            {displayedContent}
            {isLongContent && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-1.5 font-semibold text-slate-600 hover:text-red-700 hover:underline cursor-pointer"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>

          {/* Hashtags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {post.tags.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSearchQuery(tag)}
                  className="text-[11px] font-semibold text-red-700 hover:underline cursor-pointer bg-red-50/50 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Milestone Banner (For ACHIEVEMENT posts) */}
          {post.type === 'ACHIEVEMENT' && post.achievementData && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">
                  {post.achievementData.badge || 'Milestone'}
                </span>
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {post.achievementData.title}
                </h4>
                {post.achievementData.subtext && (
                  <p className="text-[11px] text-slate-500 truncate">
                    {post.achievementData.subtext}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Job Referral Card (For JOB posts) */}
          {post.type === 'JOB' && post.jobData && (
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-red-700 bg-red-50 px-1.5 py-0.2 rounded">
                    {post.jobData.type || 'Job Opportunity'}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">
                    {post.jobData.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {post.jobData.company} · {post.jobData.location}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 shrink-0">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                </div>
              </div>

              {post.jobData.stipend && (
                <span className="text-xs font-semibold text-emerald-700 block">
                  {post.jobData.stipend}
                </span>
              )}

              <div className="pt-1 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">
                  {post.jobData.deadline ? `Deadline: ${post.jobData.deadline}` : 'Posted by verified JU Alumnus'}
                </span>
                <a
                  href={post.jobData.applyLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1"
                >
                  <span>Apply</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Single Image Attachment */}
          {post.image && (
            <div className="rounded-lg overflow-hidden border border-slate-200/80 bg-slate-100">
              <img
                src={post.image}
                alt="Post attachment"
                loading="lazy"
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}
        </div>

        {/* 3. Engagement Summary (Likes & Comments counts) */}
        {((post.likes || 0) > 0 || (post.commentsCount || 0) > 0) ? (
          <div className="px-4 py-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-normal">
            <div className="flex items-center gap-1">
              {(post.likes || 0) > 0 && (
                <>
                  <span className="font-semibold text-slate-800">{post.likes}</span>
                  <span>{post.likes === 1 ? 'like' : 'likes'}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {(post.commentsCount || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setShowComments(!showComments)}
                  className="hover:underline cursor-pointer"
                >
                  {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
                </button>
              )}
              {(post.sharesCount || 0) > 0 && (
                <>
                  <span>·</span>
                  <span>{post.sharesCount} shares</span>
                </>
              )}
            </div>
          </div>
        ) : null}

        {/* 4. Action Bar */}
        <div className="px-2 py-1 border-t border-slate-100 grid grid-cols-4 gap-1">
          <button
            onClick={() => toggleLikePost(post.id)}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              post.likedByCurrentUser
                ? 'text-red-700 font-bold bg-red-50/50'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            aria-label="Like post"
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                post.likedByCurrentUser ? 'text-red-700' : 'text-slate-500'
              }`}
              fill={post.likedByCurrentUser ? 'currentColor' : 'none'}
            />
            <span>Like</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              showComments
                ? 'text-slate-900 bg-slate-100 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            aria-label="Comment on post"
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span>Comment</span>
          </button>

          <button
            onClick={handleShareClick}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Share post"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span>Share</span>
          </button>

          <button
            onClick={() => toggleSavePost(post.id)}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              post.savedByCurrentUser
                ? 'text-slate-900 font-semibold bg-slate-50'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            aria-label="Save post"
          >
            <Bookmark
              className={`w-4 h-4 ${post.savedByCurrentUser ? 'text-slate-900' : 'text-slate-500'}`}
              fill={post.savedByCurrentUser ? 'currentColor' : 'none'}
            />
            <span>{post.savedByCurrentUser ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* 5. Inline Comments Section */}
        {showComments && (
          <div className="px-4 pb-4">
            <CommentSection post={post} />
          </div>
        )}
      </article>

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
        onCopyLink={() => showNotification('Link copied', 'info')}
      />

      {/* Edit Composer Modal */}
      {isEditing && (
        <CreatePostComposer
          editingPost={post}
          onCloseModal={() => setIsEditing(false)}
          onSaveEdit={(id, fields) => {
            editPost(id, fields);
            setIsEditing(false);
          }}
        />
      )}

      {/* Delete Confirmation Modal (Item 33) */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-4 space-y-3 animate-in fade-in zoom-in-95 duration-100">
            <h3 id="delete-dialog-title" className="text-sm font-bold text-slate-900">
              Delete this post?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              This action cannot be undone. The post will be permanently removed from the community feed.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-2xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
