import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Image, 
  Briefcase, 
  Award, 
  X, 
  Globe 
} from 'lucide-react';

export const CreatePostComposer = ({ initialExpanded = false, onCloseModal }) => {
  const { currentUser, createPost } = useApp();
  const [isOpen, setIsOpen] = useState(initialExpanded);
  const [postType, setPostType] = useState('TEXT'); // 'TEXT' | 'MEDIA' | 'JOB' | 'ACHIEVEMENT'
  
  // Form states
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobLocation, setJobLocation] = useState('Bengaluru, India (Remote Available)');
  const [jobStipend, setJobStipend] = useState('₹50,000 / month');
  const [achievementTitle, setAchievementTitle] = useState('');
  const [achievementSubtitle, setAchievementSubtitle] = useState('');
  const [selectedTags, setSelectedTags] = useState(['#JECRC']);

  const quickTags = ['#JECRC', '#Placements2026', '#Internships', '#AIandML', '#StudentProject'];

  useEffect(() => {
    if (initialExpanded) setIsOpen(true);
  }, [initialExpanded]);

  const handleClose = () => {
    setIsOpen(false);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    let payload = {
      content: content.trim(),
      type: postType,
      tags: selectedTags,
      image: imageUrl.trim() || null,
    };

    if (postType === 'JOB') {
      payload.jobData = {
        title: jobTitle.trim() || 'Software Engineer Intern',
        company: jobCompany.trim() || currentUser.company || 'Tech Partner',
        location: jobLocation.trim() || 'Jaipur / Hybrid',
        type: 'Internship / Full-Time',
        stipend: jobStipend.trim() || 'Competitive',
        applyLink: 'https://careers.jecrc.ac.in',
      };
    } else if (postType === 'ACHIEVEMENT') {
      payload.achievementData = {
        badge: 'JECRC Milestone',
        title: achievementTitle.trim() || 'New Career Milestone',
        subtext: achievementSubtitle.trim() || `Shared by ${currentUser.name}`,
      };
    }

    createPost(payload);

    setContent('');
    setImageUrl('');
    setJobTitle('');
    setJobCompany('');
    setAchievementTitle('');
    setAchievementSubtitle('');
    setPostType('TEXT');
    handleClose();
  };

  return (
    <>
      {/* 1. Collapsed Start a Post Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
          />
          <button
            type="button"
            onClick={() => {
              setPostType('TEXT');
              setIsOpen(true);
            }}
            className="w-full text-left bg-slate-100/90 hover:bg-slate-100 border border-slate-200 rounded-full px-4 py-2.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Start a post, {currentUser.name.split(' ')[0]}...
          </button>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-around gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setPostType('MEDIA');
              setIsOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Image className="w-4 h-4 text-emerald-600" />
            <span>Media</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPostType('JOB');
              setIsOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Briefcase className="w-4 h-4 text-purple-600" />
            <span>Job</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPostType('ACHIEVEMENT');
              setIsOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>Milestone</span>
          </button>
        </div>
      </div>

      {/* 2. Clean Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 transition-opacity">
          <div 
            className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Create a post</h3>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1">
              {/* Author */}
              <div className="flex items-center gap-2.5">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{currentUser.name}</span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Globe className="w-3 h-3" />
                    <span>JECRC Community</span>
                  </div>
                </div>
              </div>

              {/* Type Switcher */}
              <div className="flex items-center gap-1 border-b border-slate-100 pb-2">
                <button
                  type="button"
                  onClick={() => setPostType('TEXT')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    postType === 'TEXT' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Post
                </button>
                <button
                  type="button"
                  onClick={() => setPostType('MEDIA')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    postType === 'MEDIA' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Media
                </button>
                <button
                  type="button"
                  onClick={() => setPostType('JOB')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    postType === 'JOB' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Job Opportunity
                </button>
                <button
                  type="button"
                  onClick={() => setPostType('ACHIEVEMENT')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    postType === 'ACHIEVEMENT' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Milestone
                </button>
              </div>

              {/* Content Textarea */}
              <textarea
                rows={4}
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What do you want to share with the community?"
                className="w-full text-xs text-slate-800 placeholder-slate-400 outline-none resize-none min-h-[100px]"
              />

              {/* Media input */}
              {postType === 'MEDIA' && (
                <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... (Image URL)"
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>
              )}

              {/* Job input */}
              {postType === 'JOB' && (
                <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs font-bold text-slate-800 block">Job Details</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Title (e.g. SDE Intern)"
                      className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      value={jobCompany}
                      onChange={(e) => setJobCompany(e.target.value)}
                      placeholder="Company"
                      className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      value={jobLocation}
                      onChange={(e) => setJobLocation(e.target.value)}
                      placeholder="Location"
                      className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      value={jobStipend}
                      onChange={(e) => setJobStipend(e.target.value)}
                      placeholder="Stipend / Salary"
                      className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Milestone input */}
              {postType === 'ACHIEVEMENT' && (
                <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs font-bold text-slate-800 block">Milestone Details</span>
                  <input
                    type="text"
                    value={achievementTitle}
                    onChange={(e) => setAchievementTitle(e.target.value)}
                    placeholder="Headline (e.g. Published Research Paper)"
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    value={achievementSubtitle}
                    onChange={(e) => setAchievementSubtitle(e.target.value)}
                    placeholder="Subtitle (e.g. IEEE Conference 2026)"
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
              )}

              {/* Tags */}
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
                          ? 'bg-red-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!content.trim()}
                  className="px-4 py-1.5 rounded text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
