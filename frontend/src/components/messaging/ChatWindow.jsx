import React, { useState, useEffect, useCallback } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { messageService } from '../../services/messageService';

export const ChatWindow = ({
  conversation,
  currentUserId,
  usersMap = {},
  onBack,
  onMessageSent,
}) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const conversationId = conversation?.id;
  const partner = conversation?.partner;

  // Load conversation messages from backend
  const loadMessages = useCallback(async (convId) => {
    if (!convId) return;
    setIsLoading(true);
    try {
      const data = await messageService.getMessages(convId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
      // Mark read in PostgreSQL
      messageService.markAsRead(conversationId);
    }
  }, [conversationId, loadMessages]);

  const handleSendMessage = async (text) => {
    if (!conversationId || !text.trim() || isSending) return;

    setIsSending(true);
    try {
      const newMsg = await messageService.sendMessage(conversationId, text);
      if (newMsg) {
        setMessages((prev) => [...prev, newMsg]);

        if (onMessageSent) {
          onMessageSent(conversationId, newMsg);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* 1. Chat Header */}
      <ChatHeader partner={partner} onBack={onBack} />

      {/* 2. Message List */}
      <div className="flex-1 min-h-0 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span>Loading messages from database...</span>
            </div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            partner={partner}
          />
        )}
      </div>

      {/* 3. Composer */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        placeholder={`Message ${partner?.name ? partner.name.split(' ')[0] : 'member'}...`}
        disabled={isSending}
      />
    </div>
  );
};
