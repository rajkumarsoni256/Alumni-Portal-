import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { userService } from '../services/userService';
import { connectionService } from '../services/connectionService';
import { 
  GraduationCap, 
  MapPin, 
  Briefcase, 
  CheckCircle2, 
  Calendar, 
  MessageSquare,
  ArrowLeft,
  Bookmark,
  Share2,
  Check,
  Clock,
  UserPlus
} from 'lucide-react';

export const AlumniProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { savedAlumniIds, toggleSaveAlumni, showNotification, currentUser } = useApp();

  const [alumni, setAlumni] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('none');

  const isSelf = currentUser && currentUser.id === id;

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await userService.getUserById(id);
        if (data) {
          setAlumni(data);
          setConnectionStatus(data.connectionStatus || 'none');
        } else {
          setAlumni(null);
        }
      } catch (err) {
        setAlumni(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleToggleConnect = async () => {
    if (!alumni) return;

    try {
      if (connectionStatus === 'connected') {
        await connectionService.removeConnection(alumni.id);
        setConnectionStatus('none');
        showNotification('Connection removed', 'info');
      } else if (connectionStatus === 'pending_outgoing' || connectionStatus === 'pending') {
        await connectionService.cancelRequest(alumni.id);
        setConnectionStatus('none');
        showNotification('Connection request withdrawn', 'info');
      } else {
        await connectionService.sendRequest(alumni.id);
        setConnectionStatus('pending_outgoing');
        showNotification('Connection request sent', 'success');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update connection status', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100/75 py-12 text-center text-xs text-slate-500">
        Loading public profile...
      </div>
    );
  }

  if (!alumni) {
    return (
      <div className="min-h-screen bg-slate-100/75 py-12 text-center space-y-3">
        <h2 className="text-base font-bold text-slate-900">User Profile Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The specified member profile does not exist or is unavailable.
        </p>
        <button
          onClick={() => navigate('/network')}
          className="px-4 py-2 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const isSaved = savedAlumniIds.includes(alumni.id);

  const experienceList = [
    {
      role: alumni.currentRole || alumni.designation || 'Software Engineer',
      company: alumni.company || 'Technology Partner',
      period: '2021 – Present',
      location: alumni.location || 'India',
      description: 'Leading technical initiatives, architecture scalability, and mentoring engineering team members.',
    }
  ];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showNotification('Profile link copied to clipboard', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-100/75 py-5">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 space-y-4">
        
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to directory</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSaveAlumni(alumni.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                isSaved 
                  ? 'bg-red-50 text-red-700 border-red-200' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Share profile"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Main Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* 1. Hero Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* Cover Banner */}
              <div className="h-32 bg-slate-800 relative" />

              {/* Profile Details */}
              <div className="px-5 pb-5 pt-0 relative">
                <div className="-mt-14 mb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  {/* Avatar */}
                  <div className="relative inline-block">
                    <img
                      src={alumni.avatar}
                      alt={alumni.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white bg-white shadow-xs"
                    />
                    <span
                      className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                        alumni.isAvailableForMentorship ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                      title={alumni.isAvailableForMentorship ? 'Available for Mentorship' : 'Currently Busy'}
                    />
                  </div>

                  {/* Primary Actions */}
                  <div className="flex items-center gap-2">
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={handleToggleConnect}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                          connectionStatus === 'connected'
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                            : connectionStatus === 'pending_outgoing' || connectionStatus === 'pending'
                            ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                            : 'bg-red-700 text-white hover:bg-red-800'
                        }`}
                      >
                        {connectionStatus === 'connected' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Connected</span>
                          </>
                        ) : connectionStatus === 'pending_outgoing' || connectionStatus === 'pending' ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Request Sent</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Connect</span>
                          </>
                        )}
                      </button>
                    )}

                    {alumni.isAvailableForMentorship ? (
                      <Link
                        to={`/request-mentorship/${alumni.id}`}
                        className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book 1-on-1</span>
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-1.5 rounded-md text-xs font-semibold text-slate-400 bg-slate-100 cursor-not-allowed"
                      >
                        Unavailable
                      </button>
                    )}

                    <Link
                      to={`/messages?userId=${alumni.id}`}
                      className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </Link>
                  </div>
                </div>

                {/* Identity & Current Role */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900">{alumni.name}</h1>
                    <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.2 rounded-full">
                      {alumni.isAlumni ? 'Verified JU Alum' : 'JECRC Student'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-semibold max-w-xl">
                    {alumni.headline || (alumni.designation ? `${alumni.designation} @ ${alumni.company}` : 'JECRC Member')}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{alumni.degree || 'B.Tech'} • Class of {alumni.graduationYear || '2020'}</span>
                    </span>
                    {alumni.location && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{alumni.location}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. About / Bio Card */}
            {alumni.bio && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-2.5">
                <h2 className="text-sm font-bold text-slate-900">About</h2>
                <p className="text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                  {alumni.bio}
                </p>
              </div>
            )}

            {/* 3. Mentorship & Areas of Guidance */}
            {alumni.skills && alumni.skills.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
                <h2 className="text-sm font-bold text-slate-900">Skills & Expertise</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {alumni.skills.map((skill, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{skill}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        1-on-1 guidance, mock interviews, and technical mentorship.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Experience */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Experience</h2>

              <div className="space-y-4 divide-y divide-slate-100">
                {experienceList.map((exp, idx) => (
                  <div key={idx} className="pt-3 first:pt-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{exp.role}</h3>
                        <p className="text-xs text-slate-700 font-medium">{exp.company} • {exp.period}</p>
                        <p className="text-[11px] text-slate-400">{exp.location}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pt-0.5 font-normal">
                      {exp.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Education */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Education</h2>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                  <GraduationCap className="w-5 h-5 text-red-700" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <h3 className="text-xs font-bold text-slate-900">JECRC University, Jaipur</h3>
                  <p className="text-xs text-slate-700 font-medium">{alumni.degree || 'B.Tech'} ({alumni.branch || 'Engineering'})</p>
                  <p className="text-[11px] text-slate-500">Class of {alumni.graduationYear || '2020'}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Quick Booking Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900">Mentorship Booking</h3>
              
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Availability</span>
                  <span className={`font-semibold ${alumni.isAvailableForMentorship ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {alumni.isAvailableForMentorship ? '● Accepting Mentees' : '○ Busy'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Typical response</span>
                  <span className="font-semibold text-slate-900">Within 24 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Session format</span>
                  <span className="font-semibold text-slate-900">1-on-1 Video Call</span>
                </div>
              </div>

              {alumni.isAvailableForMentorship && (
                <Link
                  to={`/request-mentorship/${alumni.id}`}
                  className="w-full py-2 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Request Mentorship Session</span>
                </Link>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
