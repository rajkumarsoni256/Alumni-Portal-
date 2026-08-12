import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  GraduationCap, 
  MapPin, 
  Briefcase, 
  Star, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  BookOpen, 
  Calendar, 
  MessageSquare,
  ArrowLeft,
  ShieldCheck,
  Bookmark
} from 'lucide-react';

export const AlumniProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { alumniList, savedAlumniIds, toggleSaveAlumni } = useApp();

  const alumni = alumniList.find((a) => a.id === id) || alumniList[0];
  const isSaved = savedAlumniIds.includes(alumni.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:border-indigo-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Alumni</span>
      </button>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
        {/* Cover Header */}
        <div className={`h-40 sm:h-56 bg-gradient-to-r ${alumni.coverBg || 'from-indigo-600 via-purple-700 to-slate-900'} p-6 relative flex justify-between items-start`}>
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-extrabold text-indigo-900 border border-indigo-100 shadow-md">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>{alumni.matchPercentage || 98}% Match Score</span>
          </div>

          <button
            onClick={() => toggleSaveAlumni(alumni.id)}
            className={`p-2.5 rounded-full transition-all ${
              isSaved ? 'bg-white text-indigo-600 shadow-md' : 'bg-black/30 text-white hover:bg-white/40'
            }`}
            title={isSaved ? 'Remove Bookmark' : 'Save Alumni'}
          >
            <Bookmark className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Profile Info Container */}
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="-mt-16 sm:-mt-20 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            
            {/* Avatar & Badges */}
            <div className="flex items-end gap-4">
              <div className="relative">
                <img
                  src={alumni.avatar}
                  alt={alumni.name}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-white shadow-xl bg-slate-100"
                />
                <span
                  className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white ${
                    alumni.isAvailableForMentorship ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                  title={alumni.isAvailableForMentorship ? 'Available for Mentorship' : 'Currently Busy'}
                />
              </div>

              <div className="space-y-1 pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{alumni.name}</h1>
                  <ShieldCheck className="w-6 h-6 text-indigo-600" title="Verified Alumni" />
                </div>
                <p className="text-base font-bold text-indigo-600 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  <span>{alumni.currentRole}</span>
                  <span className="text-slate-400 font-normal">at</span>
                  <span className="text-slate-900 font-extrabold">{alumni.company}</span>
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{alumni.degree} ({alumni.graduationYear})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{alumni.location}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Link
                to={`/request-mentorship/${alumni.id}`}
                className="px-6 py-3.5 rounded-2xl text-sm font-bold text-white gradient-accent-bg shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Request Mentorship</span>
              </Link>
            </div>

          </div>

          {/* Rating Summary Bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="font-extrabold text-slate-900 text-sm">{alumni.rating}</span>
              <span className="text-slate-500">({alumni.reviewsCount} Mentorship Feedback Reviews)</span>
            </div>

            <div className="flex items-center gap-4 text-slate-600 font-medium">
              <span>Domain: <strong className="text-slate-900">{alumni.domain}</strong></span>
              <span>•</span>
              <span>Experience: <strong className="text-slate-900">{alumni.experienceYears} Years</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): About, Match breakdown, Career Journey, Education */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Match Score Reason Highlight Box */}
          {alumni.matchReasons && alumni.matchReasons.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-indigo-700/60 space-y-3">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>Why {alumni.name.split(' ')[0]} is a Great Match for You</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-200">
                {alumni.matchReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* About Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xl font-bold text-slate-900">About {alumni.name}</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{alumni.about}</p>

            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Technical Skills & Expertise</h4>
              <div className="flex flex-wrap gap-2">
                {alumni.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-indigo-50 text-indigo-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Career Journey Timeline */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <span>Career Journey</span>
            </h3>

            <div className="relative pl-6 border-l-2 border-indigo-100 space-y-6">
              {alumni.careerJourney.map((item, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 text-sm">{item.role}</span>
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-medium">{item.year}</span>
                  </div>
                  <p className="text-xs font-semibold text-indigo-600">{item.company}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Education & Achievements */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Education & Achievements</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Education</h4>
                {alumni.education.map((edu, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                    <p className="font-bold text-slate-900">{edu.degree}</p>
                    <p className="text-slate-600">{edu.institution} ({edu.year})</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Achievements</h4>
                {alumni.achievements.map((ach, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{ach}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (4 cols): Areas of Help & Request CTA */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Areas Where Alumni Can Help */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Areas Where {alumni.name.split(' ')[0]} Can Help
            </h3>

            <div className="space-y-2">
              {[
                "Career Guidance",
                "Resume Review",
                "Mock Interview",
                "Project Guidance",
                "Placement Guidance",
                "Guest Sessions"
              ].map((area, idx) => {
                const offersArea = alumni.areasOfHelp.includes(area);
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                      offersArea
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-slate-50 text-slate-400 opacity-60'
                    }`}
                  >
                    <span>{area}</span>
                    {offersArea ? (
                      <span className="text-[10px] font-bold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded">
                        Available
                      </span>
                    ) : (
                      <span className="text-[10px]">N/A</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <Link
                to={`/request-mentorship/${alumni.id}`}
                className="w-full py-3.5 rounded-xl font-bold text-white gradient-accent-bg shadow-md text-center block text-sm hover:opacity-95 transition-opacity"
              >
                Request Mentorship Session
              </Link>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                100% Free for Apex University Students
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
