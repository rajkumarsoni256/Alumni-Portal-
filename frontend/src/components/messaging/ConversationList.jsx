import React from 'react';
import { Plus } from 'lucide-react';
import { ConversationSearch } from './ConversationSearch';
import { ConversationItem } from './ConversationItem';
import { 
  MessagingLoadingSkeleton, 
  EmptyConversationsState, 
  SearchEmptyState 
} from './MessagingStates';

export const ConversationList = ({
  conversations = [],
  selectedConversationId,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onNewMessageClick,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* 1. Header with Title and New Message Action */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white sticky top-0 z-10">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Messages</h2>
          <p className="text-[11px] text-slate-400">Direct community chats</p>
        </div>

        <button
          type="button"
          onClick={onNewMessageClick}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
          title="Start new conversation"
          aria-label="Start new conversation"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New message</span>
        </button>
      </div>

      {/* 2. Conversation Search Bar */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50">
        <ConversationSearch
          value={searchQuery}
          onChange={onSearchChange}
          onClear={onClearSearch}
        />
      </div>

      {/* 3. Conversation List / States */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 scrollbar-thin scrollbar-thumb-slate-200">
        {isLoading ? (
          <MessagingLoadingSkeleton />
        ) : conversations.length === 0 ? (
          searchQuery ? (
            <SearchEmptyState query={searchQuery} onClear={onClearSearch} />
          ) : (
            <EmptyConversationsState onNewMessage={onNewMessageClick} />
          )
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === selectedConversationId}
              onSelect={onSelectConversation}
            />
          ))
        )}
      </div>
    </div>
  );
};
