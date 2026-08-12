import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CommentSection } from './CommentSection';
import { ShareModal } from './FeedStates';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  MoreHorizontal, 
  Briefcase, 
  Award, 
  Trash2, 
  Flag, 
  EyeOff, 
  Copy, 
  ExternalLink
} from 'lucide-react';

export const PostCard = ({ post }) => {
  const { 
    currentUser, 
    usersMap, 
    toggleLikePost, 
    toggleSavePost, 
    deletePost, 
    showNotification 
  } = useApp();

  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef(null);

  const author = usersMap[post.authorId] || {
    id: post.authorId,
    name: 'Community Member',
    role: 'Member',
    headline: 'JECRC Network',
    batch: 'JECRC',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    verified: false,
    isAlumni: false,
  };

  const isOwnPost = currentUser.id === post.authorId;

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

  return (
    <>
      <article className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* 1. Header */}
        <div className="p-4 pb-2.5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Avatar */}
            {author.isAlumni ? (
              <Link to={`/alumni/${author.id}`} className="shrink-0">
                <img
                  src={author.avatar}
                  alt={author.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 hover:opacity-90 transition-opacity"
                />
              </Link>
            ) : (
              <div className="shrink-0">
                <img
                  src={author.avatar}
                  alt={author.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
              </div>
            )}

            {/* Meta */}
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                {author.isAlumni ? (
                  <Link 
                    to={`/alumni/${author.id}`}
                    className="text-xs font-bold text-slate-900 hover:text-red-700 hover:underline truncate"
                  >
                    {author.name}
                  </Link>
                ) : (
                  <span className="text-xs font-bold text-slate-900 truncate">{author.name}</span>
                )}

                {author.isAlumni && (
                  <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-1 rounded">
                    Alum
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 truncate">
                {author.headline}
              </p>

              <div className="text-[10px] text-slate-400 font-normal">
                <span>{author.batch}</span>
                <span> · </span>
                <span>{post.createdAt}</span>
              </div>
            </div>
          </div>

          {/* 3-Dot Action Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Post actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-30 w-48 bg-white rounded-lg border border-slate-200 shadow-lg py-1">
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
                    setShowShareModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy link</span>
                </button>

                {isOwnPost ? (
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
                ) : (
                  <>
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
          <p className="text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-line">
            {post.content}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-semibold text-red-700 hover:underline cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Milestone Banner */}
          {post.type === 'ACHIEVEMENT' && post.achievementData && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
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

          {/* Job Card */}
          {post.type === 'JOB' && post.jobData && (
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-red-700 bg-red-50 px-1.5 py-0.2 rounded">
                    {post.jobData.type || 'Job Referral'}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">
                    {post.jobData.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {post.jobData.company} · {post.jobData.location}
                  </p>
                </div>
                <div className="p-2 rounded bg-white border border-slate-200 text-slate-700 shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>

              {post.jobData.stipend && (
                <span className="text-xs font-semibold text-emerald-700 block">
                  {post.jobData.stipend}
                </span>
              )}

              <div className="pt-1 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">
                  Posted by verified JU Alumnus
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

          {/* Media Image */}
          {post.image && (
            <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={post.image}
                alt="Post attachment"
                loading="lazy"
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}
        </div>

        {/* 3. Reactions Summary */}
        <div className="px-4 py-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-normal">
          <div className="flex items-center gap-1">
            <span className="text-slate-600 font-semibold">{post.likes}</span>
            <span>likes</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:underline cursor-pointer"
            >
              {post.commentsCount || 0} comments
            </button>
            <span>·</span>
            <span>{post.sharesCount || 0} shares</span>
          </div>
        </div>

        {/* 4. Action Row */}
        <div className="px-2 py-1 border-t border-slate-100 grid grid-cols-4 gap-1">
          <button
            onClick={() => toggleLikePost(post.id)}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              post.likedByCurrentUser
                ? 'text-red-700 font-bold bg-red-50/50'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Heart
              className="w-4 h-4"
              fill={post.likedByCurrentUser ? 'currentColor' : 'none'}
            />
            <span>Like</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              showComments
                ? 'text-slate-900 bg-slate-100 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comment</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>

          <button
            onClick={() => toggleSavePost(post.id)}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              post.savedByCurrentUser
                ? 'text-slate-900 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Bookmark
              className="w-4 h-4"
              fill={post.savedByCurrentUser ? 'currentColor' : 'none'}
            />
            <span>Save</span>
          </button>
        </div>

        {/* 5. Comments Section */}
        {showComments && (
          <div className="px-4 pb-4">
            <CommentSection post={post} />
          </div>
        )}
      </article>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
        onCopyLink={() => showNotification('Post link copied to clipboard', 'info')}
      />

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-sm w-full p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Delete post?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer"
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
