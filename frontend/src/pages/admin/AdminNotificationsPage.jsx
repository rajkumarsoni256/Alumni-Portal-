import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useApp } from '../../context/AppContext';
import { adminUserService } from '../../services/adminUserService';
import { UserAvatar } from '../../components/common/UserAvatar';
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Users,
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';

export const AdminNotificationsPage = () => {
  const { showNotification } = useApp();

  // Inbox State
  const [inboxItems, setInboxItems] = useState([]);
  const [inboxUnreadCount, setInboxUnreadCount] = useState(0);
  const [inboxFilter, setInboxFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchInboxRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminUserService.getNotificationInbox({
        page: 1,
        limit: 100,
      });
      if (res && res.data) {
        setInboxItems(res.data || []);
        setInboxUnreadCount(typeof res.unreadCount === 'number' ? res.unreadCount : 0);
      }
    } catch (err) {
      console.error('Failed to load admin notification inbox:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInboxRecords();
  }, [fetchInboxRecords]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await adminUserService.markNotificationRead(notificationId);
      setInboxItems((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
      );
      setInboxUnreadCount((prev) => Math.max(0, prev - 1));
      showNotification('Notification marked as read', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update notification', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await adminUserService.markAllNotificationsRead();
      setInboxItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setInboxUnreadCount(0);
      showNotification('All notifications marked as read', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to mark all as read', 'error');
    }
  };

  const filteredItems = inboxItems.filter((item) => {
    if (inboxFilter === 'unread' && item.isRead) return false;
    if (inboxFilter === 'read' && !item.isRead) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = item.title ? item.title.toLowerCase().includes(q) : false;
      const bodyMatch = item.body || item.message ? (item.body || item.message).toLowerCase().includes(q) : false;
      return titleMatch || bodyMatch;
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in duration-200">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-700" />
              <span>Notification Center &amp; Inbox</span>
              {inboxUnreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                  {inboxUnreadCount} Unread
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              View system alerts, user registration events, verification requests, and administrator notifications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchInboxRecords}
              disabled={isLoading}
              className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-700' : ''}`} />
              <span>Refresh</span>
            </button>

            {inboxUnreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All as Read</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-lg border border-slate-200/80 w-full sm:w-auto">
            <button
              onClick={() => setInboxFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex-1 sm:flex-initial ${
                inboxFilter === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Notifications ({inboxItems.length})
            </button>
            <button
              onClick={() => setInboxFilter('unread')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex-1 sm:flex-initial ${
                inboxFilter === 'unread'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unread ({inboxUnreadCount})
            </button>
            <button
              onClick={() => setInboxFilter('read')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex-1 sm:flex-initial ${
                inboxFilter === 'read'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Read ({inboxItems.length - inboxUnreadCount})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full bg-slate-50 border border-slate-300 focus:border-slate-500 focus:bg-white rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-red-700 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading notifications...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Notifications Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery ? 'No notifications match your current search query.' : 'Your notification inbox is currently clear.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  item.isRead
                    ? 'bg-white border-slate-200/80 hover:border-slate-300'
                    : 'bg-red-50/20 border-red-200/80 shadow-2xs hover:border-red-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      item.isRead ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-700'
                    }`}>
                      <Bell className="w-4 h-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-xs font-bold ${item.isRead ? 'text-slate-800' : 'text-slate-900'}`}>
                          {item.title || 'System Notification'}
                        </h4>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                        )}
                        {item.type && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase border border-slate-200">
                            {item.type}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.body || item.message || 'No description provided.'}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recently'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!item.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
