import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  UserCheck, 
  Clock, 
  Users, 
  Calendar, 
  Eye, 
  Check, 
  X, 
  Video, 
  Sparkles, 
  GraduationCap,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AlumniDashboard = () => {
  const { requests, updateRequestStatus, alumniList } = useApp();

  // Find Priya Sharma (or default alumni mentor)
  const currentAlumni = alumniList.find((a) => a.id === 'alm_1') || alumniList[0];

  const alumniRequests = requests.filter((r) => r.alumniId === currentAlumni.id);
  const pendingRequests = alumniRequests.filter((r) => r.status === 'Pending');
  const upcomingSessions = alumniRequests.filter((r) => r.status === 'Accepted');
  const completedSessions = alumniRequests.filter((r) => r.status === 'Completed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Greeting Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-bold">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Alumni Mentor Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {currentAlumni.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-300">
            {currentAlumni.currentRole} at <strong className="text-white">{currentAlumni.company}</strong> • Class of {currentAlumni.graduationYear}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex items-center gap-3 relative z-10">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <div className="text-xs">
            <span className="text-slate-300 font-medium block">Mentorship Status</span>
            <span className="font-extrabold text-emerald-400 text-sm">Active & Accepting Requests</span>
          </div>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Mentorship Requests */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Requests</span>
            <p className="text-3xl font-extrabold text-slate-900">{pendingRequests.length}</p>
            <p className="text-xs text-amber-600 font-semibold">Requires Action</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Students Helped */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Students Helped</span>
            <p className="text-3xl font-extrabold text-slate-900">14</p>
            <p className="text-xs text-emerald-600 font-semibold">Campus Mentees</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Sessions</span>
            <p className="text-3xl font-extrabold text-slate-900">{upcomingSessions.length}</p>
            <p className="text-xs text-indigo-600 font-semibold">Scheduled 1-on-1s</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Profile Views */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profile Views</span>
            <p className="text-3xl font-extrabold text-slate-900">340</p>
            <p className="text-xs text-purple-600 font-semibold">This Semester</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-50 text-purple-600">
            <Eye className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* SECTION 1: New Student Requests */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-500" />
            <span>Pending Student Mentorship Requests</span>
          </h2>
          <span className="text-xs font-bold bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
            {pendingRequests.length} Action Needed
          </span>
        </div>

        {pendingRequests.length > 0 ? (
          <div className="space-y-4">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={req.studentAvatar}
                      alt={req.studentName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-100"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{req.studentName}</h3>
                      <p className="text-xs text-slate-500 font-medium">{req.studentDegree}</p>
                    </div>
                  </div>

                  <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100 self-start sm:self-auto">
                    Category: {req.category}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Request Reason:</strong> "{req.reason}"
                  </p>
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Student Goals:</strong> "{req.goals}"
                  </p>
                  <p className="text-slate-500 font-medium pt-1">
                    Meeting Preference: <strong>{req.meetingType}</strong>
                  </p>
                </div>

                {/* Accept / Decline Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => updateRequestStatus(req.id, 'Declined')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-4 h-4 text-rose-500" />
                    <span>Decline</span>
                  </button>

                  <button
                    onClick={() => updateRequestStatus(req.id, 'Accepted', 'Upcoming Saturday 4:00 PM IST')}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept & Schedule Session</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-xs text-slate-500">
            No pending requests right now. You are up to date!
          </div>
        )}
      </div>

      {/* SECTION 2: Upcoming Scheduled Sessions */}
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" />
          <span>Upcoming Mentorship Sessions</span>
        </h2>

        {upcomingSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingSessions.map((sess) => (
              <div key={sess.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-md border border-emerald-200">
                      Confirmed Session
                    </span>
                    <span className="text-slate-500 font-semibold">{sess.scheduledTime}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={sess.studentAvatar}
                      alt={sess.studentName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{sess.studentName}</h4>
                      <p className="text-xs text-indigo-600 font-medium">{sess.studentDegree}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                    Topic: <strong>{sess.category}</strong>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={sess.meetingLink || 'https://meet.google.com'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Open Meeting Link</span>
                  </a>

                  <button
                    onClick={() => updateRequestStatus(sess.id, 'Completed')}
                    className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                  >
                    Mark Completed
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-xs text-slate-500">
            No upcoming sessions scheduled yet.
          </div>
        )}
      </div>
    </div>
  );
};
