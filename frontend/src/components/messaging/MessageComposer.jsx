import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';

export const MessageComposer = ({ onSendMessage, placeholder = 'Type a message...', disabled = false }) => {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanText = text.trim();
    if (!cleanText || disabled) return;

    onSendMessage(cleanText);
    setText('');

    // Maintain input focus
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isSendDisabled = disabled || !text.trim();

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 sm:p-3.5 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
    >
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Message input"
          className="w-full bg-slate-100 hover:bg-slate-200/50 focus:bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl px-4 py-2.5 border border-transparent focus:border-slate-300 focus:outline-none transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={isSendDisabled}
        aria-label="Send message"
        title="Send message"
        className={`p-2.5 rounded-xl transition-colors flex items-center justify-center shrink-0 shadow-2xs ${
          isSendDisabled
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-red-700 hover:bg-red-800 text-white cursor-pointer active:scale-95'
        }`}
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};
