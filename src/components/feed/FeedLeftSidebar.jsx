import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  Compass, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  Bookmark, 
  Sparkles
} from 'lucide-react';

export const FeedLeftSidebar = () => {
  const { currentUser, feedFilter, setFeedFilter, activeRole } = useApp();
  const location = useLocation();

  const getProfileLink = () => {
    if (activeRole === 'student') return '/student-dashboard';
    if (activeRole === 'alumni') return `/alumni/${currentUser.id || 'alm_1'}`;
    return '/admin';
  };

  const navItems = [
    { 
      name: 'Community Feed', 
      icon: Home, 
      path: '/', 
      isFilter: true, 
      filterVal: 'all' 
    },
    { 
      name: 'Explore Alumni', 
      icon: Compass, 
      path: '/explore' 
    },
    { 
      name: 'Jobs & Internships', 
      icon: Briefcase, 
      badge: 'Hiring',
      isFilter: true, 
      filterVal: 'jobs' 
    },
    { 
      name: 'Find a Mentor', 
      icon: Sparkles, 
      path: '/find-mentor' 
    },
    { 
      name: 'Campus Events', 
      icon: Calendar, 
      path: '/events' 
    },
    { 
      name: 'My Connections', 
      icon: MessageSquare, 
      path: '/my-connections' 
    },
    { 
      name: 'Saved Posts', 
      icon: Bookmark, 
      isFilter: true, 
      filterVal: 'saved' 
    },
  ];

  return (
    <aside className="space-y-3 sticky top-18">
      {/* 1. Profile Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Cover Header */}
        <div className="h-14 bg-slate-800 relative" />

        {/* Profile Info */}
        <div className="px-4 pb-4 pt-0 text-center relative">
          <div className="-mt-8 mb-2 inline-block">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-xs mx-auto bg-white"
            />
          </div>

          <div className="space-y-0.5">
            <Link
              to={getProfileLink()}
              className="text-sm font-bold text-slate-900 hover:text-red-700 hover:underline block"
            >
              {currentUser.name}
            </Link>

            <p className="text-xs text-slate-500 line-clamp-2 leading-tight">
              {currentUser.headline}
            </p>

            <div className="pt-1">
              <span className="inline-block text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {currentUser.batch || 'JECRC University'}
              </span>
            </div>
          </div>

          {/* Metrics */}
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-left text-xs">
            <div className="p-2 rounded bg-slate-50">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Connections</span>
              <span className="font-bold text-slate-900">{currentUser.connectionsCount || 48}</span>
            </div>
            <div className="p-2 rounded bg-slate-50">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Profile Views</span>
              <span className="font-bold text-slate-900">{currentUser.profileViewsCount || 184}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Items */}
      <nav className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-2xs space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          let active = false;

          if (item.isFilter) {
            active = location.pathname === '/' && feedFilter === item.filterVal;
          } else {
            active = location.pathname === item.path;
          }

          if (item.isFilter) {
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => setFeedFilter(item.filterVal)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                  active
                    ? 'bg-red-50 text-red-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-red-700' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                active
                  ? 'bg-red-50 text-red-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${active ? 'text-red-700' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
