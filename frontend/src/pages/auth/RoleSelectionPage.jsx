import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { GraduationCap, UserCheck, Check, ArrowRight, ArrowLeft } from 'lucide-react';

export const RoleSelectionPage = () => {
  const navigate = useNavigate();
  const { setRegistrationRole, pendingRegistration } = useApp();
  const [selectedRole, setSelectedRole] = useState(pendingRegistration?.role || 'student');

  const handleContinue = () => {
    setRegistrationRole(selectedRole);
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-slate-100/75 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        
        {/* Header */}
        <div className="space-y-1 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <img
              src="/ju-alumni-logo.jpg"
              alt="JECRC Community"
              className="h-8 w-8 object-contain rounded-md"
            />
          </Link>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            How are you connected to JECRC?
          </h1>
          <p className="text-xs text-slate-500">
            Select your affiliation to customize your community experience.
          </p>
        </div>

        {/* Role Options */}
        <div className="space-y-3">
          {/* Student Card */}
          <button
            type="button"
            onClick={() => setSelectedRole('student')}
            className={`w-full p-4 rounded-xl border text-left transition-colors cursor-pointer flex items-start justify-between gap-3 ${
              selectedRole === 'student'
                ? 'border-red-600 bg-red-50/50 ring-1 ring-red-600/20'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${selectedRole === 'student' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">Student</span>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Currently studying at JECRC University. Access mentorship, internships, and student project collaborations.
                </p>
              </div>
            </div>
            {selectedRole === 'student' && (
              <div className="w-5 h-5 rounded-full bg-red-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
          </button>

          {/* Alumni Card */}
          <button
            type="button"
            onClick={() => setSelectedRole('alumni')}
            className={`w-full p-4 rounded-xl border text-left transition-colors cursor-pointer flex items-start justify-between gap-3 ${
              selectedRole === 'alumni'
                ? 'border-red-600 bg-red-50/50 ring-1 ring-red-600/20'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${selectedRole === 'alumni' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}`}>
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">Alumni</span>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Graduated from JECRC. Reconnect with fellow alumni, mentor juniors, and post hiring opportunities.
                </p>
              </div>
            </div>
            {selectedRole === 'alumni' && (
              <div className="w-5 h-5 rounded-full bg-red-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
          </button>
        </div>

        {/* Action Button */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <Link
            to="/register"
            className="w-full py-2 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 text-center block"
          >
            Back to registration
          </Link>
        </div>

      </div>
    </div>
  );
};
