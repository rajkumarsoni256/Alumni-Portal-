import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  Home, 
  Compass, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  Bookmark, 
  Sparkles,
  Inbox,
  LayoutDashboard,
  ShieldCheck,
  PlusCircle,
  ArrowRight
} from 'lucide-react';
import { getRoleCapabilities } from '../../utils/roleCapabilities';

export const FeedLeftSidebar = () => {
  const { currentUser, feedFilter, setFeedFilter, activeRole, requests, myConnections } = useApp();
  const location = useLocation();

  const realCount = myConnections?.length !== undefined ? myConnections.length : (currentUser.connectionsCount || 0);
  const countDisplay = realCount >= 500 ? '500+' : String(realCount);

  const caps = getRoleCapabilities(activeRole);
  const pendingRequestsCount = requests.filter((r) => r.status === 'Pending').length;

  const getProfileLink = () => {
    if (activeRole === 'student') return '/student-dashboard';
    if (activeRole === 'alumni') return `/alumni/${currentUser.id || 'alm_1'}`;
    return '/admin';
  };

  const navItems = caps.isAlumni
    ? [
        { 
          name: 'Community Feed', 
          icon: Home, 
          path: '/', 
          isFilter: true, 
          filterVal: 'all' 
        },
        { 
          name: 'Alumni Directory', 
          icon: Compass, 
          path: '/explore' 
        },
        { 
          name: 'Mentorship Requests', 
          icon: Inbox, 
          path: '/alumni-dashboard',
          badge: pendingRequestsCount > 0 ? `${pendingRequestsCount} Pending` : null,
          badgeColor: 'bg-red-50 text-red-700 border border-red-200'
        },
        { 
          name: 'Post / Manage Jobs', 
          icon: Briefcase, 
          badge: 'Post Job',
          badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          path: '/jobs' 
        },
        { 
          name: 'Campus Events', 
          icon: Calendar, 
          path: '/events' 
        },
        { 
          name: 'Messages', 
          icon: MessageSquare, 
          path: '/messages' 
        },
        { 
          name: 'Saved Posts', 
          icon: Bookmark, 
          isFilter: true, 
          filterVal: 'saved' 
        },
      ]
    : caps.isAdmin
    ? [
        { 
          name: 'Admin Dashboard', 
          icon: LayoutDashboard, 
          path: '/admin' 
        },
        { 
          name: 'Community Feed', 
          icon: Home, 
          path: '/', 
          isFilter: true, 
          filterVal: 'all' 
        },
        { 
          name: 'Directory & Users', 
          icon: Compass, 
          path: '/explore' 
        },
        { 
          name: 'Jobs Board', 
          icon: Briefcase, 
          path: '/jobs' 
        },
        { 
          name: 'Campus Events', 
          icon: Calendar, 
          path: '/events' 
        },
        { 
          name: 'Messages', 
          icon: MessageSquare, 
          path: '/messages' 
        },
      ]
    : [
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
          name: 'Find a Mentor', 
          icon: Sparkles, 
          path: '/find-mentor' 
        },
        { 
          name: 'Jobs & Internships', 
          icon: Briefcase, 
          badge: 'Hiring',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          isFilter: true, 
          filterVal: 'jobs' 
        },
        { 
          name: 'Campus Events', 
          icon: Calendar, 
          path: '/events' 
        },
        { 
          name: 'Messages', 
          icon: MessageSquare, 
          path: '/messages' 
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
            <UserAvatar
              src={currentUser?.avatarUrl || currentUser?.avatar}
              name={currentUser?.name}
              className="w-16 h-16 border-2 border-white shadow-xs mx-auto"
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
              <span className="font-bold text-slate-900">{countDisplay}</span>
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

      {/* 3. Role-Aware Opportunities / Hub Card */}
      {caps.isStudent ? (
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Opportunities for You</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
              Active
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600">
            <Link to="/jobs" className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <span>3 Verified Internships</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </Link>
            <Link to="/find-mentor" className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <span>Find 1-on-1 Mentor</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </div>
      ) : caps.isAlumni ? (
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-red-700" />
              <span>Alumni Hub</span>
            </span>
            <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-1.5 py-0.2 rounded">
              Mentor
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <Link
              to="/alumni-dashboard"
              className="flex items-center justify-between p-2 rounded-lg bg-red-50/60 hover:bg-red-50 text-red-900 border border-red-100 transition-colors"
            >
              <div>
                <span className="font-semibold block">{pendingRequestsCount} Student Requests</span>
                <span className="text-[10px] text-red-700">Awaiting your review</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-red-700" />
            </Link>

            <Link
              to="/jobs"
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
            >
              <span>Post a Job / Referral</span>
              <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
            </Link>
          </div>
        </div>
      ) : null}

    </aside>
  );
};
