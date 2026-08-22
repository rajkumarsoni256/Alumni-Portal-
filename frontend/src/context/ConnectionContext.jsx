import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { connectionService } from '../services/connectionService';
import { useSocket } from './SocketContext';

const ConnectionContext = createContext(null);

export const ConnectionProvider = ({ children, currentUser, showNotification }) => {
  const { socket } = useSocket();
  const [statusMap, setStatusMap] = useState({}); // { [userId]: { status: string, connectionId: string|null } }
  const [myConnections, setMyConnections] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Normalize backend status strings to UI enum: NONE, PENDING_SENT, PENDING_RECEIVED, CONNECTED, BLOCKED, SELF
  const normalizeStatus = (rawStatus, direction) => {
    if (!rawStatus) return 'NONE';
    const s = String(rawStatus).toUpperCase();
    if (s === 'ACCEPTED' || s === 'CONNECTED') return 'CONNECTED';
    if (s === 'PENDING_SENT' || s === 'PENDING_OUTGOING' || (s === 'PENDING' && direction === 'OUTGOING')) return 'PENDING_SENT';
    if (s === 'PENDING_RECEIVED' || s === 'PENDING_INCOMING' || (s === 'PENDING' && direction === 'INCOMING')) return 'PENDING_RECEIVED';
    if (s === 'BLOCKED') return 'BLOCKED';
    if (s === 'SELF') return 'SELF';
    return 'NONE';
  };

  // Helper to update status in local map
  const updateStatusMap = useCallback((userId, status, connectionId = null) => {
    if (!userId) return;
    const cleanId = String(userId).toLowerCase();
    setStatusMap((prev) => ({
      ...prev,
      [cleanId]: {
        status: String(status).toUpperCase(),
        connectionId: connectionId || prev[cleanId]?.connectionId || null,
      },
    }));
  }, []);

  // Fetch initial connection data
  const refreshConnections = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const conns = await connectionService.getMyConnections();
      const list = Array.isArray(conns) ? conns : [];
      setMyConnections(list);
      list.forEach((c) => {
        const uId = c.userId || c.user_id || c.id;
        if (uId) updateStatusMap(uId, 'CONNECTED', c.connectionId);
      });
    } catch (err) {
      console.warn('[ConnectionContext] Failed to load my connections:', err.message);
    }
  }, [currentUser?.id, updateStatusMap]);

  const refreshRequests = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const [inc, out] = await Promise.all([
        connectionService.getIncomingRequests(),
        connectionService.getOutgoingRequests(),
      ]);
      const incList = Array.isArray(inc) ? inc : [];
      const outList = Array.isArray(out) ? out : [];
      setIncomingRequests(incList);
      setOutgoingRequests(outList);

      incList.forEach((r) => {
        const uId = r.fromUserId || r.user?.id || r.fromUser?.id;
        if (uId) updateStatusMap(uId, 'PENDING_RECEIVED', r.requestId || r.id);
      });

      outList.forEach((r) => {
        const uId = r.targetUserId || r.user?.id || r.targetUser?.id;
        if (uId) updateStatusMap(uId, 'PENDING_SENT', r.requestId || r.id);
      });
    } catch (err) {
      console.warn('[ConnectionContext] Failed to load requests:', err.message);
    }
  }, [currentUser?.id, updateStatusMap]);

  useEffect(() => {
    if (currentUser?.id) {
      refreshConnections();
      refreshRequests();
    }
  }, [currentUser?.id, refreshConnections, refreshRequests]);

  // Listen to Socket.IO real-time connection events
  useEffect(() => {
    if (!socket || !currentUser?.id) return;

    const handleRequestReceived = (data) => {
      const fromId = data.fromUserId || data.requester?.id || data.requester?.userId;
      const senderName = data.requester?.name || data.requester?.fullName || 'Someone';
      if (fromId) {
        updateStatusMap(fromId, 'PENDING_RECEIVED', data.connectionId || data.requestId);
        refreshRequests();
        if (showNotification) {
          showNotification(`${senderName} sent you a connection request`, 'info');
        }
      }
    };

    const handleRequestSent = (data) => {
      const targetId = data.targetUserId;
      if (targetId) {
        updateStatusMap(targetId, 'PENDING_SENT', data.connectionId);
        refreshRequests();
      }
    };

    const handleAccepted = (data) => {
      const partnerId = data.partnerId;
      const partnerName = data.partner?.name || data.partner?.fullName || 'User';
      if (partnerId) {
        updateStatusMap(partnerId, 'CONNECTED', data.connectionId);
        refreshConnections();
        refreshRequests();
        if (showNotification && partnerId !== currentUser.id) {
          showNotification(`${partnerName} accepted your connection request`, 'success');
        }
      }
    };

    const handleRejected = (data) => {
      const partnerId = data.partnerId;
      if (partnerId) {
        updateStatusMap(partnerId, 'NONE');
        refreshRequests();
      }
    };

    const handleCancelled = (data) => {
      const partnerId = data.partnerId;
      if (partnerId) {
        updateStatusMap(partnerId, 'NONE');
        refreshRequests();
      }
    };

    const handleRemoved = (data) => {
      const partnerId = data.partnerId;
      if (partnerId) {
        updateStatusMap(partnerId, 'NONE');
        refreshConnections();
      }
    };

    socket.on('connection:request_received', handleRequestReceived);
    socket.on('connection:request_sent', handleRequestSent);
    socket.on('connection:accepted', handleAccepted);
    socket.on('connection:rejected', handleRejected);
    socket.on('connection:cancelled', handleCancelled);
    socket.on('connection:removed', handleRemoved);

    return () => {
      socket.off('connection:request_received', handleRequestReceived);
      socket.off('connection:request_sent', handleRequestSent);
      socket.off('connection:accepted', handleAccepted);
      socket.off('connection:rejected', handleRejected);
      socket.off('connection:cancelled', handleCancelled);
      socket.off('connection:removed', handleRemoved);
    };
  }, [socket, currentUser?.id, updateStatusMap, refreshConnections, refreshRequests, showNotification]);

  // Public methods for managing connections
  const getStatus = useCallback((userId, fallbackStatus = 'NONE') => {
    if (!userId) return 'NONE';
    if (currentUser?.id && String(userId).toLowerCase() === String(currentUser.id).toLowerCase()) {
      return 'SELF';
    }
    const entry = statusMap[String(userId).toLowerCase()];
    if (entry && entry.status) return entry.status;
    return normalizeStatus(fallbackStatus);
  }, [currentUser?.id, statusMap]);

  const sendRequest = useCallback(async (targetUserId) => {
    if (!targetUserId) return null;
    const cleanId = String(targetUserId).toLowerCase();
    updateStatusMap(cleanId, 'PENDING_SENT');

    try {
      const res = await connectionService.sendRequest(targetUserId);
      updateStatusMap(cleanId, 'PENDING_SENT', res.connectionId);
      if (showNotification) showNotification('Connection request sent', 'success');
      return res;
    } catch (err) {
      updateStatusMap(cleanId, 'NONE');
      if (showNotification) showNotification(err.message || 'Failed to send connection request', 'error');
      return null;
    }
  }, [updateStatusMap, showNotification]);

  const acceptRequest = useCallback(async (identifier) => {
    if (!identifier) return null;
    try {
      const res = await connectionService.acceptRequest(identifier);
      const partnerId = res.connection?.requester_id || res.connection?.receiver_id || identifier;
      updateStatusMap(partnerId, 'CONNECTED', res.connectionId);
      await Promise.all([refreshConnections(), refreshRequests()]);
      if (showNotification) showNotification('Connection accepted!', 'success');
      return res;
    } catch (err) {
      if (showNotification) showNotification(err.message || 'Failed to accept connection', 'error');
      return null;
    }
  }, [updateStatusMap, refreshConnections, refreshRequests, showNotification]);

  const declineRequest = useCallback(async (identifier) => {
    if (!identifier) return null;
    try {
      const res = await connectionService.declineRequest(identifier);
      const partnerId = res.connection?.requester_id || res.connection?.receiver_id || identifier;
      updateStatusMap(partnerId, 'NONE');
      await refreshRequests();
      if (showNotification) showNotification('Connection request declined', 'info');
      return res;
    } catch (err) {
      if (showNotification) showNotification(err.message || 'Failed to decline request', 'error');
      return null;
    }
  }, [updateStatusMap, refreshRequests, showNotification]);

  const cancelRequest = useCallback(async (identifier) => {
    if (!identifier) return null;
    try {
      const res = await connectionService.cancelRequest(identifier);
      const partnerId = res.connection?.receiver_id || res.connection?.requester_id || identifier;
      updateStatusMap(partnerId, 'NONE');
      await refreshRequests();
      if (showNotification) showNotification('Connection request cancelled', 'info');
      return res;
    } catch (err) {
      if (showNotification) showNotification(err.message || 'Failed to cancel request', 'error');
      return null;
    }
  }, [updateStatusMap, refreshRequests, showNotification]);

  const removeConnection = useCallback(async (identifier) => {
    if (!identifier) return null;
    try {
      const res = await connectionService.removeConnection(identifier);
      const partnerId = res.connection?.requester_id === currentUser?.id ? res.connection?.receiver_id : res.connection?.requester_id || identifier;
      updateStatusMap(partnerId, 'NONE');
      await refreshConnections();
      if (showNotification) showNotification('Connection removed', 'info');
      return res;
    } catch (err) {
      if (showNotification) showNotification(err.message || 'Failed to remove connection', 'error');
      return null;
    }
  }, [currentUser?.id, updateStatusMap, refreshConnections, showNotification]);

  return (
    <ConnectionContext.Provider
      value={{
        statusMap,
        getStatus,
        updateStatusMap,
        sendRequest,
        acceptRequest,
        declineRequest,
        cancelRequest,
        removeConnection,
        myConnections,
        incomingRequests,
        outgoingRequests,
        refreshConnections,
        refreshRequests,
        isLoading,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    return {
      statusMap: {},
      getStatus: () => 'NONE',
      updateStatusMap: () => {},
      sendRequest: async () => null,
      acceptRequest: async () => null,
      declineRequest: async () => null,
      cancelRequest: async () => null,
      removeConnection: async () => null,
      myConnections: [],
      incomingRequests: [],
      outgoingRequests: [],
      refreshConnections: async () => {},
      refreshRequests: async () => {},
      isLoading: false,
    };
  }
  return context;
};
