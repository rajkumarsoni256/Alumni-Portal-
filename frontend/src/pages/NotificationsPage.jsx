import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserAvatar } from '../components/common/UserAvatar';
import { 
  Check, 
  Filter, 
  ChevronRight, 
  MessageSquare, 
  Users, 
  Bell, 
  Heart, 
  Briefcase, 
  Calendar, 
  MoreHorizontal,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

export const NotificationsPage = () => {
  const { 
    notifications, 
    unreadNotifsCount, 
    fetchNotifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    showNotification 
  } = useApp();

  const [activeTab, setActiveTab] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
  };

  const getBadgeMeta = (n) => {
    const type = (n.type || '').toUpperCase();
    const entityType = (n.entityType || '').toUpperCase();

    if (type.includes('MESSAGE') || entityType === 'CONVERSATION') {
      return { badgeColor: 'bg-blue-500', badgeIcon: MessageSquare };
    }
    if (type.includes('LIKE') || type.includes('COMMENT') || entityType === 'POST') {
      return { badgeColor: type.includes('LIKE') ? 'bg-rose-500' : 'bg-blue-600', badgeIcon: type.includes('LIKE') ? Heart : MessageSquare };
    }
    if (type.includes('CONNECTION') || entityType === 'CONNECTION') {
      return { badgeColor: type.includes('REQUEST') ? 'bg-purple-500' : 'bg-emerald-500', badgeIcon: Users };
    }
    if (type.includes('JOB') || entityType === 'JOB') {
      return { badgeColor: 'bg-amber-500', badgeIcon: Briefcase };
    }
    if (type.includes('EVENT') || entityType === 'EVENT') {
      return { badgeColor: 'bg-red-500', badgeIcon: Calendar };
    }
    if (type.includes('MENTOR') || entityType === 'MENTORSHIP') {
      return { badgeColor: 'bg-purple-600', badgeIcon: Users };
    }

    return { badgeColor: 'bg-slate-500', badgeIcon: Bell };
  };

  // Filter list by tab
  const filteredNotifications = notifications.filter((n) => {
    const type = (n.type || '').toUpperCase();
    const entityType = (n.entityType || '').toUpperCase();

    if (activeTab === 'unread') return n.unread || !n.isRead;
    if (activeTab === 'connections') return entityType === 'CONNECTION' || type.includes('CONNECTION');
    if (activeTab === 'messages') return entityType === 'CONVERSATION' || type.includes('MESSAGE');
    if (activeTab === 'jobs') return entityType === 'JOB' || type.includes('JOB');
    if (activeTab === 'system') return entityType === 'EVENT' || type.includes('SYSTEM') || (!['CONNECTION', 'CONVERSATION', 'JOB', 'POST'].includes(entityType));
    return true;
  });

  // Calculate live breakdown for Summary Donut Chart
  const totalCount = notifications.length;
  const messagesCount = notifications.filter((n) => (n.entityType || '').toUpperCase() === 'CONVERSATION' || (n.type || '').toUpperCase().includes('MESSAGE')).length;
  const connectionsCount = notifications.filter((n) => (n.entityType || '').toUpperCase() === 'CONNECTION' || (n.type || '').toUpperCase().includes('CONNECTION')).length;
  const jobsCount = notifications.filter((n) => (n.entityType || '').toUpperCase() === 'JOB' || (n.type || '').toUpperCase().includes('JOB')).length;
  const eventsCount = notifications.filter((n) => (n.entityType || '').toUpperCase() === 'EVENT' || (n.type || '').toUpperCase().includes('EVENT')).length;
  const systemCount = Math.max(0, totalCount - (messagesCount + connectionsCount + jobsCount + eventsCount));

  // Percentage calculations for Donut chart stroke dashes
  const calcDash = (val) => (totalCount > 0 ? Math.round((val / totalCount) * 100) : 0);
  const msgDash = calcDash(messagesCount);
  const connDash = calcDash(connectionsCount);
  const jobDash = calcDash(jobsCount);
  const evtDash = calcDash(eventsCount);

  const tabs = [
    { id: 'all', label: `All (${totalCount})` },
    { id: 'unread', label: `Unread (${unreadNotifsCount})` },
    { id: 'connections', label: `Connections (${connectionsCount})` },
    { id: 'messages', label: `Messages (${messagesCount})` },
    { id: 'jobs', label: `Jobs (${jobsCount})` },
    { id: 'system', label: 'System' },
  ];

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    showNotification('All notifications marked as read', 'info');
  };

  const handleNotificationClick = (n) => {
    if (n.unread || !n.isRead) {
      markNotificationRead(n.id);
    }
    const entityType = (n.entityType || '').toUpperCase();
    if (entityType === 'CONNECTION') {
      navigate('/network');
    } else if (entityType === 'POST') {
      navigate('/');
    } else if (entityType === 'CONVERSATION') {
      navigate('/messages');
    } else if (entityType === 'JOB') {
      navigate('/jobs');
    } else if (entityType === 'EVENT') {
      navigate('/events');
    }
  };

  const recentActivityItems = notifications.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-150">
      
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
              {unreadNotifsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-700 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                  {unreadNotifsCount}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Stay updated with important connection requests, post activities, messages, and campus updates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="Refresh notifications"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Check className="w-3.5 h-3.5 text-slate-500" />
              <span>Mark all as read</span>
            </button>

            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              title="Filter options"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Filter Bar */}
        <div className="border-b border-slate-100 pt-1 flex items-center gap-6 overflow-x-auto no-scrollbar">
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`pb-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer relative ${
                  active
                    ? 'text-red-700 font-bold border-b-2 border-red-700'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Content Layout (List + Summary Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Notification Feed */}
        <div className="lg:col-span-2 space-y-3">
          
          {/* Notification List Items */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => {
                const { badgeColor, badgeIcon: BadgeIcon } = getBadgeMeta(n);
                const isUnread = n.unread || !n.isRead;
                const avatarUrl = n.avatar || n.actor?.avatar || null;

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`py-3.5 px-4 flex items-start gap-3.5 transition-colors cursor-pointer ${
                      isUnread
                        ? 'bg-rose-50/40 hover:bg-rose-50/70'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Avatar with bottom right type badge */}
                    <div className="relative shrink-0 mt-0.5">
                      <UserAvatar
                        src={avatarUrl}
                        name={n.title || 'Notification'}
                        className="w-10 h-10"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${badgeColor} text-white flex items-center justify-center border-2 border-white shadow-xs`}>
                        <BadgeIcon className="w-2.5 h-2.5" />
                      </div>
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {n.title || n.actor?.name || 'JECRC Notification'}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {n.time || 'Just now'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-snug">
                        {n.message || n.text}
                      </p>
                    </div>

                    {/* Right side indicators */}
                    <div className="flex items-center gap-2 shrink-0 self-center">
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-red-600" title="Unread" />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No notifications found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {activeTab === 'unread' 
                    ? 'You have read all your notifications!' 
                    : 'When you receive messages, connection requests, post updates or event alerts, they will appear here.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
          
          {/* Card 1: Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900">Quick Actions</h3>

            <div className="space-y-1">
              <Link
                to="/messages"
                className="w-full p-2.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900">
                    View all messages
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
              </Link>

              <Link
                to="/my-connections"
                className="w-full p-2.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900">
                    Manage connections
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
              </Link>
            </div>
          </div>

          {/* Card 2: Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900">Recent Activity</h3>

            <div className="space-y-3">
              {recentActivityItems.length > 0 ? (
                recentActivityItems.map((item) => {
                  const { badgeColor, badgeIcon: BadgeIcon } = getBadgeMeta(item);
                  const avatarUrl = item.avatar || item.actor?.avatar || null;
                  return (
                    <div key={item.id} className="flex items-start gap-2.5 text-xs">
                      <div className="relative shrink-0 mt-0.5">
                        <UserAvatar
                          src={avatarUrl}
                          name={item.title}
                          className="w-7 h-7"
                          iconClassName="w-3.5 h-3.5"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ${badgeColor} text-white flex items-center justify-center border border-white`}>
                          <BadgeIcon className="w-2 h-2" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="font-bold text-slate-900 block truncate">{item.title || item.actor?.name || 'Activity'}</span>
                        <span className="text-[11px] text-slate-500 block truncate">{item.message || item.text}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{item.time || 'Just now'}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 py-2">No recent activity recorded.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
