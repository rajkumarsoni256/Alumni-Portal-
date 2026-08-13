import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  ShieldCheck, 
  MessageSquare, 
  Edit3, 
  Check, 
  Clock, 
  Share2 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ProfileHeader = ({ profile, isOwnProfile, onEditClick }) => {
  const navigate = useNavigate();
  const { toggleConnectUser, showNotification, activeRole } = useApp();

  if (!profile) return null;

  const isAlumni = Boolean(profile.isAlumni || profile.role?.toLowerCase() === 'alumni');
  const isConnected = profile.connectionStatus === 'connected';
  const isPending = profile.connectionStatus === 'pending';

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showNotification('Profile link copied to clipboard', 'info');
  };

  const handleMessageClick = () => {
    navigate(`/messages?userId=${profile.id}`);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* 1. Cover Banner */}
      <div className="h-32 sm:h-40 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative">
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition-colors cursor-pointer"
            title="Share profile link"
            aria-label="Share profile link"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Profile Info */}
      <div className="px-5 sm:px-6 pb-5 pt-0 relative">
        <div className="-mt-12 sm:-mt-16 mb-3.5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          
          {/* Avatar with status */}
          <div className="relative inline-block">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-24 h-24 sm:w-28 sm:resize-none sm:h-28 rounded-full object-cover border-4 border-white bg-white shadow-xs"
            />
            {isAlumni && (
              <span 
                className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"
                title="Verified JECRC Alumni"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {isOwnProfile ? (
              <button
                type="button"
                onClick={onEditClick}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => toggleConnectUser(profile.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                    isConnected
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      : isPending
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-red-700 text-white hover:bg-red-800'
                  }`}
                >
                  {isConnected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Connected</span>
                    </>
                  ) : isPending ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending</span>
                    </>
                  ) : (
                    <span>Connect</span>
                  )}
                </button>

                {activeRole === 'student' && isAlumni && (
                  <button
                    type="button"
                    onClick={() => navigate(`/request-mentorship/${profile.id}`)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span>Request Mentorship</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleMessageClick}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Identity & Bio Details */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {profile.name}
            </h1>
            {isAlumni ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200/60 px-2 py-0.2 rounded">
                <ShieldCheck className="w-3 h-3 text-red-700" />
                <span>Verified Alumnus</span>
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.2 rounded">
                Student Member
              </span>
            )}
          </div>

          {/* Headline */}
          <p className="text-sm text-slate-700 font-medium max-w-2xl leading-snug">
            {profile.headline || (isAlumni ? `Alumni @ ${profile.company}` : 'Student at JECRC University')}
          </p>

          {/* JECRC Batch & Branch + Location + Connections */}
          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-slate-500 pt-1">
            <span className="font-semibold text-slate-900">
              {profile.batchDisplay || (profile.batch ? `JECRC ${profile.branch || 'Engineering'} • ${profile.batch}` : 'JECRC University')}
            </span>

            <span>•</span>

            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{profile.location || 'Jaipur, India'}</span>
            </div>

            <span>•</span>

            <Link 
              to="/network"
              className="text-slate-600 hover:text-red-700 font-semibold hover:underline"
            >
              {profile.connectionsCount || 48} connections
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
