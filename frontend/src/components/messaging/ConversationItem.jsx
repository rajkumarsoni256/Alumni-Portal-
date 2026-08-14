import React, { useState } from 'react';
import { ShieldCheck, Star } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

const formatTimeAgo = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const ConversationItem = ({
  conversation,
  isActive,
  onSelect,
  onToggleBookmark,
}) => {
  const partner = conversation.partner || {};
  const [isStarred, setIsStarred] = useState(Boolean(conversation.isStarred));
  const unreadCount = conversation.unreadCount || 0;
  const { lastMessageText, lastMessageAt } = conversation;
  const isAlumni = Boolean(partner?.isAlumni || partner?.role?.toLowerCase() === 'alumni');
  const formattedTime = formatTimeAgo(lastMessageAt || conversation.updatedAt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(conversation)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(conversation);
        }
      }}
      className={`w-full text-left p-3 flex items-start gap-3 transition-colors border-b border-slate-100 last:border-b-0 cursor-pointer relative ${
        isActive
          ? 'bg-rose-50/70 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-red-700'
          : 'hover:bg-slate-50'
      }`}
    >
      {/* Avatar with status green dot */}
      <div className="relative shrink-0 mt-0.5">
        <UserAvatar
          src={partner?.avatar}
          name={partner?.name}
          className="w-10 h-10"
        />
        <span
          className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"
          title="Online"
        />
      </div>

      {/* Info & Message Snippet */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1 min-w-0">
            <span
              className={`text-xs truncate ${
                isActive || unreadCount > 0
                  ? 'font-bold text-slate-900'
                  : 'font-semibold text-slate-800'
              }`}
            >
              {partner?.name || 'JECRC Member'}
            </span>
            {isAlumni && (
              <ShieldCheck className="w-3 h-3 text-red-700 shrink-0" />
            )}
          </div>

          <span
            className={`text-[10px] shrink-0 ${
              unreadCount > 0
                ? 'font-semibold text-red-700'
                : 'text-slate-400'
            }`}
          >
            {formattedTime}
          </span>
        </div>

        {/* Last Message Preview & Unread Count Badge / Star */}
        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-xs truncate ${
              unreadCount > 0
                ? 'font-medium text-slate-900'
                : 'text-slate-500'
            }`}
          >
            {lastMessageText || 'Started a conversation'}
          </p>

          <div className="flex items-center gap-1 shrink-0">
            {unreadCount > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-700 text-white min-w-4 text-center">
                {unreadCount}
              </span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsStarred(!isStarred);
                }}
                className="text-slate-300 hover:text-amber-500 p-0.5 transition-colors cursor-pointer"
                title={isStarred ? 'Unstar conversation' : 'Star conversation'}
              >
                <Star
                  className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
