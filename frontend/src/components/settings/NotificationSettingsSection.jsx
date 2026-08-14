import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Mail, ThumbsUp, MessageSquare, UserPlus, Briefcase, Calendar, Award } from 'lucide-react';

export const NotificationSettingsSection = () => {
  const { userSettings, updateUserSettings, showNotification } = useApp();
  const notifs = userSettings?.notifications || {};

  const handleToggle = async (key, currentVal) => {
    try {
      await updateUserSettings({ [key]: !currentVal });
      showNotification('Notification preference updated', 'info');
    } catch (err) {
      showNotification(err.message || 'Failed to update notification setting', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="space-y-1 pb-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">Notification Preferences</h2>
        <p className="text-xs text-slate-500">Choose which community interactions and alerts trigger in-app and email notifications.</p>
      </div>

      {/* Delivery Channels Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Bell className="w-4 h-4 text-red-700 shrink-0" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Delivery Channels</h3>
        </div>

        <div className="flex items-center justify-between gap-4 py-1">
          <div>
            <span className="text-xs font-bold text-slate-900 block">In-App Notifications</span>
            <span className="text-[11px] text-slate-500">Display notification badge and feed in top navbar.</span>
          </div>
          <input
            type="checkbox"
            checked={notifs.pushNotifications !== false}
            onChange={() => handleToggle('pushNotifications', notifs.pushNotifications !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>

        <div className="flex items-center justify-between gap-4 py-1 border-t border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-900 block">Email Digest Notifications</span>
            <span className="text-[11px] text-slate-500">Send email alerts for key messages and connection requests.</span>
          </div>
          <input
            type="checkbox"
            checked={notifs.emailNotifications !== false}
            onChange={() => handleToggle('emailNotifications', notifs.emailNotifications !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>
      </div>

      {/* Activity Categories Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <ThumbsUp className="w-4 h-4 text-red-700 shrink-0" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Activity Alerts</h3>
        </div>

        {/* Post Likes */}
        <div className="flex items-center justify-between gap-4 py-1">
          <span className="text-xs font-semibold text-slate-800">Post Likes</span>
          <input
            type="checkbox"
            checked={notifs.postLikes !== false}
            onChange={() => handleToggle('postLikes', notifs.postLikes !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>

        {/* Post Comments */}
        <div className="flex items-center justify-between gap-4 py-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-800">Post Comments</span>
          <input
            type="checkbox"
            checked={notifs.postComments !== false}
            onChange={() => handleToggle('postComments', notifs.postComments !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>

        {/* Comment Replies */}
        <div className="flex items-center justify-between gap-4 py-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-800">Comment Replies</span>
          <input
            type="checkbox"
            checked={notifs.commentReplies !== false}
            onChange={() => handleToggle('commentReplies', notifs.commentReplies !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>

        {/* User Mentions (@Name) */}
        <div className="flex items-center justify-between gap-4 py-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-800">Mentions (@User)</span>
          <input
            type="checkbox"
            checked={notifs.mentions !== false}
            onChange={() => handleToggle('mentions', notifs.mentions !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>

        {/* Post Shares */}
        <div className="flex items-center justify-between gap-4 py-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-800">Post Shares</span>
          <input
            type="checkbox"
            checked={notifs.postShares !== false}
            onChange={() => handleToggle('postShares', notifs.postShares !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>
      </div>

      {/* Network, Messaging & Program Alerts Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <UserPlus className="w-4 h-4 text-red-700 shrink-0" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Network & Features</h3>
        </div>

        <div className="flex items-center justify-between gap-4 py-1">
          <span className="text-xs font-semibold text-slate-800">Connection Requests & Accepts</span>
          <input
            type="checkbox"
            checked={notifs.connectionRequests !== false}
            onChange={() => handleToggle('connectionRequests', notifs.connectionRequests !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>

        <div className="flex items-center justify-between gap-4 py-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-800">Direct Messages</span>
          <input
            type="checkbox"
            checked={notifs.messages !== false}
            onChange={() => handleToggle('messages', notifs.messages !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>

        <div className="flex items-center justify-between gap-4 py-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-800">Job Recommendations & Referral Alerts</span>
          <input
            type="checkbox"
            checked={notifs.jobs !== false}
            onChange={() => handleToggle('jobs', notifs.jobs !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>

        <div className="flex items-center justify-between gap-4 py-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-800">Event Reminders & Registration Updates</span>
          <input
            type="checkbox"
            checked={notifs.events !== false}
            onChange={() => handleToggle('events', notifs.events !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>

        <div className="flex items-center justify-between gap-4 py-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-800">Mentorship Session Reminders</span>
          <input
            type="checkbox"
            checked={notifs.mentorship !== false}
            onChange={() => handleToggle('mentorship', notifs.mentorship !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>
      </div>
    </div>
  );
};
