import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { adminUserService } from '../../../services/adminUserService';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Megaphone,
  Bell, 
  Briefcase, 
  Calendar, 
  Layers, 
  UserCheck2,
  Database, 
  Settings, 
  LogOut,
  ChevronRight
} from 'lucide-react';

export const AdminSidebar = ({ className = '' }) => {
  const location = useLocation();
  const { currentUser, logout } = useApp();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchPendingCount = async () => {
      try {
        const res = await adminUserService.getVerifications({ status: 'PENDING', pageSize: 1 });
        if (isMounted && res) {
          setPendingCount(res.totalCount || (Array.isArray(res.verifications) ? res.verifications.length : 0));
        }
      } catch (err) {
        // Silent fallback
      }
    };
    fetchPendingCount();
    return () => { isMounted = false; };
  }, [location.pathname]);

  const sections = [
    {
      group: 'GENERAL',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
      ]
    },
    {
      group: 'USERS',
      items: [
        { name: 'All Users Directory', path: '/admin/users', icon: Users, exact: true },
        { name: 'Alumni Verification Queue', path: '/admin/approvals', icon: UserCheck, exact: true, badge: pendingCount },
      ]
    },
    {
      group: 'COMMUNICATIONS',
      items: [
        { name: 'System Announcements', path: '/admin/communications', icon: Megaphone, exact: true },
        { name: 'Notifications', path: '/admin/notifications', icon: Bell, exact: true },
      ]
    },
    {
      group: 'CONTENT',
      items: [
        { name: 'Content Management', path: '/admin/content', icon: Layers },
        { name: 'Jobs Management', path: '/admin/content?tab=jobs', icon: Briefcase },
        { name: 'Events Management', path: '/admin/content?tab=events', icon: Calendar },
      ]
    },
    {
      group: 'DATA & OPERATIONS',
      items: [
        { name: 'Data Management & Export', path: '/admin/data', icon: Database },
      ]
    },
    {
      group: 'ADMINISTRATION',
      items: [
        { name: 'Admin Profile', path: '/admin/profile', icon: UserCheck2 },
        { name: 'System Settings', path: '/admin/settings', icon: Settings },
      ]
    }
  ];

  const isLinkActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin/dashboard');
    }
    const [itemPath, itemQuery] = item.path.split('?');
    if (itemQuery) {
      return location.pathname === itemPath && location.search.includes(itemQuery);
    }
    return location.pathname.startsWith(itemPath);
  };

  return (
    <aside className={`w-64 shrink-0 flex flex-col justify-between space-y-4 selection:bg-red-700 selection:text-white ${className}`}>
      <div className="space-y-4">
        
        {/* Navigation Groups */}
        <nav className="bg-white rounded-md border border-slate-200 p-2.5 space-y-3">
          {sections.map((section, idx) => (
            <div key={section.group} className={idx > 0 ? 'pt-2.5 border-t border-slate-100' : ''}>
              <h3 className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {section.group}
              </h3>
              <div className="space-y-0.5 mt-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isLinkActive(item);

                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                        active
                          ? 'bg-red-50 text-red-700 font-bold border-l-2 border-red-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-red-700' : 'text-slate-400'}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-red-700 text-white shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Admin Identity Institutional Card */}
        <div className="bg-white rounded-md border border-slate-200 p-3.5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm overflow-hidden shrink-0">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <span>{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'D'}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-900 truncate block">
                {currentUser?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-slate-500 truncate block">
                Directorate of Alumni Relations
              </span>
            </div>
          </div>

          <Link
            to="/admin/profile"
            className="w-full py-1.5 rounded border border-red-700 text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer text-center block"
          >
            <span>View Profile</span>
          </Link>
        </div>

      </div>
    </aside>
  );
};
