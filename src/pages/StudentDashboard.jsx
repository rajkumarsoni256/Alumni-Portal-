import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AlumniCard } from '../components/common/AlumniCard';
import { 
  GraduationCap, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Bookmark, 
  Calendar, 
  Sliders,
  Target
} from 'lucide-react';

export const StudentDashboard = () => {
  const { student, alumniList, requests, events, savedAlumniIds, selectedInterests } = useApp();

  const myRequests = requests.filter((r) => r.studentId === student.id);
  const pendingRequests = myRequests.filter((r) => r.status === 'Pending');
  const upcomingSessions = myRequests.filter((r) => r.status === 'Accepted');
  const savedAlumni = alumniList.filter((a) => savedAlumniIds.includes(a.id));

  // Filter recommended alumni
  const recommendedAlumni = alumniList.filter((a) =>
    selectedInterests.some((int) => a.domain === int || a.skills.includes(int))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Greeting Header */}
      <div className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden border border-red-900/40">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-300 border border-red-400/30 px-3 py-1 rounded-full text-xs font-black">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>JECRC Student Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Good morning, {student.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-300 font-semibold">
            {student.degree} • Class of {student.graduationYear} ({student.university})
          </p>
        </div>

        {/* Profile Completion Widget */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 min-w-[260px] space-y-2 relative z-10">
          <div className="flex justify-between items-center text-xs font-black">
            <span className="text-slate-200">Profile Completion</span>
            <span className="text-emerald-400 font-black">{student.completionPercentage}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-emerald-400 rounded-full"
              style={{ width: `${student.completionPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Add resume link to reach 100% completion
          </p>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Recommended Mentors */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-red-300 transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Recommended</span>
            <p className="text-3xl font-black text-slate-900">{recommendedAlumni.length}</p>
            <p className="text-xs text-red-600 font-extrabold">Matched JU Mentors</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-red-50 text-red-600">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-amber-300 transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Pending Requests</span>
            <p className="text-3xl font-black text-slate-900">{pendingRequests.length}</p>
            <p className="text-xs text-amber-600 font-extrabold">Awaiting Acceptance</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-emerald-300 transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Upcoming Sessions</span>
            <p className="text-3xl font-black text-slate-900">{upcomingSessions.length}</p>
            <p className="text-xs text-emerald-600 font-extrabold">Confirmed Sessions</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Saved Alumni */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-rose-300 transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Saved Alumni</span>
            <p className="text-3xl font-black text-slate-900">{savedAlumni.length}</p>
            <p className="text-xs text-rose-600 font-extrabold">Bookmarked Profiles</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600">
            <Bookmark className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* SECTION: Recommended Alumni for You */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-red-600" />
              <span>Recommended Mentors for You</span>
            </h2>
            <p className="text-sm text-slate-500">
              Matched based on your target interests: <strong className="text-red-600">{selectedInterests.join(', ')}</strong>
            </p>
          </div>
          <Link
            to="/find-mentor"
            className="text-sm font-extrabold text-red-600 hover:text-red-800 flex items-center gap-1.5"
          >
            <Sliders className="w-4 h-4" />
            <span>Customize Match Criteria</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recommendedAlumni.slice(0, 3).map((alumni) => (
            <AlumniCard key={alumni.id} alumni={alumni} showMatchReasons={true} />
          ))}
        </div>
      </div>

      {/* SECTION: Continue Your Career Journey */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-red-600" />
              <span>Continue Your Career Journey</span>
            </h3>
            <p className="text-xs text-slate-500">Review your current placement goals & target companies</p>
          </div>
          <Link
            to="/find-mentor"
            className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-extrabold rounded-xl transition-colors"
          >
            Edit Goal Preferences
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Primary Target Goal</span>
            <p className="font-extrabold text-slate-900 text-sm">{student.careerGoal}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Selected Interests</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedInterests.map((interest, idx) => (
                <span key={idx} className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded-md">
                  {interest}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Target Companies</span>
            <div className="flex flex-wrap gap-1.5">
              {student.targetCompanies.map((comp, idx) => (
                <span key={idx} className="bg-slate-200 text-slate-800 text-xs font-bold px-2 py-0.5 rounded-md">
                  {comp}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: Upcoming Events Preview */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-red-600" />
            <span>Upcoming Campus & Virtual Events</span>
          </h2>
          <Link to="/events" className="text-sm font-extrabold text-red-600 hover:text-red-800">
            View All Events
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.slice(0, 2).map((evt) => (
            <div key={evt.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="bg-red-50 text-red-700 font-extrabold px-2.5 py-1 rounded-md">
                    {evt.category}
                  </span>
                  <span className="text-slate-500 font-semibold">{evt.date}</span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-base">{evt.title}</h4>
                <p className="text-xs text-slate-600">{evt.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs">
                  <span className="font-extrabold text-slate-900 block">{evt.speaker}</span>
                  <span className="text-slate-500 font-medium">{evt.location}</span>
                </div>
                <Link
                  to="/events"
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    evt.isRegistered
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'gradient-accent-red text-white shadow-xs'
                  }`}
                >
                  {evt.isRegistered ? 'Registered ✓' : 'Register Now'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
