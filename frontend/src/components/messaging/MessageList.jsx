import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';

const getDateLabel = (isoString) => {
  if (!isoString) return '';
  const messageDate = new Date(isoString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (messageDate.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return messageDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
};

export const MessageList = ({ messages = [], currentUserId = 'st_101', partner }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-white scrollbar-thin scrollbar-thumb-slate-200"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-1.5 text-slate-400">
          <p className="text-xs font-semibold text-slate-600">No messages yet</p>
          <p className="text-[11px] text-slate-400 max-w-xs">
            Send a message to start communicating with {partner?.name || 'this member'}.
          </p>
        </div>
      ) : (
        messages.map((msg, index) => {
          const isCurrentUser = msg.senderId === currentUserId;
          const prevMsg = messages[index - 1];
          const nextMsg = messages[index + 1];

          // Date Separator calculation
          const currentDateLabel = getDateLabel(msg.createdAt);
          const prevDateLabel = prevMsg ? getDateLabel(prevMsg.createdAt) : null;
          const showDateSeparator = currentDateLabel !== prevDateLabel;

          // Message Grouping: show avatar only on the last message of a consecutive sender run
          const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

          return (
            <React.Fragment key={msg.id || index}>
              {showDateSeparator && (
                <div className="flex items-center justify-center my-3">
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/60 shadow-2xs">
                    {currentDateLabel}
                  </span>
                </div>
              )}

              <MessageBubble
                message={msg}
                isCurrentUser={isCurrentUser}
                showAvatar={isLastInGroup && !isCurrentUser}
                senderProfile={isCurrentUser ? null : partner}
              />
            </React.Fragment>
          );
        })
      )}
    </div>
  );
};
