import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  Compass, 
  Briefcase, 
  MessageSquare, 
  User 
} from 'lucide-react';

export const MobileBottomNav = () => {
  const { activeRole, currentUser, setFeedFilter } = useApp();
  const location = useLocation();

  const getProfilePath = () => {
    if (activeRole === 'student') return '/student-dashboard';
    if (activeRole === 'alumni') return `/alumni/${currentUser.id || 'alm_1'}`;
    return '/admin';
  };

  const navItems = [
    { 
      name: 'Home', 
      icon: Home, 
      path: '/', 
      onClick: () => setFeedFilter('all') 
    },
    { 
      name: 'Explore', 
      icon: Compass, 
      path: '/explore' 
    },
    { 
      name: 'Jobs', 
      icon: Briefcase, 
      path: '/', 
      onClick: () => setFeedFilter('jobs') 
    },
    { 
      name: 'Messages', 
      icon: MessageSquare, 
      path: '/my-connections' 
    },
    { 
      name: 'Profile', 
      icon: User, 
      path: getProfilePath() 
    },
  ];

  const isActive = (item) => {
    if (item.name === 'Home') return location.pathname === '/';
    if (item.name === 'Profile') return location.pathname === getProfilePath();
    return location.pathname === item.path;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 py-1 px-2 shadow-xs">
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center py-1 text-center transition-colors ${
                active
                  ? 'text-red-700 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
