import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Check, 
  X, 
  Video, 
  ExternalLink, 
  Star 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AlumniDashboard = () => {
  const { requests, updateRequestStatus, alumniList, showNotification } = useApp();

  const currentAlumni = alumniList.find((a) => a.id === 'alm_1') || alumniList[0];

  const alumniRequests = requests.filter((r) => r.alumniId === currentAlumni.id);
  const pendingRequests = alumniRequests.filter((r) => r.status === 'Pending');
  const upcomingSessions = alumniRequests.filter((r) => r.status === 'Accepted');

  const handleAccept = (reqId) => {
    updateRequestStatus(reqId, 'Accepted', 'Upcoming Saturday 3:00 PM');
    showNotification('Mentorship request accepted and meeting scheduled');
  };

  const handleDecline = (reqId) => {
    updateRequestStatus(reqId, 'Declined');
    showNotification('Mentorship request declined', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-100/75 py-5">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 space-y-4">
        
        {/* Header Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">Alumni Mentor Hub</h1>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                Active Mentor
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Managing mentorship sessions and student requests for <strong className="text-slate-800">{currentAlumni.name}</strong> ({currentAlumni.currentRole} @ {currentAlumni.company}).
            </p>
          </div>

          <Link
            to={`/alumni/${currentAlumni.id}`}
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>View Public Profile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Stat Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">New Requests</span>
            <p className="text-xl font-bold text-slate-900">{pendingRequests.length}</p>
            <span className="text-[11px] text-amber-600 font-medium block">Awaiting response</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Students Guided</span>
            <p className="text-xl font-bold text-slate-900">14</p>
            <span className="text-[11px] text-emerald-600 font-medium block">Campus mentees</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Upcoming Sessions</span>
            <p className="text-xl font-bold text-slate-900">{upcomingSessions.length}</p>
            <span className="text-[11px] text-slate-600 font-medium block">Scheduled 1-on-1s</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Mentor Rating</span>
            <div className="flex items-center gap-1">
              <p className="text-xl font-bold text-slate-900">4.9</p>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            </div>
            <span className="text-[11px] text-slate-400 font-medium block">32 student reviews</span>
          </div>
        </div>

        {/* Pending Requests Queue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Pending Mentorship Requests ({pendingRequests.length})</h2>
          </div>

          {pendingRequests.length > 0 ? (
            <div className="space-y-3 divide-y divide-slate-100">
              {pendingRequests.map((req) => (
                <div key={req.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{req.studentName}</span>
                      <span className="text-[11px] text-slate-400">({req.studentDegree || 'B.Tech CSE, 3rd Year'})</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700">Topic: {req.topic}</p>
                    <p className="text-xs text-slate-500 max-w-xl">"{req.message}"</p>
                    <span className="text-[10px] text-slate-400 block">Requested: {req.requestedAt}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAccept(req.id)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept & Schedule</span>
                    </button>
                    <button
                      onClick={() => handleDecline(req.id)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
              No new pending requests in your queue.
            </div>
          )}
        </div>

        {/* Scheduled 1-on-1 Sessions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Confirmed Sessions ({upcomingSessions.length})</h2>

          {upcomingSessions.length > 0 ? (
            <div className="space-y-3 divide-y divide-slate-100">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{session.studentName}</span>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        Confirmed
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">{session.topic}</p>
                    <p className="text-[11px] text-slate-500">{session.scheduledTime}</p>
                  </div>

                  {session.meetingLink && (
                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Launch Google Meet</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
              No upcoming scheduled sessions.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
