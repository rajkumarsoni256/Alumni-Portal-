import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Menu, 
  X, 
  LayoutDashboard,
  MessageSquare,
  Bell,
  Search,
  User,
  Bookmark,
  LogOut,
  ChevronDown,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const profileMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { 
    isAuthenticated,
    logoutUser,
    activeRole, 
    currentUser, 
    searchQuery, 
    setSearchQuery, 
    notifications, 
    markNotificationRead,
    setFeedFilter,
    unreadMessagesCount,
  } = useApp();

  const unreadNotifsCount = notifications.filter((n) => n.unread).length;

  const navLinks = activeRole === 'alumni'
    ? [
        { name: 'Feed', path: '/' },
        { name: 'Network', path: '/network' },
        { name: 'Alumni Directory', path: '/explore' },
        { name: 'Mentorship Requests', path: '/alumni-dashboard' },
        { name: 'Jobs', path: '/jobs' },
        { name: 'Events', path: '/events' },
      ]
    : activeRole === 'admin'
    ? [
        { name: 'Admin Hub', path: '/admin' },
        { name: 'Feed', path: '/' },
        { name: 'Network', path: '/network' },
        { name: 'Directory', path: '/explore' },
        { name: 'Jobs', path: '/jobs' },
        { name: 'Events', path: '/events' },
      ]
    : [
        { name: 'Feed', path: '/' },
        { name: 'Network', path: '/network' },
        { name: 'Explore Alumni', path: '/explore' },
        { name: 'Find Mentor', path: '/find-mentor' },
        { name: 'Jobs', path: '/jobs' },
        { name: 'Events', path: '/events' },
      ];

  const getDashboardPath = () => {
    return '/profile/me';
  };

  const isActive = (path) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/home')) return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/search');
    } else if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    logoutUser();
    navigate('/login');
  };

  // Hide global search on pure auth pages
  const isAuthPage = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/select-role', '/onboarding'].some(p => location.pathname.startsWith(p));

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity with Official JU Crest */}
        <div className="flex items-center gap-6 shrink-0">
          <Link 
            to={isAuthenticated ? '/' : '/welcome'} 
            className="flex items-center gap-2.5 group"
            title="JECRC Community"
          >
            <img
              src="/ju-alumni-logo.jpg"
              alt="JECRC Alumni Association Logo"
              className="h-8 w-8 object-contain rounded-md border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
            />
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-slate-900 tracking-tight">
                JECRC <span className="text-red-700">Community</span>
              </span>
              <span className="hidden md:inline-block text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                • Alumni
              </span>
            </div>
          </Link>

          {/* Search Bar (Feed & Discovery) */}
          {isAuthenticated && !isAuthPage && (
            <form 
              onSubmit={handleSearchSubmit} 
              className="hidden lg:flex items-center relative w-64 xl:w-72"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search people, posts, jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-slate-900 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-transparent focus:border-slate-300 focus:outline-none transition-colors"
              />
            </form>
          )}
        </div>

        {/* Center/Right: Navigation Tabs */}
        {isAuthenticated ? (
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-600">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md transition-colors ${
                  isActive(link.path)
                    ? 'text-red-700 font-semibold bg-red-50/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-600">
            <Link to="/welcome" className="hover:text-slate-900">About</Link>
            <Link to="/explore" className="hover:text-slate-900">Alumni Directory</Link>
            <Link to="/events" className="hover:text-slate-900">Events</Link>
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Messages Link */}
              <Link
                to="/messages"
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Messages"
              >
                <MessageSquare className="w-4 h-4" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600" />
                )}
              </Link>

              {/* Notifications Dropdown */}
              <div className="relative" ref={notifMenuRef}>
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600" />
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Notifications</span>
                      <span className="text-[10px] text-slate-400">{unreadNotifsCount} unread</span>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3 flex items-start gap-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                            n.unread ? 'bg-red-50/30' : ''
                          }`}
                        >
                          <img
                            src={n.avatar}
                            alt={n.actor}
                            className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                          />
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <p className="text-xs text-slate-700 leading-snug">
                              <span className="font-semibold text-slate-900">{n.actor}</span> {n.text}
                            </p>
                            <span className="text-[10px] text-slate-400">{n.time}</span>
                          </div>
                          {n.unread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 mt-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

              {/* User Profile Avatar Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                  <div className="hidden sm:block text-left leading-tight">
                    <span className="text-xs font-semibold text-slate-900 block truncate max-w-[100px]">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize block -mt-0.5">
                      {activeRole}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 top-11 z-50 w-56 bg-white rounded-lg border border-slate-200 shadow-lg p-2 space-y-1">
                    <div className="p-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {currentUser.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {currentUser.headline}
                      </span>
                    </div>

                    <Link
                      to={getDashboardPath()}
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Profile</span>
                    </Link>

                    <button
                      onClick={() => {
                        setFeedFilter('saved');
                        navigate('/');
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors cursor-pointer text-left"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                      <span>Saved Bookmarks</span>
                    </button>

                    <Link
                      to={getDashboardPath()}
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                      <span className="capitalize">{activeRole} Dashboard</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Account Settings</span>
                    </Link>

                    <Link
                      to="/welcome"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center gap-2 transition-colors border-t border-slate-100 pt-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      <span>Public Landing Page</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Unauthenticated Public CTAs */
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1 shadow-2xs"
              >
                <span>Join</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          {isAuthenticated && (
            <div className="pb-2 mb-2 border-b border-slate-100">
              <input
                type="text"
                placeholder="Search community..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none"
              />
            </div>
          )}

          <div className="space-y-1">
            {isAuthenticated ? (
              navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-xs font-medium ${
                    isActive(link.path)
                      ? 'text-red-700 bg-red-50 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))
            ) : (
              <>
                <Link
                  to="/welcome"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Public Overview
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-xs font-semibold text-red-700 bg-red-50"
                >
                  Join the Community
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
