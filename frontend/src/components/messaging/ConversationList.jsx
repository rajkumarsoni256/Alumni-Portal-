import React, { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
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
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'student', label: 'Students' },
    { id: 'alumni', label: 'Alumni' },
    { id: 'mentor', label: 'Mentors' },
  ];

  const totalCount = conversations.length;
  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const filteredConversations = conversations.filter((conv) => {
    if (activeFilter === 'all') return true;
    const role = conv.partner?.role?.toLowerCase() || '';
    if (activeFilter === 'alumni') return conv.partner?.isAlumni || role === 'alumni';
    if (activeFilter === 'student') return role === 'student' || role.includes('student');
    if (activeFilter === 'mentor') return conv.partner?.isAvailableForMentorship || role === 'mentor';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* 1. Header with Title, Total Count, and New Message Action */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Messages</h2>
            {unreadTotal > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                {unreadTotal} unread
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {totalCount} {totalCount === 1 ? 'conversation' : 'conversations'} • Direct chats
          </p>
        </div>

        <button
          type="button"
          onClick={onNewMessageClick}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
          title="Start new conversation"
          aria-label="Start new conversation"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New message</span>
        </button>
      </div>

      {/* 2. Conversation Search Bar & Filter Pills (Matching Image 1) */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2.5">
        <ConversationSearch
          value={searchQuery}
          onChange={onSearchChange}
          onClear={onClearSearch}
        />

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-red-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Conversation List / States */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 scrollbar-thin scrollbar-thumb-slate-200 flex flex-col justify-between">
        <div>
          {isLoading ? (
            <MessagingLoadingSkeleton />
          ) : filteredConversations.length === 0 ? (
            searchQuery ? (
              <SearchEmptyState query={searchQuery} onClear={onClearSearch} />
            ) : (
              <EmptyConversationsState onNewMessage={onNewMessageClick} />
            )
          ) : (
            filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === selectedConversationId}
                onSelect={onSelectConversation}
              />
            ))
          )}
        </div>

        {/* Load More button at bottom matching Image 1 */}
        {filteredConversations.length > 4 && (
          <div className="p-3 text-center border-t border-slate-100 bg-slate-50/30">
            <button
              type="button"
              className="text-[11px] font-semibold text-slate-500 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Load more</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
