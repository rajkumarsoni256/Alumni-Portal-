const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io = null;
const onlineUsersMap = new Map(); // Map<userId, Set<socketId>>

const getJwtSecret = () => process.env.JWT_SECRET || 'fallback_secret_key_for_development';

const initSocketServer = (httpServer) => {
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    process.env.FRONTEND_BASE_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];

  if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL.split(',').forEach((o) => {
      const trimmed = o.trim();
      if (trimmed && !allowedOrigins.includes(trimmed)) {
        allowedOrigins.push(trimmed);
      }
    });
  }

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normOrigin = origin.trim().replace(/\/+$/, '').toLowerCase();
        const isAllowed = allowedOrigins.some((o) => o.trim().replace(/\/+$/, '').toLowerCase() === normOrigin);
        if (isAllowed || allowedOrigins.includes('*') || normOrigin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Socket CORS policy: Origin ${origin} is not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // JWT Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '') : null);

      if (!token) {
        return next(new Error('Authentication error: Missing JWT token'));
      }

      const decoded = jwt.verify(token, getJwtSecret());
      socket.user = {
        id: decoded.id || decoded.userId || decoded.sub,
        email: decoded.email,
        role: decoded.role,
        fullName: decoded.fullName || decoded.name || '',
      };

      if (!socket.user.id) {
        return next(new Error('Authentication error: Invalid user ID payload'));
      }

      next();
    } catch (err) {
      logger.warn('SOCKET', `Authentication failed: ${err.message}`);
      next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const userRoom = `user:${userId}`;

    socket.join(userRoom);

    // Track online user sockets
    if (!onlineUsersMap.has(userId)) {
      onlineUsersMap.set(userId, new Set());
    }
    const userSockets = onlineUsersMap.get(userId);
    const wasOffline = userSockets.size === 0;
    userSockets.add(socket.id);

    if (wasOffline) {
      io.emit('user:online', { userId, role: socket.user.role });
    }

    logger.info('SOCKET', `User connected [id=${userId}, socket=${socket.id}]`);

    // Conversation Room Handlers
    socket.on('conversation:join', (conversationId) => {
      if (conversationId) {
        const roomName = `conversation:${conversationId}`;
        socket.join(roomName);
        logger.debug('SOCKET', `Socket ${socket.id} joined ${roomName}`);
      }
    });

    socket.on('conversation:leave', (conversationId) => {
      if (conversationId) {
        const roomName = `conversation:${conversationId}`;
        socket.leave(roomName);
        logger.debug('SOCKET', `Socket ${socket.id} left ${roomName}`);
      }
    });

    // Typing Indicators
    socket.on('typing:start', ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('typing:start', {
          conversationId,
          userId,
          name: socket.user.fullName || socket.user.email.split('@')[0],
        });
      }
    });

    socket.on('typing:stop', ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('typing:stop', {
          conversationId,
          userId,
        });
      }
    });

    // Presence Query
    socket.on('presence:get', (targetUserId, callback) => {
      const isOnline = onlineUsersMap.has(targetUserId) && onlineUsersMap.get(targetUserId).size > 0;
      if (typeof callback === 'function') {
        callback({ userId: targetUserId, isOnline });
      }
    });

    // Disconnect Handler
    socket.on('disconnect', (reason) => {
      logger.info('SOCKET', `User disconnected [id=${userId}, socket=${socket.id}, reason=${reason}]`);
      if (onlineUsersMap.has(userId)) {
        const set = onlineUsersMap.get(userId);
        set.delete(socket.id);
        if (set.size === 0) {
          onlineUsersMap.delete(userId);
          io.emit('user:offline', { userId });
        }
      }
    });
  });

  logger.info('SOCKET', 'Socket.IO Server initialized successfully');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO is not initialized yet');
  }
  return io;
};

const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return false;
  io.to(`user:${userId}`).emit(event, payload);
  return true;
};

const emitToConversation = (conversationId, event, payload) => {
  if (!io || !conversationId) return false;
  io.to(`conversation:${conversationId}`).emit(event, payload);
  return true;
};

const isUserOnline = (userId) => {
  return onlineUsersMap.has(userId) && onlineUsersMap.get(userId).size > 0;
};

const getOnlineUserIds = () => Array.from(onlineUsersMap.keys());

module.exports = {
  initSocketServer,
  getIO,
  emitToUser,
  emitToConversation,
  isUserOnline,
  getOnlineUserIds,
};
