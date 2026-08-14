import React from 'react';
import { CheckCheck } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

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
            <UserAvatar
              src={senderProfile?.avatar}
              name={senderProfile?.name}
              className="w-7 h-7"
              iconClassName="w-3.5 h-3.5"
            />
          ) : (
            <div className="w-7 h-7" />
          )}
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[80%] sm:max-w-[75%]`}>
        <div
          className={`px-3.5 py-2.5 text-xs leading-relaxed break-words whitespace-pre-wrap relative group ${
            isCurrentUser
              ? 'bg-rose-100/90 text-slate-900 border border-red-200/60 rounded-2xl rounded-tr-xs shadow-2xs'
              : 'bg-slate-100/90 text-slate-900 border border-slate-200/80 rounded-2xl rounded-tl-xs'
          }`}
        >
          {message.text}

          {/* Reaction badge if message has reaction */}
          {message.reaction && (
            <span className="absolute -bottom-2 -right-1 bg-white border border-slate-200 shadow-2xs rounded-full text-[10px] px-1">
              {message.reaction}
            </span>
          )}
        </div>

        {/* Timestamp & Read Receipts */}
        {formattedTime && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1 select-none">
            <span>{formattedTime}</span>
            {isCurrentUser && (
              <CheckCheck className="w-3 h-3 text-red-600" />
            )}
          </div>
        )}
      </div>

    </div>
  );
};
