import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Search,
  Bell,
  MessageSquare,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldAlert,
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
    unreadNotifsCount: appUnreadNotifsCount,
    markNotificationRead,
    setFeedFilter,
    unreadMessagesCount,
  } = useApp();

  const unreadNotifsCount = appUnreadNotifsCount ?? notifications.filter((n) => n.unread || n.isRead === false).length;

  const navLinks = activeRole === 'alumni'
    ? [
        { name: 'Feed', path: '/' },
        { name: 'Discover', path: '/network' },
        { name: 'My Connections', path: '/my-connections' },
        { name: 'Alumni Directory', path: '/explore' },
        { name: 'Mentorship Requests', path: '/alumni-dashboard' },
        { name: 'Jobs', path: '/jobs' },
        { name: 'Events', path: '/events' },
      ]
    : activeRole === 'admin'
    ? [
        { name: 'Admin Dashboard', path: '/admin-dashboard' },
        { name: 'Feed Preview', path: '/' },
        { name: 'My Connections', path: '/my-connections' },
        { name: 'Directory', path: '/explore' },
        { name: 'Jobs', path: '/jobs' },
        { name: 'Events', path: '/events' },
      ]
    : [
        { name: 'Feed', path: '/' },
        { name: 'Discover', path: '/network' },
        { name: 'My Connections', path: '/my-connections' },
        { name: 'Find Alumni', path: '/explore' },
        { name: 'My Dashboard', path: '/student-dashboard' },
        { name: 'Jobs & Referrals', path: '/jobs' },
        { name: 'Events', path: '/events' },
      ];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (location.pathname !== '/' && location.pathname !== '/explore') {
        navigate('/explore');
      }
    }
  };

  const handleNotificationClick = (n) => {
    markNotificationRead(n.id);
    setShowNotifDropdown(false);
    if (n.entityType === 'CONNECTION') {
      navigate('/network');
    } else if (n.entityType === 'POST') {
      navigate('/');
    } else if (n.entityType === 'CONVERSATION') {
      navigate(n.entityId ? `/messages?conv=${n.entityId}` : '/messages');
    } else if (n.entityType === 'JOB') {
      navigate('/jobs');
    } else {
      navigate('/notifications');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/ju-alumni-logo.jpg"
                alt="JU Connect Logo"
                className="w-9 h-9 rounded-lg object-cover border border-slate-200 shadow-2xs group-hover:opacity-90 transition-opacity"
              />
              <div className="flex flex-col">
                <span className="font-bold text-base text-slate-900 leading-tight tracking-tight">
                  JU <span className="text-red-700">Connect</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium leading-none">
                  Alumni Network
                </span>
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          {isAuthenticated && (
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search alumni by company, skills, or batch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-1.5 text-xs bg-slate-100/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all text-slate-900 placeholder:text-slate-500"
                />
              </form>
            </div>
          )}

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'text-red-700 bg-red-50/70'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Action Icons & Profile Dropdown */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Messages Link (Non-Admin only) */}
                {activeRole !== 'admin' && (
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
                )}

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
                        {notifications.length > 0 ? (
                          notifications.map((n) => {
                            const actorName = n.actor?.name || 'JECRC Member';
                            return (
                              <div
                                key={n.id}
                                onClick={() => handleNotificationClick(n)}
                                className={`p-3 flex items-start gap-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                                  n.unread || !n.isRead ? 'bg-red-50/30' : ''
                                }`}
                              >
                                <img
                                  src={n.avatar}
                                  alt={actorName}
                                  className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-slate-200"
                                />
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <p className="text-xs text-slate-700 leading-snug">
                                    <span className="font-semibold text-slate-900">{n.title || actorName}</span> - {n.message || n.text}
                                  </p>
                                  <span className="text-[10px] text-slate-400">{n.time}</span>
                                </div>
                                {(n.unread || !n.isRead) && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 mt-2" />
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-6 text-center text-xs text-slate-500">
                            No notifications yet
                          </div>
                        )}
                      </div>

                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifDropdown(false)}
                        className="block w-full py-2 bg-slate-50 hover:bg-slate-100 text-center text-[11px] font-semibold text-red-700 transition-colors border-t border-slate-100"
                      >
                        View all notifications
                      </Link>
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
                        {currentUser.name}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 top-11 z-50 w-56 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden py-1">
                      <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800 capitalize">
                          {activeRole} Account
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <Settings className="w-3.5 h-3.5 text-slate-400" />
                          <span>Account Settings</span>
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            logoutUser();
                          }}
                          className="flex items-center gap-2 w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 font-medium transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
                  aria-label="Toggle Navigation Menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors shadow-2xs"
                >
                  Join Network
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          <form onSubmit={handleSearchSubmit} className="mb-3 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search alumni..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-900"
            />
          </form>

          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`block px-3 py-2 rounded-md text-xs font-semibold ${
                location.pathname === link.path
                  ? 'text-red-700 bg-red-50'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
