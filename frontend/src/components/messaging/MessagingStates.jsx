import React from 'react';
import { MessageSquare, Search, AlertCircle, Plus, RefreshCw } from 'lucide-react';

/**
 * Empty Chat State (Desktop right pane when no conversation is active)
 */
export const EmptyChatState = ({ onNewMessage }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center mb-3.5 text-slate-400">
        <MessageSquare className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="text-sm font-bold text-slate-800">Your Messages</h3>
      <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4 leading-relaxed">
        Select a conversation from the list to continue messaging, or start a new conversation with a JECRC community member.
      </p>
      {onNewMessage && (
        <button
          type="button"
          onClick={onNewMessage}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New message</span>
        </button>
      )}
    </div>
  );
};

/**
 * Empty Conversations State (When user has 0 conversations in total)
 */
export const EmptyConversationsState = ({ onNewMessage }) => {
  return (
    <div className="py-12 px-6 text-center space-y-3">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
        <MessageSquare className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-slate-800">No conversations yet</h4>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          Connect with students or alumni from the JECRC community to start a conversation.
        </p>
      </div>
      {onNewMessage && (
        <button
          type="button"
          onClick={onNewMessage}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Start a conversation</span>
        </button>
      )}
    </div>
  );
};

/**
 * Search Empty State (When no conversation matches the search query)
 */
export const SearchEmptyState = ({ query, onClear }) => {
  return (
    <div className="py-10 px-6 text-center space-y-3">
      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
        <Search className="w-4 h-4" />
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-slate-800">No conversations found</h4>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          No matches for &ldquo;{query}&rdquo;
        </p>
      </div>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-red-700 hover:text-red-800 hover:underline cursor-pointer"
        >
          Clear search
        </button>
      )}
    </div>
  );
};

/**
 * Loading Skeleton for Conversation List & Chat
 */
export const MessagingLoadingSkeleton = () => {
  return (
    <div className="divide-y divide-slate-100 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-3.5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-slate-200 rounded" />
              <div className="h-2.5 w-8 bg-slate-100 rounded" />
            </div>
            <div className="h-2.5 w-44 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Error State for Messaging
 */
export const MessagingErrorState = ({ onRetry }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white space-y-3">
      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-700">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900">Couldn&apos;t load messages</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          An error occurred while loading your conversations. Please try again.
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
