import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  Image, 
  Video, 
  Briefcase, 
  Award, 
  X, 
  Globe,
  Users,
  ChevronDown,
  Upload,
  Loader2,
  FileText
} from 'lucide-react';

export const CreatePostComposer = ({ 
  initialExpanded = false, 
  onCloseModal, 
  editingPost = null, 
  onSaveEdit 
}) => {
  const { currentUser, usersMap, createPost, editPost, showNotification } = useApp();
  const [isOpen, setIsOpen] = useState(initialExpanded || !!editingPost);
  const [postType, setPostType] = useState(editingPost ? (editingPost.postType || editingPost.type || 'TEXT') : 'TEXT');
  const [visibility, setVisibility] = useState(editingPost ? (editingPost.visibility || 'PUBLIC') : 'PUBLIC');
  const [content, setContent] = useState(editingPost ? editingPost.content : '');
  const [selectedTags, setSelectedTags] = useState(editingPost ? (editingPost.tags || editingPost.hashtags || []) : ['#JECRC']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);

  // Media files & preview
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(editingPost ? (editingPost.image || editingPost.imageUrl || editingPost.videoUrl) : null);
  const [mediaType, setMediaType] = useState(null); // 'IMAGE' or 'VIDEO'

  // Job post fields
  const [jobTitle, setJobTitle] = useState(editingPost?.jobDetails?.title || editingPost?.jobTitle || '');
  const [companyName, setCompanyName] = useState(editingPost?.jobDetails?.company || editingPost?.companyName || '');
  const [jobLocation, setJobLocation] = useState(editingPost?.jobDetails?.location || editingPost?.jobLocation || '');
  const [employmentType, setEmploymentType] = useState(editingPost?.jobDetails?.employmentType || editingPost?.employmentType || 'Full-time');
  const [jobDescription, setJobDescription] = useState(editingPost?.jobDetails?.description || editingPost?.jobDescription || '');
  const [jobUrl, setJobUrl] = useState(editingPost?.jobDetails?.applicationUrl || editingPost?.jobUrl || '');

  // Achievement post fields
  const [achievementTitle, setAchievementTitle] = useState(editingPost?.achievementDetails?.title || editingPost?.achievementTitle || '');
  const [achievementOrg, setAchievementOrg] = useState(editingPost?.achievementDetails?.organization || editingPost?.achievementOrganization || '');
  const [achievementDate, setAchievementDate] = useState(editingPost?.achievementDetails?.date || editingPost?.achievementDate || '');
  const [achievementDesc, setAchievementDesc] = useState(editingPost?.achievementDetails?.description || editingPost?.achievementDescription || '');

  const textareaRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const quickTags = ['#JECRC', '#Placements2026', '#Internships', '#AIandML', '#StudentProject'];

  const isAlumni = currentUser.isAlumni || currentUser.role === 'Alumni' || currentUser.role === 'alumni';
  const roleSubtitle = isAlumni ? 'Alumni • JECRC' : 'Student • JECRC';
  const firstName = (currentUser.name || 'User').split(' ')[0];

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

  const resetForm = () => {
    setContent('');
    setPostType('TEXT');
    setVisibility('PUBLIC');
    setSelectedTags(['#JECRC']);
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setJobTitle('');
    setCompanyName('');
    setJobLocation('');
    setEmploymentType('Full-time');
    setJobDescription('');
    setJobUrl('');
    setAchievementTitle('');
    setAchievementOrg('');
    setAchievementDate('');
    setAchievementDesc('');
  };

  const handleClose = () => {
    setIsOpen(false);
    if (!editingPost) {
      resetForm();
    }
    if (onCloseModal) onCloseModal();
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1].toLowerCase());
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const matchingUsers = Object.values(usersMap || {})
    .filter((u) => {
      if (!mentionQuery) return true;
      const name = (u.name || u.fullName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(mentionQuery) || email.includes(mentionQuery);
    })
    .slice(0, 5);

  const insertMention = (user) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIdx !== -1) {
      const mentionName = `@${user.name || user.fullName || 'User'} `;
      const newText = textBeforeCursor.slice(0, lastAtIdx) + mentionName + textAfterCursor;
      setContent(newText);
    }
    setShowMentionDropdown(false);
  };

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) => 
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Handle Photo selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showNotification('Image size must be less than 10 MB.', 'error');
      return;
    }

    setMediaFile(file);
    setMediaType('IMAGE');
    setPostType('PHOTO');
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);
    setIsOpen(true);
  };

  // Handle Video selection
  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      showNotification('Video size must be less than 100 MB.', 'error');
      return;
    }

    setMediaFile(file);
    setMediaType('VIDEO');
    setPostType('VIDEO');
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);
    setIsOpen(true);
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (postType === 'PHOTO' || postType === 'VIDEO') {
      setPostType('TEXT');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Post type validation
    if (postType === 'JOB') {
      if (!jobTitle.trim()) {
        showNotification('Job title is required', 'error');
        return;
      }
      if (!companyName.trim()) {
        showNotification('Company name is required', 'error');
        return;
      }
    } else if (postType === 'ACHIEVEMENT') {
      if (!achievementTitle.trim()) {
        showNotification('Achievement title is required', 'error');
        return;
      }
    } else {
      if (!content.trim() && !mediaFile && !mediaPreview) {
        showNotification('Please add text content or media to your post.', 'error');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        content: content.trim(),
        postType,
        type: postType,
        visibility,
        tags: selectedTags,
        hashtags: selectedTags,
        mediaFile,
        // Job fields
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        jobLocation: jobLocation.trim(),
        employmentType,
        jobDescription: jobDescription.trim(),
        jobUrl: jobUrl.trim(),
        // Achievement fields
        achievementTitle: achievementTitle.trim(),
        achievementOrganization: achievementOrg.trim(),
        achievementDate,
        achievementDescription: achievementDesc.trim(),
      };

      if (editingPost) {
        if (onSaveEdit) {
          await onSaveEdit(editingPost.id, payload);
        } else {
          await editPost(editingPost.id, payload);
        }
        showNotification('Post updated successfully.', 'success');
      } else {
        await createPost(payload);
        showNotification('Post published successfully.', 'success');
      }

      resetForm();
      handleClose();
    } catch (err) {
      console.error('Failed to publish post:', err);
      showNotification(err.message || 'Failed to publish post. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoSelect}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoSelect}
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
      />

      {/* 1. Collapsed Composer Invitation */}
      {!editingPost && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3.5 transition-all hover:border-slate-300">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={currentUser.avatar}
              name={currentUser.name}
              className="w-10 h-10 shrink-0"
            />
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="w-full text-left bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 rounded-full px-4 py-2.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              What's on your mind, {firstName}?
            </button>
          </div>

          {/* Quick Actions Toolbar */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer group"
              >
                <Image className="w-4 h-4 text-emerald-600 group-hover:scale-105 transition-transform" />
                <span>Photo</span>
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer group"
              >
                <Video className="w-4 h-4 text-blue-600 group-hover:scale-105 transition-transform" />
                <span>Video</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPostType('JOB');
                  setIsOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer group"
              >
                <Briefcase className="w-4 h-4 text-purple-600 group-hover:scale-105 transition-transform" />
                <span>Job</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPostType('ACHIEVEMENT');
                  setIsOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer group"
              >
                <Award className="w-4 h-4 text-amber-600 group-hover:scale-105 transition-transform" />
                <span>Achievement</span>
              </button>
            </div>

            {/* Visibility & Red Post button */}
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="text-xs font-medium text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white cursor-pointer outline-none hover:bg-slate-50"
              >
                <option value="PUBLIC">Public</option>
                <option value="CONNECTIONS">Connections</option>
              </select>

              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer shadow-2xs"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Expanded Composer Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden relative flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingPost ? 'Edit post' : 'Create a post'}
              </h3>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1">
              {/* Author Info & Visibility Selector */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={currentUser.avatar}
                    name={currentUser.name}
                    className="w-10 h-10 shrink-0"
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

                {/* Visibility Badge Dropdown */}
                <div className="relative">
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="appearance-none text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg pl-7 pr-6 py-1 cursor-pointer outline-none hover:bg-slate-200/80 transition-colors"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="CONNECTIONS">Connections</option>
                  </select>
                  <div className="absolute left-2 top-1.2 pointer-events-none text-slate-500">
                    {visibility === 'PUBLIC' ? <Globe className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1.5 pointer-events-none" />
                </div>
              </div>

              {/* Main Content Text Area with Mention Dropdown */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  rows={4}
                  value={content}
                  onChange={handleContentChange}
                  placeholder="What's on your mind? (Type @ to mention community members)"
                  className="w-full text-xs text-slate-800 placeholder-slate-400 outline-none resize-none min-h-[90px] leading-relaxed"
                  aria-label="Post content"
                />

                {showMentionDropdown && matchingUsers.length > 0 && (
                  <div className="absolute left-0 top-full z-20 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto w-64 p-1 space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">Mention Member</p>
                    {matchingUsers.map((user) => (
                      <button
                        key={user.id || user.userId}
                        type="button"
                        onClick={() => insertMention(user)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                      >
                        <UserAvatar src={user.avatar || user.avatarUrl} name={user.name || user.fullName} className="w-6 h-6 text-[10px]" />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-900 block truncate">{user.name || user.fullName}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{user.role || 'Member'} {user.branch ? `• ${user.branch}` : ''}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Media Preview Box */}
              {mediaPreview && (
                <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-50 flex items-center justify-center overflow-hidden max-h-56">
                  {mediaType === 'VIDEO' || (mediaFile && mediaFile.type.startsWith('video/')) ? (
                    <video
                      src={mediaPreview}
                      controls
                      className="max-h-48 w-full object-contain rounded-md"
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="Upload preview"
                      className="max-h-48 w-full object-contain rounded-md"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveMedia}
                    className="absolute top-3 right-3 p-1.5 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition-colors cursor-pointer shadow-md"
                    title="Remove media"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {mediaFile && (
                    <div className="absolute bottom-3 left-3 bg-slate-900/75 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                      {mediaFile.name} ({(mediaFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </div>
                  )}
                </div>
              )}

              {/* JOB Post Type Form */}
              {postType === 'JOB' && (
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-lg space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                    <Briefcase className="w-4 h-4 text-purple-700" />
                    <span>Job Opportunity Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Job Title *"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-purple-200 rounded outline-none text-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Company Name *"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-purple-200 rounded outline-none text-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Job Location (e.g. Bengaluru / Remote)"
                      value={jobLocation}
                      onChange={(e) => setJobLocation(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-purple-200 rounded outline-none text-slate-800"
                    />
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-purple-200 rounded outline-none text-slate-800"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Job Description / Key Requirements..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-purple-200 rounded outline-none text-slate-800 resize-none"
                  />
                  <input
                    type="url"
                    placeholder="Application URL (e.g. https://careers.company.com/...)"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-purple-200 rounded outline-none text-slate-800"
                  />
                </div>
              )}

              {/* ACHIEVEMENT Post Type Form */}
              {postType === 'ACHIEVEMENT' && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Award className="w-4 h-4 text-amber-700" />
                    <span>Achievement / Milestone Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Achievement Title *"
                      value={achievementTitle}
                      onChange={(e) => setAchievementTitle(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-amber-200 rounded outline-none text-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Organization / Institution"
                      value={achievementOrg}
                      onChange={(e) => setAchievementOrg(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-amber-200 rounded outline-none text-slate-800"
                    />
                  </div>
                  <input
                    type="date"
                    value={achievementDate}
                    onChange={(e) => setAchievementDate(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-amber-200 rounded outline-none text-slate-800"
                  />
                  <textarea
                    rows={2}
                    placeholder="Achievement Details / Story..."
                    value={achievementDesc}
                    onChange={(e) => setAchievementDesc(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-amber-200 rounded outline-none text-slate-800 resize-none"
                  />
                </div>
              )}

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
                    onClick={() => photoInputRef.current?.click()}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition-colors cursor-pointer ${
                      postType === 'PHOTO' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Image className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition-colors cursor-pointer ${
                      postType === 'VIDEO' ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-blue-600" />
                    <span>Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPostType(postType === 'JOB' ? 'TEXT' : 'JOB')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition-colors cursor-pointer ${
                      postType === 'JOB' ? 'bg-purple-50 border-purple-300 text-purple-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                    <span>Job</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPostType(postType === 'ACHIEVEMENT' ? 'TEXT' : 'ACHIEVEMENT')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition-colors cursor-pointer ${
                      postType === 'ACHIEVEMENT' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
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
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{editingPost ? 'Saving...' : 'Publishing...'}</span>
                    </>
                  ) : (
                    <span>{editingPost ? 'Save changes' : 'Post'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
