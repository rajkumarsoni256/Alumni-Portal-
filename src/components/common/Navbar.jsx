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
  ExternalLink
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
    activeRole, 
    currentUser, 
    searchQuery, 
    setSearchQuery, 
    notifications, 
    markNotificationRead,
    setFeedFilter,
    showNotification 
  } = useApp();

  const unreadNotifsCount = notifications.filter((n) => n.unread).length;

  const navLinks = [
    { name: 'Feed', path: '/' },
    { name: 'Explore Alumni', path: '/explore' },
    { name: 'Find Mentor', path: '/find-mentor' },
    { name: 'Events', path: '/events' },
  ];

  const getDashboardPath = () => {
    if (activeRole === 'student') return '/student-dashboard';
    if (activeRole === 'alumni') return `/alumni/${currentUser.id || 'alm_1'}`;
    return '/admin';
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
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
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-6 shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/ju-alumni-logo.jpg"
              alt="JECRC Community"
              className="h-8 w-8 object-contain rounded-md"
            />
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-slate-900 tracking-tight">
                JECRC <span className="text-red-700">Community</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                • Alumni
              </span>
            </div>
          </Link>

          {/* Compact Search Bar */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden md:block w-64 lg:w-72"
          >
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people, posts, jobs..."
                className="w-full bg-slate-100 hover:bg-slate-100/90 focus:bg-white border border-transparent focus:border-slate-300 rounded-md pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Center: Clean Text Navigation */}
        <nav className="hidden lg:flex items-center gap-1 h-full">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors relative flex items-center h-9 ${
                  active
                    ? 'text-red-700 bg-red-50/60 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions (Messages, Notifications, Profile) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Messages */}
          <Link
            to="/my-connections"
            className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
            title="Messages"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </Link>

          {/* Notifications */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-lg border border-slate-200 shadow-lg p-3 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {unreadNotifsCount} unread
                  </span>
                </div>

                <div className="space-y-1 max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.link) navigate(n.link);
                        setShowNotifDropdown(false);
                      }}
                      className={`pt-2 first:pt-0 p-2 rounded-md transition-colors cursor-pointer flex items-start gap-2.5 ${
                        n.unread ? 'bg-slate-50' : 'hover:bg-slate-50'
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
                  to="/welcome"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center gap-2 transition-colors border-t border-slate-100 pt-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Public Landing Page</span>
                </Link>

                <button
                  onClick={() => {
                    showNotification('Signed out from JECRC demo session', 'info');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-2">
          <form onSubmit={handleSearchSubmit} className="pb-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search community..."
                className="w-full bg-slate-100 border border-transparent rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </form>

          <div className="flex flex-col space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-xs font-semibold ${
                  isActive(link.path)
                    ? 'text-red-700 bg-red-50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              About JECRC Network
            </Link>
            <Link
              to="/welcome"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Public Showcase Page
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
