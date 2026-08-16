import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { UserAvatar } from '../../common/UserAvatar';
import { AdminSidebar } from './AdminSidebar';
import { 
  Search, 
  Bell, 
  MessageSquare, 
  ChevronDown, 
  UserCheck2, 
  Settings, 
  LogOut, 
  ShieldCheck,
  GraduationCap,
  Menu,
  X
} from 'lucide-react';

export const AdminHeader = ({ onSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentUser, 
    authUser,
    logout, 
    logoutUser, 
    notifications, 
    unreadNotifsCount, 
    markNotificationRead, 
    markAllNotificationsRead 
  } = useApp();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const handleSignOut = () => {
    setShowProfileDropdown(false);
    const logoutFn = logout || logoutUser;
    if (logoutFn) {
      logoutFn();
    }
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(globalQuery);
    } else if (globalQuery.trim()) {
      navigate(`/admin/users?q=${encodeURIComponent(globalQuery.trim())}`);
    }
  };

  const unreadCount = unreadNotifsCount || notifications?.filter(n => n.unread || n.isRead === false).length || 0;
  const adminName = currentUser?.name || authUser?.fullName || 'Administrator';
  const adminEmail = currentUser?.email || authUser?.email || 'admin@jecrc.ac.in';
  const avatarUrl = currentUser?.avatar || authUser?.avatarUrl || null;

  return (
    <>
      <header className="h-[74px] bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between selection:bg-red-700 selection:text-white">
        {/* Left Branding & Mobile Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/admin" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-md bg-red-700 text-white flex items-center justify-center font-black text-base shadow-2xs group-hover:bg-red-800 transition-colors">
              JU
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm tracking-tight leading-none">JU Connect</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-50 text-red-700 border border-red-200 uppercase leading-none">
                  Admin
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 block leading-tight mt-0.5">
                Administration Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg mx-6 hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            placeholder="Search by name, email, roll number or company..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-700 transition-all"
          />
        </form>

        {/* Right Controls & Admin Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Communications */}
          <Link
            to="/admin/communications"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors relative cursor-pointer"
            title="System Communications"
          >
            <MessageSquare className="w-4 h-4" />
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-700 text-white text-[9px] font-extrabold flex items-center justify-center border border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md border border-slate-200 shadow-lg py-2 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-900">Admin Notifications</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && markAllNotificationsRead && (
                      <button
                        type="button"
                        onClick={() => markAllNotificationsRead()}
                        className="text-[10px] text-red-700 hover:text-red-800 font-bold cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                    <span className="text-[10px] text-slate-500 font-semibold">{unreadCount} unread</span>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                  {notifications && notifications.length > 0 ? (
                    notifications.slice(0, 5).map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => markNotificationRead && markNotificationRead(n.id)}
                        className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer ${n.unread || n.isRead === false ? 'bg-red-50/40 font-medium' : ''}`}
                      >
                        <p className="font-semibold text-slate-800 text-[11px]">{n.title || n.message}</p>
                        <span className="text-[10px] text-slate-400">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Just now'}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">No new notifications</div>
                  )}
                </div>
                <div className="px-3 py-1.5 border-t border-slate-100 text-center">
                  <Link 
                    to="/admin/notifications" 
                    onClick={() => setShowNotifDropdown(false)}
                    className="text-[11px] font-bold text-red-700 hover:underline"
                  >
                    View All Notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Vertical Divider */}
          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Admin Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2.5 p-1.5 rounded-md hover:bg-slate-50 transition-colors cursor-pointer text-left"
            >
              <UserAvatar
                src={avatarUrl}
                name={adminName}
                className="w-8 h-8 text-xs shrink-0"
              />
              <div className="hidden sm:block min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate block leading-tight">
                  {adminName}
                </span>
                <span className="text-[10px] text-slate-500 truncate block leading-tight">
                  Directorate of Alumni
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-md border border-slate-200 shadow-lg py-1 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900 truncate">{adminName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{adminEmail}</p>
                </div>
                <Link
                  to="/admin/profile"
                  className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  <UserCheck2 className="w-4 h-4 text-slate-400" />
                  <span>Admin Profile</span>
                </Link>
                <Link
                  to="/admin/settings"
                  className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>System Settings</span>
                </Link>
                <div className="border-t border-slate-100 my-1" />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-700 hover:bg-red-50 transition-colors cursor-pointer text-left font-semibold"
                >
                  <LogOut className="w-4 h-4 text-red-700" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay & Sidebar for Admin Portal on viewports < 1024px */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileDrawerOpen(false)} 
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white p-4 overflow-y-auto shadow-xl z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-red-700 text-white font-bold flex items-center justify-center text-xs">
                  JU
                </div>
                <span className="font-bold text-slate-900 text-xs">Admin Portal</span>
              </div>
              <button 
                type="button" 
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AdminSidebar className="w-full" />
          </div>
        </div>
      )}
    </>
  );
};
