import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { useApp } from '../context/AppContext';
import { Bell, Check, CheckCheck, MessageSquare, Video, UserPlus, Heart } from 'lucide-react';

export const NotificationsPage = () => {
  const { notifications, markNotificationRead, showNotification } = useApp();
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return n.unread;
    return true;
  });

  const handleMarkAllRead = () => {
    notifications.forEach((n) => markNotificationRead(n.id));
    showNotification('All notifications marked as read', 'info');
  };

  return (
    <PageContainer
      title="Notifications"
      description="Stay updated with mentorship requests, post discussions, and campus events."
      badge="Module 08 Preview"
      actionSlot={
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark all as read</span>
        </button>
      }
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
        
        {/* Filter Bar */}
        <div className="px-4 py-3 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'unread' ? 'bg-white text-slate-900 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unread ({notifications.filter((n) => n.unread).length})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-slate-100">
          {filtered.length > 0 ? (
            filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-4 flex items-start gap-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                  n.unread ? 'bg-red-50/20' : ''
                }`}
              >
                <img
                  src={n.avatar}
                  alt={n.actor}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs text-slate-700 leading-snug">
                    <strong className="text-slate-900 font-semibold">{n.actor}</strong> {n.text}
                  </p>
                  <span className="text-[11px] text-slate-400 block">{n.time}</span>
                </div>

                {n.unread && (
                  <span className="w-2 h-2 rounded-full bg-red-600 shrink-0 mt-2" title="Unread notification" />
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No notifications to display in this view.
            </div>
          )}
        </div>

      </div>
    </PageContainer>
  );
};
