import React from 'react';

const formatMessageTime = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch (e) {
    return '';
  }
};

export const MessageBubble = ({
  message,
  isCurrentUser,
  showAvatar = true,
  senderProfile,
}) => {
  const formattedTime = formatMessageTime(message.createdAt);

  return (
    <div
      className={`flex items-end gap-2 my-1 ${
        isCurrentUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Partner Avatar (Left) */}
      {!isCurrentUser && (
        <div className="w-7 h-7 shrink-0">
          {showAvatar ? (
            <img
              src={senderProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300'}
              alt={senderProfile?.name || 'Member'}
              className="w-7 h-7 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-7 h-7" />
          )}
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[80%] sm:max-w-[75%]`}>
        <div
          className={`px-3.5 py-2.5 text-xs leading-relaxed break-words whitespace-pre-wrap ${
            isCurrentUser
              ? 'bg-slate-900 text-white rounded-2xl rounded-tr-xs shadow-2xs'
              : 'bg-slate-100 text-slate-900 border border-slate-200/80 rounded-2xl rounded-tl-xs'
          }`}
        >
          {message.text}
        </div>

        {/* Timestamp */}
        {formattedTime && (
          <span className="text-[10px] text-slate-400 mt-1 px-1 select-none">
            {formattedTime}
          </span>
        )}
      </div>

    </div>
  );
};
