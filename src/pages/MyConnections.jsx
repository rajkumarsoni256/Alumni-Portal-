import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Video, 
  ExternalLink, 
  MessageSquare, 
  Calendar, 
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react';

export const MyConnections = () => {
  const { requests, student } = useApp();
  const [activeTab, setActiveTab] = useState('accepted');

  const myRequests = requests.filter((r) => r.studentId === student.id);
  const acceptedMentors = myRequests.filter((r) => r.status === 'Accepted');
  const pendingRequests = myRequests.filter((r) => r.status === 'Pending');
  const completedMentorships = myRequests.filter((r) => r.status === 'Completed');

  const getDisplayedList = () => {
    if (activeTab === 'accepted') return acceptedMentors;
    if (activeTab === 'pending') return pendingRequests;
    return completedMentorships;
  };

  const displayed = getDisplayedList();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
          <Users className="w-3.5 h-3.5" />
          <span>Student Network</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          My Mentorship Connections
        </h1>
        <p className="text-slate-600 text-sm">
          Track your active mentors, scheduled sessions, pending requests, and completed guidance history.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-8 text-sm font-bold">
        <button
          onClick={() => setActiveTab('accepted')}
          className={`pb-3.5 relative flex items-center gap-2 transition-colors ${
            activeTab === 'accepted' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Active Mentors</span>
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-extrabold">
            {acceptedMentors.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3.5 relative flex items-center gap-2 transition-colors ${
            activeTab === 'pending' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Pending Requests</span>
          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-extrabold">
            {pendingRequests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3.5 relative flex items-center gap-2 transition-colors ${
            activeTab === 'completed' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckCircle className="w-4 h-4 text-indigo-500" />
          <span>Past Mentorships</span>
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-extrabold">
            {completedMentorships.length}
          </span>
        </button>
      </div>

      {/* Cards List */}
      {displayed.length > 0 ? (
        <div className="space-y-6">
          {displayed.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left Info */}
              <div className="flex items-start gap-4">
                <img
                  src={req.alumniAvatar}
                  alt={req.alumniName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm bg-slate-100 shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{req.alumniName}</h3>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        req.status === 'Accepted'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : req.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-indigo-600">{req.alumniRole}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium pt-1">
                    <span>Topic: <strong className="text-slate-800">{req.category}</strong></span>
                    <span>•</span>
                    <span>Requested: {req.requestedDate}</span>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2 max-w-2xl">
                    "{req.reason}"
                  </p>
                </div>
              </div>

              {/* Right Action */}
              <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-stretch md:items-end justify-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                {req.status === 'Accepted' && req.meetingLink && (
                  <a
                    href={req.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Google Meet</span>
                  </a>
                )}

                {req.scheduledTime && (
                  <p className="text-[11px] text-slate-500 font-bold text-center md:text-right">
                    🗓️ {req.scheduledTime}
                  </p>
                )}

                <Link
                  to={`/alumni/${req.alumniId}`}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold text-center transition-colors"
                >
                  View Alumni Profile
                </Link>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No {activeTab} Mentorship Connections</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Ready to request advice or mock interview practice? Discover verified alumni ready to help you.
          </p>
          <Link
            to="/find-mentor"
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 inline-block transition-colors"
          >
            Find a Mentor Now
          </Link>
        </div>
      )}
    </div>
  );
};
