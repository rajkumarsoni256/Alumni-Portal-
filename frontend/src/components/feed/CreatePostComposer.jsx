import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Image, 
  Video, 
  Briefcase, 
  Award, 
  X, 
  Info
} from 'lucide-react';

export const CreatePostComposer = ({ 
  initialExpanded = false, 
  onCloseModal, 
  editingPost = null, 
  onSaveEdit 
}) => {
  const { currentUser, createPost, editPost, showNotification } = useApp();
  const [isOpen, setIsOpen] = useState(initialExpanded || !!editingPost);
  const [content, setContent] = useState(editingPost ? editingPost.content : '');
  const [selectedTags, setSelectedTags] = useState(editingPost ? (editingPost.tags || []) : ['#JECRC']);
  const [featureNotice, setFeatureNotice] = useState(null);
  const textareaRef = useRef(null);

  const quickTags = ['#JECRC', '#Placements2026', '#Internships', '#AIandML', '#StudentProject'];

  const isAlumni = currentUser.isAlumni || currentUser.role === 'Alumni' || currentUser.role === 'alumni';
  const roleSubtitle = isAlumni ? 'Alumni • JECRC' : 'Student • JECRC';
  const firstName = (currentUser.name || 'Tokir').split(' ')[0];

  useEffect(() => {
    if (initialExpanded || editingPost) {
      setIsOpen(true);
    }
  }, [initialExpanded, editingPost]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setFeatureNotice(null);
    if (!editingPost) {
      setContent('');
      setSelectedTags(['#JECRC']);
    }
    if (onCloseModal) onCloseModal();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) => 
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleUnavailableTypeClick = (typeName) => {
    setFeatureNotice(`${typeName} posting will be available soon.`);
    showNotification('This feature will be available soon.', 'info');
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (editingPost) {
      if (onSaveEdit) {
        onSaveEdit(editingPost.id, {
          content: content.trim(),
          tags: selectedTags,
        });
      } else {
        editPost(editingPost.id, {
          content: content.trim(),
          tags: selectedTags,
        });
      }
    } else {
      createPost({
        content: content.trim(),
        type: 'TEXT',
        tags: selectedTags,
      });
    }

    setContent('');
    setSelectedTags(['#JECRC']);
    setFeatureNotice(null);
    handleClose();
  };

  return (
    <>
      {/* 1. Collapsed Composer Invitation (Only when not editing an existing post) */}
      {!editingPost && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3 transition-all hover:border-slate-300">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="w-full text-left bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 rounded-full px-4 py-2.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              What's on your mind, {firstName}?
            </button>
          </div>

          {/* Quick Action Types Toolbar */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-around gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => handleUnavailableTypeClick('Photo')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer group"
              aria-label="Add photo"
            >
              <Image className="w-4 h-4 text-emerald-600 group-hover:scale-105 transition-transform" />
              <span>Photo</span>
            </button>

            <button
              type="button"
              onClick={() => handleUnavailableTypeClick('Video')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer group"
              aria-label="Add video"
            >
              <Video className="w-4 h-4 text-blue-600 group-hover:scale-105 transition-transform" />
              <span>Video</span>
            </button>

            <button
              type="button"
              onClick={() => handleUnavailableTypeClick('Job')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer group"
              aria-label="Add job opportunity"
            >
              <Briefcase className="w-4 h-4 text-purple-600 group-hover:scale-105 transition-transform" />
              <span>Job</span>
            </button>

            <button
              type="button"
              onClick={() => handleUnavailableTypeClick('Achievement')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer group"
              aria-label="Add milestone or achievement"
            >
              <Award className="w-4 h-4 text-amber-600 group-hover:scale-105 transition-transform" />
              <span>Achievement</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Expanded Composer Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          role="dialog"
          aria-modal="true"
          aria-labelledby="composer-title"
        >
          <div 
            className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden relative flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 id="composer-title" className="text-sm font-bold text-slate-900">
                {editingPost ? 'Edit post' : 'Create a post'}
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close composer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1">
              {/* Author Identification */}
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {currentUser.name}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    {roleSubtitle}
                  </span>
                </div>
              </div>

              {/* Notice banner for future post types */}
              {featureNotice && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs text-amber-800">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <p className="flex-1">{featureNotice}</p>
                  <button
                    type="button"
                    onClick={() => setFeatureNotice(null)}
                    className="text-amber-600 hover:text-amber-900 cursor-pointer"
                    aria-label="Dismiss notice"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Text Input */}
              <textarea
                ref={textareaRef}
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full text-xs text-slate-800 placeholder-slate-400 outline-none resize-none min-h-[120px] leading-relaxed"
                aria-label="Post content"
              />

              {/* Hashtag Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Tags:</span>
                {quickTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`text-[11px] font-medium px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-red-700 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Add to your post toolbar */}
              <div className="p-3 bg-slate-50 border border-slate-200/75 rounded-lg space-y-2">
                <span className="text-[11px] font-semibold text-slate-600 block">
                  Add to your post
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleUnavailableTypeClick('Photo')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Image className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnavailableTypeClick('Video')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 text-blue-600" />
                    <span>Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnavailableTypeClick('Job')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                    <span>Job</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnavailableTypeClick('Achievement')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Achievement</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!content.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                >
                  {editingPost ? 'Save changes' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
