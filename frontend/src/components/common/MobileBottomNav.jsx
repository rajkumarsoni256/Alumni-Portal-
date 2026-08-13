import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  Users, 
  Briefcase, 
  MessageSquare, 
  User 
} from 'lucide-react';

export const MobileBottomNav = () => {
  const { isAuthenticated, activeRole, currentUser, unreadMessagesCount, requests } = useApp();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const pendingRequestsCount = requests.filter((r) => r.status === 'Pending').length;

  const getProfilePath = () => {
    if (activeRole === 'student') return '/student-dashboard';
    if (activeRole === 'alumni') return `/alumni/${currentUser.id || 'alm_1'}`;
    return '/admin';
  };

  const navItems = activeRole === 'alumni'
    ? [
        { 
          name: 'Home', 
          icon: Home, 
          path: '/' 
        },
        { 
          name: 'Network', 
          icon: Users, 
          path: '/network' 
        },
        { 
          name: 'Mentorship', 
          icon: Briefcase, 
          path: '/alumni-dashboard',
          badge: pendingRequestsCount > 0 ? pendingRequestsCount : null
        },
        { 
          name: 'Messages', 
          icon: MessageSquare, 
          path: '/messages',
          badge: unreadMessagesCount > 0 ? unreadMessagesCount : null
        },
        { 
          name: 'Profile', 
          icon: User, 
          path: getProfilePath() 
        },
      ]
    : [
        { 
          name: 'Home', 
          icon: Home, 
          path: '/' 
        },
        { 
          name: 'Network', 
          icon: Users, 
          path: '/network' 
        },
        { 
          name: 'Jobs', 
          icon: Briefcase, 
          path: '/jobs' 
        },
        { 
          name: 'Messages', 
          icon: MessageSquare, 
          path: '/messages',
          badge: unreadMessagesCount > 0 ? unreadMessagesCount : null
        },
        { 
          name: 'Profile', 
          icon: User, 
          path: getProfilePath() 
        },
      ];

  const isItemActive = (item) => {
    if (item.name === 'Home') return location.pathname === '/' || location.pathname === '/home';
    if (item.name === 'Profile') return location.pathname === getProfilePath();
    return location.pathname.startsWith(item.path);
  };

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 py-1.5 px-2 shadow-sm"
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
                  <span className="absolute -top-1 -right-1.5 min-w-3.5 h-3.5 px-1 bg-red-700 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
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
