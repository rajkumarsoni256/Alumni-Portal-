import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, token, user }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsersMap, setTypingUsersMap] = useState({}); // { [convId]: { [userId]: userName } }
  
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Determine Backend Socket Server URL
    const backendUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || window.location.origin;
    const socketUrl = backendUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    newSocket.on('user:online', ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    newSocket.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    newSocket.on('typing:start', ({ conversationId, userId, name }) => {
      setTypingUsersMap((prev) => ({
        ...prev,
        [conversationId]: {
          ...(prev[conversationId] || {}),
          [userId]: name || 'User',
        },
      }));
    });

    newSocket.on('typing:stop', ({ conversationId, userId }) => {
      setTypingUsersMap((prev) => {
        const convTyping = { ...(prev[conversationId] || {}) };
        delete convTyping[userId];
        return {
          ...prev,
          [conversationId]: convTyping,
        };
      });
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.id]);

  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('conversation:join', conversationId);
    }
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('conversation:leave', conversationId);
    }
  }, []);

  const lastTypingSentRef = useRef(0);

  const sendTypingStart = useCallback((conversationId) => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return; // Throttle socket typing event to 1 event per 2s
    lastTypingSentRef.current = now;
    if (socketRef.current && conversationId) {
      socketRef.current.emit('typing:start', { conversationId });
    }
  }, []);

  const sendTypingStop = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('typing:stop', { conversationId });
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        typingUsersMap,
        joinConversation,
        leaveConversation,
        sendTypingStart,
        sendTypingStop,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return {
      socket: null,
      isConnected: false,
      onlineUsers: new Set(),
      typingUsersMap: {},
      joinConversation: () => {},
      leaveConversation: () => {},
      sendTypingStart: () => {},
      sendTypingStop: () => {},
    };
  }
  return context;
};
