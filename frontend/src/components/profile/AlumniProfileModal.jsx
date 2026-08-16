import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../common/UserAvatar';
import { 
  X, 
  Bookmark, 
  MoreHorizontal, 
  Star, 
  Building2, 
  GraduationCap, 
  Users, 
  Briefcase, 
  BookOpen, 
  Award, 
  MessageSquare, 
  Mail, 
  UserCheck 
} from 'lucide-react';

export const AlumniProfileModal = ({ isOpen, onClose, alumni }) => {
  const navigate = useNavigate();

  if (!isOpen || !alumni) return null;

  const sampleAlumni = {
    id: alumni.id || 'alm_1',
    name: alumni.name || 'Rehan Khan',
    roleBadge: 'Alumni',
    currentRole: alumni.currentRole || 'Software Development Engineer',
    company: alumni.company || 'JECRC Network',
    location: alumni.location || 'India',
    education: alumni.education || `${alumni.degree || 'B.Tech'} ${alumni.branch ? `(${alumni.branch})` : ''} ${alumni.graduationYear ? `• Class of ${alumni.graduationYear}` : ''}`.trim(),
    avatar: alumni.avatar || alumni.avatarUrl || null,
    rating: alumni.rating || null,
    connectionsCount: alumni.connectionsCount ?? alumni.connectionCount ?? 0,
    experienceYears: alumni.experienceYears || null,
    mutualCount: alumni.mutualCount ?? alumni.mutualConnectionsCount ?? 0,
    badgeTitle: alumni.badgeTitle || (alumni.isAlumni ? 'Verified Alumni' : null),
    badgeSubtext: 'JECRC Community',
    featuredSkills: alumni.featuredSkills || (Array.isArray(alumni.skills) ? alumni.skills.slice(0, 3) : []),
    skills: alumni.skills || [],
    about: alumni.about || alumni.bio || 'JECRC Alumni community member.'
  };

  const handleViewFullProfile = () => {
    onClose();
    navigate(`/alumni/${sampleAlumni.id}`);
  };

  const handleMessageClick = () => {
    onClose();
    navigate(`/messages?userId=${sampleAlumni.id}`);
  };

  const handleMentorshipClick = () => {
    onClose();
    navigate(`/request-mentorship/${sampleAlumni.id}`);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden relative flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top Right Floating */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-xs transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="overflow-y-auto">
          {/* 1. Cover Banner matching Image 4 */}
          <div className="h-32 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative px-4 py-3 flex items-start justify-end gap-2">
            <div className="flex items-center gap-2 mt-1 mr-8">
              <button
                type="button"
                className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-xs transition-colors cursor-pointer"
                title="Save Profile"
              >
                <Bookmark className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-xs transition-colors cursor-pointer"
                title="Options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Main Profile Info */}
          <div className="px-5 pb-5 pt-0 relative">
            <div className="-mt-12 mb-3 flex items-end justify-between">
              {/* Avatar with Green Online status */}
              <div className="relative">
                <UserAvatar
                  src={sampleAlumni.avatar}
                  name={sampleAlumni.name}
                  className="w-24 h-24 border-4 border-white bg-white shadow-md"
                  iconClassName="w-10 h-10"
                />
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" title="Online" />
              </div>

              {/* Star Rating Badge Top Right matching Image 4 */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-xs font-bold text-slate-800 shadow-2xs">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{sampleAlumni.rating}</span>
              </div>
            </div>

            {/* Identity & Company/Education Details matching Image 4 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                  {sampleAlumni.name}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-red-700">
                  {sampleAlumni.roleBadge}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-slate-700">
                {sampleAlumni.currentRole}
              </h3>

              <div className="space-y-1 text-xs text-slate-500 pt-0.5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">{sampleAlumni.company}</span>
                  <span>•</span>
                  <span>{sampleAlumni.location}</span>
                </div>

                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{sampleAlumni.education}</span>
                </div>
              </div>

              {/* 4 Stat Cards Row matching Image 4 */}
              <div className="grid grid-cols-4 gap-2 pt-3">
                <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 flex flex-col items-start justify-center">
                  <div className="p-1 rounded-md bg-blue-100 text-blue-600 mb-1">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 leading-tight">{sampleAlumni.connectionsCount}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Connections</span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex flex-col items-start justify-center">
                  <div className="p-1 rounded-md bg-emerald-100 text-emerald-600 mb-1">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 leading-tight">{sampleAlumni.experienceYears}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Years Exp.</span>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 flex flex-col items-start justify-center">
                  <div className="p-1 rounded-md bg-purple-100 text-purple-600 mb-1">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 leading-tight">{sampleAlumni.mutualCount}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Mutual</span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 flex flex-col items-start justify-center">
                  <div className="p-1 rounded-md bg-amber-100 text-amber-600 mb-1">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 leading-tight">{sampleAlumni.badgeTitle}</span>
                  <span className="text-[9px] text-slate-500 font-medium leading-none">{sampleAlumni.badgeSubtext}</span>
                </div>
              </div>

              {/* Skills & Expertise Section matching Image 4 */}
              <div className="pt-3 space-y-2">
                <h4 className="text-xs font-bold text-slate-900">Skills & Expertise</h4>
                
                {/* Featured Skills with Green Dots */}
                <div className="flex flex-wrap gap-1.5">
                  {sampleAlumni.featuredSkills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 text-slate-800 px-3 py-1 rounded-full border border-slate-200/60"
                    >
                      <span>{sk}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </span>
                  ))}
                </div>

                {/* Secondary Skills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {sampleAlumni.skills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium bg-slate-100/80 text-slate-600 px-3 py-1 rounded-lg"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* About Section matching Image 4 */}
              <div className="pt-3 space-y-1">
                <h4 className="text-xs font-bold text-slate-900">About</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {sampleAlumni.about}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* 3. Action Buttons Bar matching Image 4 */}
        <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={handleMessageClick}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Chat"
          >
            <MessageSquare className="w-4.5 h-4.5" />
          </button>

          <button
            type="button"
            onClick={() => window.location.href = `mailto:${alumni.email || 'rehan@example.com'}`}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Email"
          >
            <Mail className="w-4.5 h-4.5" />
          </button>

          <button
            type="button"
            onClick={handleViewFullProfile}
            className="py-2.5 px-3 rounded-xl border border-red-600 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer shadow-2xs col-span-1 text-center"
          >
            View Profile
          </button>

          <button
            type="button"
            onClick={handleMentorshipClick}
            className="py-2.5 px-3 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs col-span-1"
          >
            <UserCheck className="w-4 h-4" />
            <span>Mentorship</span>
          </button>
        </div>

      </div>
    </div>
  );
};
