import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { messageService } from '../services/messageService';
import { ConversationList } from '../components/messaging/ConversationList';
import { ChatWindow } from '../components/messaging/ChatWindow';
import { NewMessageModal } from '../components/messaging/NewMessageModal';
import { EmptyChatState, MessagingErrorState } from '../components/messaging/MessagingStates';

export const MessagesPage = () => {
  const { currentUser, usersMap } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

  const currentUserId = currentUser?.id || 'st_101';

  // Load conversations from messageService
  const loadConversations = useCallback(async (autoSelectFirst = false) => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await messageService.getConversations(currentUserId, usersMap);
      setConversations(data);

      // Handle query param ?userId= or ?conv=
      const targetUserId = searchParams.get('userId');
      const targetConvId = searchParams.get('conv');

      if (targetUserId) {
        // Find or create conversation with targetUserId
        const existingConv = data.find((c) => c.participantIds.includes(targetUserId));
        if (existingConv) {
          setSelectedConversationId(existingConv.id);
        } else {
          const newConv = await messageService.createOrGetConversation(currentUserId, targetUserId, usersMap);
          const refreshed = await messageService.getConversations(currentUserId, usersMap);
          setConversations(refreshed);
          setSelectedConversationId(newConv.id);
        }
      } else if (targetConvId) {
        setSelectedConversationId(targetConvId);
      } else if (autoSelectFirst && window.innerWidth >= 768 && data.length > 0) {
        // Desktop default: auto select first conversation if none selected
        setSelectedConversationId((prev) => prev || data[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, usersMap, searchParams]);

  useEffect(() => {
    loadConversations(true);
  }, [loadConversations]);

  // Active selected conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  // Filtered conversations by search query
  const filteredConversations = useMemo(() => {
    return messageService.searchConversations(searchQuery, conversations);
  }, [searchQuery, conversations]);

  // Handle selecting a conversation
  const handleSelectConversation = (conv) => {
    setSelectedConversationId(conv.id);
    setSearchParams({ conv: conv.id });

    // Mark as read in local state
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );
  };

  // Handle mobile back button
  const handleBackToList = () => {
    setSelectedConversationId(null);
    setSearchParams({});
  };

  // Handle message sent event (update preview in conversation list)
  const handleMessageSent = (convId, newMsg) => {
    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id === convId) {
          return {
            ...c,
            lastMessageText: newMsg.text,
            lastMessageAt: newMsg.createdAt,
            updatedAt: newMsg.createdAt,
          };
        }
        return c;
      });
      // Re-sort with latest on top
      return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  };

  // Handle starting a new conversation with a specific user
  const handleStartConversationWithUser = async (targetUserId) => {
    try {
      const conv = await messageService.createOrGetConversation(currentUserId, targetUserId, usersMap);
      const refreshed = await messageService.getConversations(currentUserId, usersMap);
      setConversations(refreshed);
      setSelectedConversationId(conv.id);
      setSearchParams({ conv: conv.id });
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  if (hasError) {
    return (
      <div className="h-[calc(100vh-8.5rem)] min-h-[550px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <MessagingErrorState onRetry={() => loadConversations(true)} />
      </div>
    );
  }

  return (
    <>
      <div className="h-[calc(100vh-6.5rem)] min-h-[520px] max-h-[800px] bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col md:flex-row">
      
      {/* Left Column: Conversation List */}
      <div
        className={`h-full w-full md:w-80 lg:w-88 shrink-0 ${
          selectedConversationId ? 'hidden md:flex flex-col' : 'flex flex-col'
        }`}
      >
          <ConversationList
            conversations={filteredConversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClearSearch={() => setSearchQuery('')}
            onNewMessageClick={() => setIsNewMessageOpen(true)}
            isLoading={isLoading}
          />
        </div>

        {/* Right Column: Chat Window or Empty State */}
        <div
          className={`h-full flex-1 min-w-0 bg-white ${
            !selectedConversationId ? 'hidden md:flex flex-col' : 'flex flex-col'
          }`}
        >
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              currentUserId={currentUserId}
              usersMap={usersMap}
              onBack={handleBackToList}
              onMessageSent={handleMessageSent}
            />
          ) : (
            <EmptyChatState onNewMessage={() => setIsNewMessageOpen(true)} />
          )}
        </div>

      </div>
      
      {/* New Message Dialog */}
      <NewMessageModal
        isOpen={isNewMessageOpen}
        onClose={() => setIsNewMessageOpen(false)}
        onSelectUser={handleStartConversationWithUser}
        usersMap={usersMap}
        currentUserId={currentUserId}
      />
    </>
  );
};
