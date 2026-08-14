import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { getNavLinksForRole } from '../../utils/roleCapabilities';

export const AppSidebar = ({ className = '' }) => {
  const location = useLocation();
  const { currentUser, activeRole, notifications, unreadMessagesCount, requests } = useApp();

  const unreadNotifsCount = notifications.filter((n) => n.unread).length;
  const pendingRequestsCount = requests.filter((r) => r.status === 'Pending').length;

  const getProfilePath = () => {
    if (activeRole === 'student') return '/student-dashboard';
    if (activeRole === 'alumni') return `/alumni/${currentUser.id || 'alm_1'}`;
    return '/admin';
  };

  const navLinks = getNavLinksForRole(activeRole, {
    unreadNotifsCount,
    unreadMessagesCount,
    pendingRequestsCount,
  });

  const isLinkActive = (link) => {
    if (link.matchExact) {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname.startsWith(link.path);
  };

  const subtitle = activeRole === 'alumni' 
    ? `${currentUser.company || 'Google'} • ${currentUser.batch || 'Class of 2018'}`
    : activeRole === 'admin'
      ? 'Directorate of Alumni Relations'
      : `${currentUser.degree || 'B.Tech CSE'} • Class of ${currentUser.graduationYear || '2026'}`;

  return (
    <aside className={`w-64 shrink-0 flex flex-col justify-between space-y-4 ${className}`}>
      
      <div className="space-y-3">
        {/* User Profile Mini Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-3">
          <Link 
            to={getProfilePath()} 
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-red-600/30 transition-all"
              />
              {activeRole === 'alumni' && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" title="Verified Alumni" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900 truncate block group-hover:text-red-700 transition-colors">
                  {currentUser.name}
                </span>
                {activeRole === 'alumni' && (
                  <ShieldCheck className="w-3 h-3 text-red-700 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate leading-snug">
                {subtitle}
              </p>
            </div>
          </Link>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <Link
              to={getProfilePath()}
              className="text-slate-600 hover:text-red-700 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <span>View Profile</span>
              <ChevronRight className="w-3 h-3" />
            </Link>

            <span className="text-slate-400 capitalize text-[10px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
              {activeRole}
            </span>
          </div>
        </div>

        {/* Primary Navigation Menu */}
        <nav className="bg-white rounded-xl border border-slate-200 p-2 shadow-2xs space-y-0.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isLinkActive(link);

            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-red-50 text-red-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-red-700' : 'text-slate-500'}`} />
                  <span>{link.name}</span>
                </div>

                {link.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-700 text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Meta */}
      <div className="px-3 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>JU Connect</span>
          <span>v1.2</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <Link to="/about" className="hover:underline">About</Link>
          <span>•</span>
          <Link to="/welcome" className="hover:underline">Public Portal</Link>
        </div>
      </div>

    </aside>
  );
};
