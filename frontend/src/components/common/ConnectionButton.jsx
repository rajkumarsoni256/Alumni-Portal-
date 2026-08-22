import React, { useState } from 'react';
import { UserPlus, Check, Clock, UserX, Loader2, X } from 'lucide-react';
import { useConnection } from '../../context/ConnectionContext';

export const ConnectionButton = ({
  userId,
  targetUser,
  initialStatus = 'NONE',
  size = 'md',
  variant = 'default',
  className = '',
  onStatusChange,
}) => {
  const { getStatus, sendRequest, acceptRequest, declineRequest, cancelRequest } = useConnection();
  const [isPendingLocal, setIsPendingLocal] = useState(false);

  const effectiveUserId = userId || targetUser?.id || targetUser?.userId || targetUser?.user_id;
  const currentStatus = getStatus(effectiveUserId, initialStatus || targetUser?.connectionStatus);

  if (!effectiveUserId || currentStatus === 'SELF') {
    return null;
  }

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1',
    md: 'px-3.5 py-1.5 text-xs font-semibold gap-1.5',
    lg: 'px-4 py-2 text-sm font-semibold gap-2',
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  const handleConnect = async (e) => {
    e.stopPropagation();
    if (isPendingLocal) return;
    setIsPendingLocal(true);
    try {
      const res = await sendRequest(effectiveUserId);
      if (res && onStatusChange) onStatusChange('PENDING_SENT');
    } finally {
      setIsPendingLocal(false);
    }
  };

  const handleAccept = async (e) => {
    e.stopPropagation();
    if (isPendingLocal) return;
    setIsPendingLocal(true);
    try {
      const res = await acceptRequest(effectiveUserId);
      if (res && onStatusChange) onStatusChange('CONNECTED');
    } finally {
      setIsPendingLocal(false);
    }
  };

  const handleDecline = async (e) => {
    e.stopPropagation();
    if (isPendingLocal) return;
    setIsPendingLocal(true);
    try {
      const res = await declineRequest(effectiveUserId);
      if (res && onStatusChange) onStatusChange('NONE');
    } finally {
      setIsPendingLocal(false);
    }
  };

  const handleCancel = async (e) => {
    e.stopPropagation();
    if (isPendingLocal) return;
    setIsPendingLocal(true);
    try {
      const res = await cancelRequest(effectiveUserId);
      if (res && onStatusChange) onStatusChange('NONE');
    } finally {
      setIsPendingLocal(false);
    }
  };

  if (isPendingLocal) {
    return (
      <button
        disabled
        className={`inline-flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed ${currentSizeClass} ${className}`}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
        <span>Updating...</span>
      </button>
    );
  }

  // 1. BLOCKED
  if (currentStatus === 'BLOCKED') {
    return (
      <span className={`inline-flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none ${currentSizeClass} ${className}`}>
        <UserX className="w-3.5 h-3.5" />
        <span>Blocked</span>
      </span>
    );
  }

  // 2. CONNECTED
  if (currentStatus === 'CONNECTED') {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs font-semibold transition-colors ${currentSizeClass} ${className}`}
        title="You are connected with this user"
      >
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span>Connected</span>
      </button>
    );
  }

  // 3. PENDING_SENT (Outgoing request)
  if (currentStatus === 'PENDING_SENT') {
    return (
      <button
        type="button"
        onClick={handleCancel}
        className={`inline-flex items-center justify-center rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900 border border-amber-200/80 shadow-2xs font-semibold transition-colors group cursor-pointer ${currentSizeClass} ${className}`}
        title="Click to cancel connection request"
      >
        <Clock className="w-3.5 h-3.5 text-amber-600 group-hover:hidden" />
        <X className="w-3.5 h-3.5 text-amber-700 hidden group-hover:block" />
        <span className="group-hover:hidden">Pending</span>
        <span className="hidden group-hover:inline">Cancel</span>
      </button>
    );
  }

  // 4. PENDING_RECEIVED (Incoming request)
  if (currentStatus === 'PENDING_RECEIVED') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={handleAccept}
          className={`inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-2xs transition-colors cursor-pointer ${currentSizeClass}`}
          title="Accept connection request"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Accept</span>
        </button>
        <button
          type="button"
          onClick={handleDecline}
          className={`inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold shadow-2xs transition-colors cursor-pointer ${currentSizeClass}`}
          title="Decline connection request"
        >
          <X className="w-3.5 h-3.5 text-slate-500" />
          <span>Decline</span>
        </button>
      </div>
    );
  }

  // 5. NONE (Default Connect option)
  return (
    <button
      type="button"
      onClick={handleConnect}
      className={`inline-flex items-center justify-center rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold shadow-2xs transition-colors cursor-pointer ${currentSizeClass} ${className}`}
      title="Send connection request"
    >
      <UserPlus className="w-3.5 h-3.5" />
      <span>Connect</span>
    </button>
  );
};
