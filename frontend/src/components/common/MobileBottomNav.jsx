import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  Compass,
  Users, 
  MessageSquare, 
  Bell,
  LayoutDashboard,
  Layers,
  Megaphone,
  Settings
} from 'lucide-react';

export const MobileBottomNav = () => {
  const { isAuthenticated, activeRole, notifications, unreadNotifsCount: appUnreadNotifsCount, unreadMessagesCount } = useApp();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const isAdmin = activeRole === 'admin';
  const unreadNotifsCount = appUnreadNotifsCount ?? (notifications || []).filter((n) => n.unread || !n.isRead).length;

  const communityNavItems = [
    { 
      name: 'Home', 
      icon: Home, 
      path: '/' 
    },
    { 
      name: 'Discover', 
      icon: Compass, 
      path: '/explore' 
    },
    { 
      name: 'Connections', 
      icon: Users, 
      path: '/my-connections' 
    },
    { 
      name: 'Messages', 
      icon: MessageSquare, 
      path: '/messages',
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null
    },
    { 
      name: 'Notifications', 
      icon: Bell, 
      path: '/notifications',
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : null
    },
  ];

  const adminNavItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
    },
    {
      name: 'Users',
      icon: Users,
      path: '/admin/users',
    },
    {
      name: 'Content',
      icon: Layers,
      path: '/admin/content',
    },
    {
      name: 'Comms',
      icon: Megaphone,
      path: '/admin/communications',
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/admin/settings',
    },
  ];

  const navItems = isAdmin ? adminNavItems : communityNavItems;

  const isItemActive = (item) => {
    if (item.name === 'Home') return location.pathname === '/' || location.pathname === '/home';
    if (item.path === '/admin/dashboard') return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    return location.pathname.startsWith(item.path);
  };

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 py-1 px-1 shadow-md"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 text-center transition-colors ${
                active 
                  ? 'text-red-700 font-bold' 
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'text-red-700 stroke-[2.2]' : 'text-slate-500'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-1 bg-red-700 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
