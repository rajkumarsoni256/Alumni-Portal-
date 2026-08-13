import React from 'react';
import { ShieldCheck } from 'lucide-react';

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

export const ConversationItem = ({ conversation, isActive, onSelect }) => {
  const { partner, lastMessageText, lastMessageAt, unreadCount } = conversation;
  const isAlumni = Boolean(partner?.isAlumni || partner?.role?.toLowerCase() === 'alumni');
  const formattedTime = formatTimeAgo(lastMessageAt || conversation.updatedAt);

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation)}
      className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors border-b border-slate-100 last:border-b-0 cursor-pointer ${
        isActive
          ? 'bg-red-50/70 relative after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-red-700'
          : 'hover:bg-slate-50'
      }`}
    >
      {/* Avatar with optional Verified Alum status */}
      <div className="relative shrink-0 mt-0.5">
        <img
          src={partner?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300'}
          alt={partner?.name || 'Member'}
          className="w-10 h-10 rounded-full object-cover border border-slate-200"
        />
        {isAlumni && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"
            title="Verified JECRC Alumni"
          />
        )}
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

        {/* Last Message Preview & Unread Count Badge */}
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

          {unreadCount > 0 && (
            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-700 text-white min-w-4 text-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
