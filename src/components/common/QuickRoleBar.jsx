import React from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, Shield, GraduationCap } from 'lucide-react';

export const QuickRoleBar = () => {
  const { activeRole, setActiveRole } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleChange = (role) => {
    setActiveRole(role);
    if (role === 'student' && !location.pathname.startsWith('/student-dashboard')) {
      navigate('/student-dashboard');
    } else if (role === 'alumni' && !location.pathname.startsWith('/alumni-dashboard')) {
      navigate('/alumni-dashboard');
    } else if (role === 'admin' && !location.pathname.startsWith('/admin')) {
      navigate('/admin');
    }
  };

  return (
    <div className="bg-slate-950 text-slate-200 border-b border-red-900/50 text-xs py-2 px-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-medium">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
          <span className="text-slate-400">JECRC University Prototype Mode:</span>
          <span className="font-extrabold text-white capitalize bg-red-900/70 border border-red-700/60 px-2.5 py-0.5 rounded-md">
            {activeRole === 'student' && '🎓 JU Student (Raj Kumar)'}
            {activeRole === 'alumni' && '💼 JU Alumni Mentor (Priya Sharma)'}
            {activeRole === 'admin' && '🏛️ JECRC Admin Director'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 hidden md:inline">Switch Role:</span>
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => handleRoleChange('student')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-bold ${
                activeRole === 'student'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>
            <button
              onClick={() => handleRoleChange('alumni')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-bold ${
                activeRole === 'alumni'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Alumni</span>
            </button>
            <button
              onClick={() => handleRoleChange('admin')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-bold ${
                activeRole === 'admin'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
