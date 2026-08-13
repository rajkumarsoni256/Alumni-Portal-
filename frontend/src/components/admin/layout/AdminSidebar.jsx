import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  Database, 
  Settings, 
  ShieldCheck, 
  Home,
  ChevronRight
} from 'lucide-react';

export const AdminSidebar = ({ className = '' }) => {
  const location = useLocation();
  const { currentUser } = useApp();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Users Directory', path: '/admin/users', icon: Users },
    { name: 'Data Management', path: '/admin/data', icon: Database },
    { name: 'Admin Settings', path: '/admin/settings', icon: Settings },
  ];

  const isLinkActive = (item) => {
    if (item.exact) {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <aside className={`w-64 shrink-0 flex flex-col justify-between space-y-4 ${className}`}>
      <div className="space-y-3">
        
        {/* User Profile Mini Card (Light theme identical to AppSidebar) */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-3">
          <Link 
            to="/admin/settings" 
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-red-600/30 transition-all"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full border-2 border-white" title="Admin Account" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900 truncate block group-hover:text-red-700 transition-colors">
                  {currentUser.name || 'Dean of Alumni'}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-red-700 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-500 truncate leading-snug">
                Directorate of Alumni Relations
              </p>
            </div>
          </Link>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <Link
              to="/admin/settings"
              className="text-slate-600 hover:text-red-700 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <span>Admin Settings</span>
              <ChevronRight className="w-3 h-3" />
            </Link>

            <span className="text-red-700 capitalize text-[10px] font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200/60">
              Admin Console
            </span>
          </div>
        </div>

        {/* Primary Navigation Menu */}
        <nav className="bg-white rounded-xl border border-slate-200 p-2 shadow-2xs space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isLinkActive(item);

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-red-50 text-red-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-red-700' : 'text-slate-500'}`} />
                  <span className="truncate">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

      </div>
    </aside>
  );
};
