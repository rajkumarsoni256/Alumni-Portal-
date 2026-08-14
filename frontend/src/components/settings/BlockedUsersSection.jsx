import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { settingsService } from '../../services/settingsService';
import { UserAvatar } from '../common/UserAvatar';
import { UserX, Shield, Loader2, CheckCircle2 } from 'lucide-react';

export const BlockedUsersSection = () => {
  const { showNotification, unblockUser: appUnblockUser } = useApp();

  const [blockedList, setBlockedList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState(null);

  const fetchBlocked = async () => {
    setIsLoading(true);
    try {
      const list = await settingsService.getBlockedUsers();
      setBlockedList(list);
    } catch (err) {
      console.warn('Failed to fetch blocked users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocked();
  }, []);

  const handleUnblock = async (userId) => {
    setUnblockingId(userId);
    try {
      await appUnblockUser(userId);
      setBlockedList((prev) => prev.filter((b) => (b.userId || b.id) !== userId));
      showNotification('User unblocked', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to unblock user', 'error');
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="space-y-1 pb-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">Blocked Accounts</h2>
        <p className="text-xs text-slate-500">Manage users you have blocked from interacting with your profile, posts, or messages.</p>
      </div>

      {/* Blocked List Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserX className="w-4 h-4 text-red-700 shrink-0" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Blocked Community Members</h3>
          </div>
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            {blockedList.length} Blocked
          </span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-5 h-5 text-red-700 animate-spin mx-auto" />
          </div>
        ) : blockedList.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Shield className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No blocked users</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              When you block someone, they won't be able to view your profile, send messages, or comment on your posts.
            </p>
          </div>
        ) : (
          <div className="space-y-3 divide-y divide-slate-100">
            {blockedList.map((user) => {
              const uId = user.userId || user.id;
              return (
                <div key={uId} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar src={user.avatar} name={user.name} className="w-10 h-10 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{user.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{user.headline || user.email || 'JECRC Member'}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={unblockingId === uId}
                    onClick={() => handleUnblock(uId)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {unblockingId === uId && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Unblock</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
