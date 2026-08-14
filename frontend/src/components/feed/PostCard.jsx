import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CommentSection } from './CommentSection';
import { ShareModal } from './FeedStates';
import { CreatePostComposer } from './CreatePostComposer';
import { UserAvatar } from '../common/UserAvatar';
import { 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  Send,
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
  CheckCircle2,
  MapPin,
  Calendar
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

  const author = usersMap[post.authorId] || post.author || {
    id: post.authorId,
    name: 'JECRC Member',
    role: 'Member',
    headline: 'JECRC Network',
    batch: 'JECRC',
    avatar: post.authorAvatar || null,
    verified: false,
    isAlumni: false,
  };

  const isOwnPost = currentUser.id === post.authorId || currentUser.role === 'ADMIN' || currentUser.role === 'admin';
  const isAlumni = author.isAlumni || author.role === 'Alumni' || author.role === 'alumni';
  const profileLink = isAlumni ? `/alumni/${author.id}` : (author.id === currentUser.id ? '/student-dashboard' : '#');

  const postType = (post.postType || post.type || 'TEXT').toUpperCase();

  // Media items
  const mediaList = post.media || [];
  const videoMedia = mediaList.find(m => m.type === 'VIDEO' || m.mediaType === 'VIDEO');
  const videoUrl = post.videoUrl || (videoMedia ? videoMedia.url : null);
  const imageMediaList = mediaList.filter(m => m.type === 'IMAGE' || m.mediaType === 'IMAGE');
  const imageUrl = post.image || post.imageUrl || (imageMediaList.length > 0 ? imageMediaList[0].url : null);

  // Job data
  const jobDetails = post.jobDetails || (post.jobTitle ? {
    title: post.jobTitle,
    company: post.companyName,
    location: post.jobLocation,
    employmentType: post.employmentType || 'Full-time',
    description: post.jobDescription,
    applicationUrl: post.jobUrl,
  } : post.jobData);

  // Achievement data
  const achievementDetails = post.achievementDetails || (post.achievementTitle ? {
    title: post.achievementTitle,
    organization: post.achievementOrganization,
    date: post.achievementDate,
    description: post.achievementDescription,
  } : post.achievementData);

  // Long text handling for "Show more"
  const isLongContent = (post.content || '').length > 280;
  const displayedContent = isLongContent && !isExpanded 
    ? `${(post.content || '').slice(0, 260)}...` 
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
              <UserAvatar
                src={author.avatar || author.avatarUrl}
                name={author.name || author.fullName}
                className="w-10 h-10 group-hover:opacity-90 transition-opacity"
              />
            </Link>

            {/* Author Meta */}
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link 
                  to={profileLink}
                  className="text-xs font-bold text-slate-900 hover:text-red-700 hover:underline truncate"
                >
                  {author.name || author.fullName}
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
                {post.visibility && (
                  <>
                    <span>·</span>
                    <span className="capitalize">{post.visibility.toLowerCase()}</span>
                  </>
                )}
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
        <div className="px-4 pb-3 space-y-3">
          {post.content && (
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
          )}

          {/* Hashtags */}
          {(post.tags || post.hashtags) && (post.tags || post.hashtags).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {(post.tags || post.hashtags).map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSearchQuery && setSearchQuery(tag)}
                  className="text-[11px] font-semibold text-red-700 hover:underline cursor-pointer bg-red-50/50 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
                >
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </button>
              ))}
            </div>
          )}

          {/* Video Attachment Player */}
          {videoUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200/80 bg-black">
              <video
                src={videoUrl}
                controls
                preload="metadata"
                className="w-full max-h-[420px] object-contain mx-auto"
              />
            </div>
          )}

          {/* Image Attachment */}
          {imageUrl && !videoUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100">
              <img
                src={imageUrl}
                alt="Post media"
                loading="lazy"
                className="w-full h-auto max-h-[450px] object-cover"
              />
            </div>
          )}

          {/* JOB Post Card */}
          {postType === 'JOB' && jobDetails && (
            <div className="bg-purple-50/50 border border-purple-200/80 rounded-xl p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                      {jobDetails.employmentType || 'Job Opportunity'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {jobDetails.title || jobDetails.jobTitle}
                  </h4>
                  <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 flex-wrap">
                    <span>{jobDetails.company || jobDetails.companyName}</span>
                    {jobDetails.location && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-slate-500 font-normal">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {jobDetails.location}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>

              {jobDetails.description && (
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 pt-1">
                  {jobDetails.description}
                </p>
              )}

              <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 font-medium">
                  Posted by verified JECRC member
                </span>
                {jobDetails.applicationUrl || jobDetails.jobUrl ? (
                  <a
                    href={jobDetails.applicationUrl || jobDetails.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Apply / View Job</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs font-semibold text-purple-800">Job Active</span>
                )}
              </div>
            </div>
          )}

          {/* ACHIEVEMENT Post Card */}
          {postType === 'ACHIEVEMENT' && achievementDetails && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/90 rounded-xl p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Award className="w-6 h-6" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                    Achievement / Milestone
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {achievementDetails.title || achievementDetails.achievementTitle}
                  </h4>
                  {achievementDetails.organization && (
                    <p className="text-xs text-slate-700 font-medium truncate">
                      {achievementDetails.organization}
                    </p>
                  )}
                  {achievementDetails.date && (
                    <p className="text-[11px] text-amber-900 font-medium flex items-center gap-1 pt-0.5">
                      <Calendar className="w-3 h-3 text-amber-700" />
                      <span>{new Date(achievementDetails.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </p>
                  )}
                </div>
              </div>

              {achievementDetails.description && (
                <p className="text-xs text-slate-700 leading-relaxed pt-1">
                  {achievementDetails.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 3. Engagement Summary */}
        <div className="px-4 py-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-normal">
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center -space-x-1 mr-1">
              <span className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-[8px] text-white">❤️</span>
              <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[8px] text-white">👍</span>
              <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[8px] text-white">👏</span>
            </span>
            <span className="font-medium text-slate-700">{post.likesCount || post.likes || 0} likes</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className="hover:underline cursor-pointer"
            >
              {post.commentsCount || 0} comments
            </button>
          </div>
        </div>

        {/* 4. Action Bar */}
        <div className="px-2 py-1 border-t border-slate-100 grid grid-cols-3 gap-1">
          <button
            onClick={() => toggleLikePost(post.id)}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              post.isLiked || post.likedByCurrentUser
                ? 'text-red-700 bg-red-50/50'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            aria-label="Like post"
          >
            <ThumbsUp
              className={`w-4 h-4 transition-transform active:scale-125 ${
                post.isLiked || post.likedByCurrentUser ? 'text-red-700 fill-red-700' : 'text-slate-500'
              }`}
            />
            <span>Like</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Share post"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span>Share</span>
          </button>
        </div>

        {/* 5. Inline Comments Section (Always visible preview + expandable) */}
        <div className="px-4 pb-4 border-t border-slate-100">
          <CommentSection post={post} forceExpanded={showComments} onExpand={() => setShowComments(true)} />
        </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-4 space-y-3 animate-in fade-in zoom-in-95 duration-100">
            <h3 className="text-sm font-bold text-slate-900">
              Delete this post?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              This action cannot be undone. The post and its media files will be permanently removed from the community feed.
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
