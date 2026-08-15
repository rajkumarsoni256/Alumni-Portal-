import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, ShieldAlert } from 'lucide-react';

export const SessionExpiredModal = ({ isOpen, onClose, intendedReturnPath }) => {
  let navigate = null;
  try {
    navigate = useNavigate();
  } catch (e) {
    navigate = null;
  }

  if (!isOpen) return null;

  const handleLoginAgain = () => {
    onClose?.();
    const returnTarget = intendedReturnPath && intendedReturnPath !== '/login' ? intendedReturnPath : null;
    if (navigate) {
      navigate('/login', {
        replace: true,
        state: { from: returnTarget },
      });
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        {/* Header Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 mb-4 ring-8 ring-amber-50 dark:ring-amber-950/50">
          <ShieldAlert className="h-7 w-7" />
        </div>

        {/* Text Content */}
        <div className="text-center">
          <h3 id="session-expired-title" className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Your session has expired
          </h3>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            For your security, your session has expired. Please log in again to continue using JU Connect.
          </p>
          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex items-start space-x-2.5 text-left text-xs text-slate-500 dark:text-slate-400">
            <Lock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Your account and data are safe. You need to authenticate again before continuing.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleLoginAgain}
            className="w-full inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-lg shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            <LogIn className="h-4 w-4" />
            <span>Log In Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
