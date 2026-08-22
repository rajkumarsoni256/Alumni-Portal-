import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  ShieldCheck, 
  MessageSquare, 
  Edit3, 
  Share2,
  Camera,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserConnectionsModal } from '../network/UserConnectionsModal';
import { UserAvatar } from '../common/UserAvatar';
import { ConnectionButton } from '../common/ConnectionButton';

export const ProfileHeader = ({ profile, isOwnProfile, onEditClick, onUpdateAvatar, onUpdateBanner }) => {
  const navigate = useNavigate();
  const { showNotification, activeRole, myConnections } = useApp();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  if (!profile) return null;

  const isAlumni = Boolean(profile.isAlumni || profile.role?.toLowerCase() === 'alumni');
  const targetUserId = profile.userId || profile.user_id || profile.id;
  const profileName = profile.name || profile.fullName || profile.full_name || 'JECRC Member';

  const avatarSrc = profile.avatarUrl || profile.avatar || profile.avatar_url || profile.profile?.avatarUrl;
  const bannerSrc = profile.bannerUrl || profile.banner || profile.coverImage || profile.banner_url || profile.profile?.bannerUrl;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showNotification('Profile link copied to clipboard', 'info');
  };

  const handleMessageClick = () => {
    navigate(`/messages?userId=${targetUserId}`);
  };

  const compressImage = (file, maxWidth = 1200, maxHeight = 800, quality = 0.82) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const compressedBase64 = await compressImage(file, 400, 400, 0.85);
      if (onUpdateAvatar) {
        await onUpdateAvatar(compressedBase64);
      }
    } catch (err) {
      showNotification('Failed to upload profile photo', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleBannerChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      const compressedBase64 = await compressImage(file, 1400, 600, 0.82);
      if (onUpdateBanner) {
        await onUpdateBanner(compressedBase64);
      }
    } catch (err) {
      showNotification('Failed to upload cover banner', 'error');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Hidden File Inputs */}
      {isOwnProfile && (
        <>
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={bannerInputRef}
            onChange={handleBannerChange}
            accept="image/*"
            className="hidden"
          />
        </>
      )}

      {/* 1. Cover Banner */}
      <div className="h-36 sm:h-48 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden group">
        {bannerSrc ? (
          <img
            src={bannerSrc}
            alt="Cover Banner"
            className="w-full h-full object-cover"
          />
        ) : null}

        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={isUploadingBanner}
              className="p-1.5 px-3 rounded-lg bg-black/50 hover:bg-black/75 text-white text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-white/20 shadow-xs"
              title="Upload cover banner"
            >
              {isUploadingBanner ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isUploadingBanner ? 'Uploading...' : 'Change Cover'}</span>
            </button>
          )}

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
          <div className="relative inline-block group">
            <UserAvatar
              src={avatarSrc}
              name={profileName}
              className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-white shadow-xs"
            />

            {isAlumni && (
              <span 
                className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"
                title="Verified JECRC Alumni"
              />
            )}

            {isOwnProfile && (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-red-700 hover:bg-red-800 text-white shadow-md border-2 border-white transition-all cursor-pointer hover:scale-105"
                title="Upload profile photo"
                aria-label="Upload profile photo"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
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
                <ConnectionButton userId={targetUserId} targetUser={profile} size="md" />

                {activeRole === 'student' && isAlumni && (
                  <button
                    type="button"
                    onClick={() => navigate(`/request-mentorship/${targetUserId}`)}
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
              {profile.name || profile.fullName}
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

            {/* Real Connections Count */}
            {(() => {
              const displayConnectionCount = Math.max(
                profile.connectionsCount || 0,
                profile.connectionCount || 0,
                (isOwnProfile && myConnections) ? myConnections.length : 0
              );

              return (
                <button 
                  type="button"
                  onClick={() => setIsConnectionsModalOpen(true)}
                  className="text-slate-600 hover:text-red-700 font-semibold hover:underline cursor-pointer transition-colors"
                >
                  {displayConnectionCount >= 500 ? '500+' : displayConnectionCount} {' '}
                  {displayConnectionCount === 1 ? 'connection' : 'connections'}
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Connections Directory Modal */}
      <UserConnectionsModal
        isOpen={isConnectionsModalOpen}
        onClose={() => setIsConnectionsModalOpen(false)}
        userId={profile.userId || profile.user_id || profile.id}
        userName={profile.name || profile.fullName}
        totalCount={Math.max(
          profile.connectionsCount || 0,
          profile.connectionCount || 0,
          (isOwnProfile && myConnections) ? myConnections.length : 0
        )}
      />
    </div>
  );
};
