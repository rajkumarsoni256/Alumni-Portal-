import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
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
      : `${currentUser.degree || 'B.Tech'} • Class of ${currentUser.graduationYear || '2026'}`;

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
              <UserAvatar
                src={currentUser.avatar}
                name={currentUser.name}
                className="w-10 h-10 group-hover:ring-2 group-hover:ring-red-600/30 transition-all"
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

            <span className="text-red-700 bg-red-50 text-[10px] font-semibold px-2 py-0.5 rounded capitalize">
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
                    ? 'bg-red-50/80 text-red-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-red-700' : 'text-slate-500'}`} />
                  <span>{link.name}</span>
                </div>

                {link.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-700 text-white min-w-4 text-center">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Meta */}
      <div className="px-3 text-[11px] text-slate-400 space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-500">JU Connect</span>
          <span className="text-[10px]">v1.2</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 flex-wrap">
          <Link to="/about" className="hover:underline hover:text-slate-600">About</Link>
          <span>•</span>
          <Link to="/welcome" className="hover:underline hover:text-slate-600">Public Portal</Link>
          <span>•</span>
          <Link to="/about" className="hover:underline hover:text-slate-600">Help Center</Link>
        </div>
        {/* Social Icons matching image */}
        <div className="flex items-center gap-3 pt-1 text-slate-400">
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 transition-colors" title="LinkedIn">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 transition-colors" title="Instagram">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 transition-colors" title="YouTube">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 transition-colors" title="X (Twitter)">
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
        </div>
      </div>

    </aside>
  );
};
