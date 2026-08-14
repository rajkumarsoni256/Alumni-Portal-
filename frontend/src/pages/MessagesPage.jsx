import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { messageService } from '../services/messageService';
import { ConversationList } from '../components/messaging/ConversationList';
import { ChatWindow } from '../components/messaging/ChatWindow';
import { NewMessageModal } from '../components/messaging/NewMessageModal';
import { EmptyChatState, MessagingErrorState } from '../components/messaging/MessagingStates';

export const MessagesPage = () => {
  const { currentUser, usersMap, showNotification } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

  const currentUserId = currentUser?.id;

  // Load real conversations from backend
  const loadConversations = useCallback(async (autoSelectFirst = false) => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await messageService.getConversations();
      setConversations(data);

      // Handle query param ?userId= or ?conv=
      const targetUserId = searchParams.get('userId');
      const targetConvId = searchParams.get('conv');

      if (targetUserId) {
        // Find or create conversation with targetUserId
        try {
          const conv = await messageService.createOrGetConversation(null, targetUserId);
          const refreshed = await messageService.getConversations();
          setConversations(refreshed);
          setSelectedConversationId(conv.id);
        } catch (e) {
          showNotification(e.message || 'Failed to open conversation with user', 'error');
          // Clear invalid or stale targetUserId query param from URL
          setSearchParams({});
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
  }, [searchParams, setSearchParams, showNotification]);

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

    // Mark as read in backend & local state
    messageService.markAsRead(conv.id);
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
            lastMessageText: newMsg.text || newMsg.content,
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
      const conv = await messageService.createOrGetConversation(null, targetUserId);
      const refreshed = await messageService.getConversations();
      setConversations(refreshed);
      setSelectedConversationId(conv.id);
      setSearchParams({ conv: conv.id });
      setIsNewMessageOpen(false);
    } catch (err) {
      showNotification(err.message || 'Failed to start conversation. Ensure you are connected first.', 'error');
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
