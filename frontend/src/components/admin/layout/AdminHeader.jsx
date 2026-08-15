import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { 
  Search, 
  Bell, 
  MessageSquare, 
  ChevronDown, 
  UserCheck2, 
  Settings, 
  LogOut, 
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

export const AdminHeader = ({ onSearch }) => {
  const navigate = useNavigate();
  const { currentUser, logout, notifications, unreadNotifsCount } = useApp();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(globalQuery);
    } else if (globalQuery.trim()) {
      navigate(`/admin/users?q=${encodeURIComponent(globalQuery.trim())}`);
    }
  };

  const unreadCount = unreadNotifsCount || notifications?.filter(n => n.unread || n.isRead === false).length || 0;

  return (
    <header className="h-[74px] bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between selection:bg-red-700 selection:text-white">
      {/* Left Branding */}
      <div className="flex items-center gap-3 shrink-0">
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
        {/* Messages */}
        <Link
          to="/admin/communications"
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors relative cursor-pointer"
          title="Communications & Messages"
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
                <span className="text-[10px] text-slate-500 font-semibold">{unreadCount} unread</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                      <p className="font-semibold text-slate-800 text-[11px]">{n.title || n.message}</p>
                      <span className="text-[10px] text-slate-400">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Just now'}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs">No new notifications</div>
                )}
              </div>
              <div className="px-3 py-1.5 border-t border-slate-100 text-center">
                <Link to="/admin/communications" className="text-[11px] font-bold text-red-700 hover:underline">
                  View All Announcements
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
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs overflow-hidden shrink-0">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <span>{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}</span>
              )}
            </div>
            <div className="hidden sm:block min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate block leading-tight">
                {currentUser?.name || 'Dean of Alumni'}
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
                <p className="font-bold text-slate-900 truncate">{currentUser?.name || 'Administrator'}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email || 'admin@jecrc.ac.in'}</p>
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
                onClick={() => {
                  setShowProfileDropdown(false);
                  logout && logout();
                }}
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
  );
};
