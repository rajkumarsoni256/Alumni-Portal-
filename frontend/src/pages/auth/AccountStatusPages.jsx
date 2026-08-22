import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, Clock, LogOut, RefreshCw, Mail } from 'lucide-react';

export const PendingApprovalPage = () => {
  const { authUser, logoutUser } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6 text-center">
        
        <div className="w-16 h-16 bg-amber-50 border-2 border-amber-300 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Account Under Review
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Pending Admin Approval
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Welcome, <strong className="text-slate-900">{authUser?.fullName || authUser?.email}</strong>! Your alumni registration request is currently under review by JECRC University Administration.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2.5 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Mail className="w-4 h-4 text-slate-500 shrink-0" />
            <span>What happens next?</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-600 pl-1">
            <li>Our alumni relations office verifies your graduation batch and degree details.</li>
            <li>You will receive an email confirmation once your account status is activated.</li>
            <li>If you have any urgent queries, contact <a href="mailto:alumni@jecrc.ac.in" className="text-red-700 underline font-semibold">alumni@jecrc.ac.in</a>.</li>
          </ul>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Status</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export const DisabledAccountPage = () => {
  const { authUser, logoutUser } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-lg p-6 sm:p-8 space-y-6 text-center">
        
        <div className="w-16 h-16 bg-rose-50 border-2 border-rose-300 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Access Restricted
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Account Disabled or Suspended
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your JU Connect account (<strong className="text-slate-900">{authUser?.email}</strong>) is currently disabled or suspended.
          </p>
        </div>

        <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl text-left space-y-2 text-xs text-rose-900">
          <p className="text-[11px] leading-relaxed">
            If you believe this is an error or need assistance restoring your account access, please reach out to system administrators at <strong className="underline">support@jecrc.ac.in</strong>.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Return to Sign In</span>
          </button>
        </div>

      </div>
    </div>
  );
};
