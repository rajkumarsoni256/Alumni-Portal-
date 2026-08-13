import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export const QuickRoleBar = () => {
  const { authUser, isAuthenticated, activeRole, setActiveRole } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleSwitch = (role) => {
    setActiveRole(role);
    if (role === 'admin' && !location.pathname.startsWith('/admin')) {
      navigate('/admin');
    } else if (role !== 'admin' && location.pathname.startsWith('/admin')) {
      navigate('/');
    }
  };

  const displayName = authUser ? (authUser.name || authUser.email) : null;

  return (
    <div className="bg-slate-900 text-slate-300 text-[11px] py-1 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span className="text-slate-400">Role View:</span>
          <span className="font-semibold text-white">
            {activeRole === 'student' && (displayName ? `Student (${displayName})` : 'Student')}
            {activeRole === 'alumni' && (displayName ? `Alumni (${displayName})` : 'Alumni')}
            {activeRole === 'admin' && (displayName ? `Admin (${displayName})` : 'Admin')}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[10px]">Switch:</span>
          <div className="flex items-center gap-0.5 bg-slate-800 rounded p-0.5">
            <button
              onClick={() => handleRoleSwitch('student')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                activeRole === 'student'
                  ? 'bg-slate-950 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => handleRoleSwitch('alumni')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                activeRole === 'alumni'
                  ? 'bg-slate-950 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Alumni
            </button>
            <button
              onClick={() => handleRoleSwitch('admin')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                activeRole === 'admin'
                  ? 'bg-red-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
