import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  GraduationCap, 
  MapPin, 
  Briefcase, 
  Star, 
  CheckCircle2, 
  Award, 
  BookOpen, 
  Calendar, 
  MessageSquare,
  ArrowLeft,
  ShieldCheck,
  Bookmark,
  Share2,
  Clock,
  Video,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const AlumniProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { alumniList, savedAlumniIds, toggleSaveAlumni, showNotification } = useApp();

  const alumni = alumniList.find((a) => a.id === id) || alumniList[0];
  const isSaved = savedAlumniIds.includes(alumni.id);

  const [experienceList] = useState([
    {
      role: alumni.currentRole,
      company: alumni.company,
      period: '2021 – Present · 5 yrs',
      location: alumni.location,
      description: 'Leading technical initiatives in core systems, architecture scalability, and mentoring engineering team members.',
    },
    {
      role: 'Software Engineer II',
      company: alumni.company === 'Google' ? 'Microsoft' : 'Amazon',
      period: '2018 – 2021 · 3 yrs',
      location: 'Hyderabad / Bengaluru',
      description: 'Engineered high-throughput microservices and distributed database pipelines.',
    },
  ]);

  const relatedAlumni = alumniList
    .filter((a) => a.id !== alumni.id && (a.domain === alumni.domain || a.company === alumni.company))
    .slice(0, 3);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showNotification('Profile link copied to clipboard', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-100/75 py-5">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 space-y-4">
        
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to directory</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSaveAlumni(alumni.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                isSaved 
                  ? 'bg-red-50 text-red-700 border-red-200' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Share profile"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Main Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* 1. Hero Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* Cover Banner */}
              <div className="h-32 bg-slate-800 relative" />

              {/* Profile Details */}
              <div className="px-5 pb-5 pt-0 relative">
                <div className="-mt-14 mb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  {/* Avatar */}
                  <div className="relative inline-block">
                    <img
                      src={alumni.avatar}
                      alt={alumni.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white bg-white shadow-xs"
                    />
                    <span
                      className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                        alumni.isAvailableForMentorship ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                      title={alumni.isAvailableForMentorship ? 'Available for Mentorship' : 'Currently Busy'}
                    />
                  </div>

                  {/* Primary Actions */}
                  <div className="flex items-center gap-2">
                    {alumni.isAvailableForMentorship ? (
                      <Link
                        to={`/request-mentorship/${alumni.id}`}
                        className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book 1-on-1 Session</span>
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-1.5 rounded-md text-xs font-semibold text-slate-400 bg-slate-100 cursor-not-allowed"
                      >
                        Currently Unavailable
                      </button>
                    )}

                    <Link
                      to="/my-connections"
                      className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </Link>
                  </div>
                </div>

                {/* Identity & Current Role */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900">{alumni.name}</h1>
                    <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.2 rounded-full">
                      Verified JU Alum
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-semibold max-w-xl">
                    {alumni.currentRole} at <span className="text-slate-900 font-bold">{alumni.company}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{alumni.degree} • Class of {alumni.graduationYear}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{alumni.location}</span>
                    </span>
                  </div>

                  {/* Rating & Stats */}
                  <div className="pt-2 flex items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span className="font-bold text-slate-900">{alumni.rating}</span>
                      <span className="text-slate-400">({alumni.reviewsCount} reviews)</span>
                    </div>
                    <span>•</span>
                    <span className="font-medium">
                      <strong className="text-slate-900">{alumni.menteesHelped || 14}</strong> students guided
                    </span>
                    <span>•</span>
                    <span className="font-medium">
                      <strong className="text-slate-900">{alumni.connectionsCount || '500+'}</strong> connections
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. About / Bio Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-2.5">
              <h2 className="text-sm font-bold text-slate-900">About</h2>
              <p className="text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                {alumni.bio}
              </p>
            </div>

            {/* 3. Mentorship & Areas of Guidance */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
              <h2 className="text-sm font-bold text-slate-900">Mentorship & Areas of Guidance</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {alumni.skills.map((skill, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{skill}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      1-on-1 guidance, mock interviews, and industry project feedback.
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Session Length: <strong>45 mins</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-3.5 h-3.5 text-slate-400" />
                  <span>Platform: <strong>Google Meet</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Free for JECRC Students</span>
                </div>
              </div>
            </div>

            {/* 4. Experience Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Experience</h2>

              <div className="space-y-4 divide-y divide-slate-100">
                {experienceList.map((exp, idx) => (
                  <div key={idx} className="pt-3 first:pt-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{exp.role}</h3>
                        <p className="text-xs text-slate-700 font-medium">{exp.company} • {exp.period}</p>
                        <p className="text-[11px] text-slate-400">{exp.location}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pt-0.5 font-normal">
                      {exp.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Education */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Education</h2>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                  <GraduationCap className="w-5 h-5 text-red-700" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <h3 className="text-xs font-bold text-slate-900">JECRC University, Jaipur</h3>
                  <p className="text-xs text-slate-700 font-medium">{alumni.degree}</p>
                  <p className="text-[11px] text-slate-500">Graduation Year: Class of {alumni.graduationYear}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* 1. Quick Booking Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900">Mentorship Booking</h3>
              
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Availability</span>
                  <span className={`font-semibold ${alumni.isAvailableForMentorship ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {alumni.isAvailableForMentorship ? '● Accepting Mentees' : '○ Busy'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Typical response</span>
                  <span className="font-semibold text-slate-900">Within 24 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Session format</span>
                  <span className="font-semibold text-slate-900">1-on-1 Video Call</span>
                </div>
              </div>

              {alumni.isAvailableForMentorship && (
                <Link
                  to={`/request-mentorship/${alumni.id}`}
                  className="w-full py-2 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Request Mentorship Session</span>
                </Link>
              )}
            </div>

            {/* 2. Similar Alumni Mentors */}
            {relatedAlumni.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900">More Alumni in {alumni.domain}</h3>
                  <Link
                    to="/explore"
                    className="text-[11px] font-semibold text-red-700 hover:underline"
                  >
                    View all
                  </Link>
                </div>

                <div className="space-y-3 divide-y divide-slate-100">
                  {relatedAlumni.map((rel) => (
                    <div key={rel.id} className="pt-3 first:pt-0 flex items-start gap-2.5">
                      <img
                        src={rel.avatar}
                        alt={rel.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <Link
                          to={`/alumni/${rel.id}`}
                          className="text-xs font-bold text-slate-900 hover:text-red-700 hover:underline block truncate"
                        >
                          {rel.name}
                        </Link>
                        <p className="text-[11px] text-slate-500 truncate">
                          {rel.currentRole} @ {rel.company}
                        </p>
                        <span className="text-[10px] text-slate-400 block">
                          Class of {rel.graduationYear}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
