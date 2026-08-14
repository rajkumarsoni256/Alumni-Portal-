import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { profileService } from '../../services/profileService';
import { 
  UserCheck, 
  ExternalLink, 
  Camera, 
  CheckCircle2, 
  Sparkles,
  Loader2,
  Edit3
} from 'lucide-react';

export const ProfileSettingsSection = () => {
  const { currentUser, userProfile, updateUserProfile, showNotification } = useApp();

  const [fullName, setFullName] = useState(userProfile?.fullName || currentUser?.name || '');
  const [headline, setHeadline] = useState(userProfile?.headline || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [company, setCompany] = useState(userProfile?.company || '');
  const [designation, setDesignation] = useState(userProfile?.designation || '');
  const [location, setLocation] = useState(userProfile?.location || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [linkedinUrl, setLinkedinUrl] = useState(userProfile?.linkedinUrl || '');
  const [githubUrl, setGithubUrl] = useState(userProfile?.githubUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  // Calculate Profile Completeness %
  const calculateCompleteness = () => {
    let score = 0;
    const total = 7;

    if (userProfile?.fullName || currentUser?.name) score += 1;
    if (userProfile?.avatarUrl || currentUser?.avatar) score += 1;
    if (userProfile?.bio) score += 1;
    if (userProfile?.degree && userProfile?.branch) score += 1;
    if (userProfile?.skills && userProfile.skills.length > 0) score += 1;
    if (userProfile?.linkedinUrl) score += 1;
    if (userProfile?.company || userProfile?.currentAcademicYear || userProfile?.graduationYear) score += 1;

    return Math.round((score / total) * 100);
  };

  const completenessPct = calculateCompleteness();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedFields = {
        fullName,
        headline,
        bio,
        company,
        designation,
        location,
        phone,
        linkedinUrl,
        githubUrl,
      };
      await profileService.updateProfile(updatedFields);
      updateUserProfile(currentUser.id, updatedFields);
      showNotification('Profile updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">Profile Information</h2>
          <p className="text-xs text-slate-500">Manage public profile attributes exposed to the JECRC community.</p>
        </div>
        <Link
          to={`/profile/${currentUser?.id || 'me'}`}
          className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>View Public Profile</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Profile Completeness Banner */}
      <div className="bg-gradient-to-r from-red-50/80 via-white to-slate-50 border border-red-200/80 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-700 shrink-0" />
            <span className="text-xs font-bold text-slate-900">Profile Completeness</span>
          </div>
          <span className="text-xs font-extrabold text-red-700">{completenessPct}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-red-700 transition-all duration-500 rounded-full"
            style={{ width: `${completenessPct}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-600">
          {completenessPct >= 90
            ? 'Your profile is fully optimized for networking and mentorship.'
            : 'Add your bio, skills, and LinkedIn profile to improve networking discoverability.'}
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
        {/* Avatar Preview Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <UserAvatar
            src={userProfile?.avatarUrl || currentUser?.avatar}
            name={currentUser?.name}
            className="w-14 h-14 shrink-0 ring-2 ring-slate-200"
          />
          <div className="space-y-1 min-w-0">
            <h3 className="text-xs font-bold text-slate-900 truncate">{currentUser?.name}</h3>
            <p className="text-[11px] text-slate-500 truncate">{userProfile?.headline || 'JECRC Member'}</p>
            <p className="text-[10px] text-slate-400">Profile photos can be uploaded directly on your Profile Page.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Mobile Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 block">Professional Headline</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. SDE-2 @ Google | Ex-Amazon | B.Tech CSE '22"
            className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Company / Organization</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google"
              className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Designation / Role</label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 block">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Jaipur, Rajasthan"
            className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 block">About / Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Brief professional summary, passions, and background..."
            className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-lg p-3 text-xs text-slate-900 outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">LinkedIn Profile URL</label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">GitHub Profile URL</label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>Save Profile Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
