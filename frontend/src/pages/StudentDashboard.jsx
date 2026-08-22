import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserConnectionsModal } from '../components/network/UserConnectionsModal';
import { UserAvatar } from '../components/common/UserAvatar';
import { ConnectionButton } from '../components/common/ConnectionButton';
import { 
  GraduationCap, 
  MapPin, 
  ExternalLink, 
  Video, 
  Plus, 
  Edit3, 
  Share2 
} from 'lucide-react';

export const StudentDashboard = () => {
  const { 
    student, 
    currentUser,
    userProfile,
    alumniList, 
    requests, 
    savedAlumniIds, 
    selectedInterests,
    showNotification,
    myConnections
  } = useApp();

  const [isConnModalOpen, setIsConnModalOpen] = useState(false);
  const [skillsList, setSkillsList] = useState([
    { name: 'Data Structures & Algorithms', endorsements: 28 },
    { name: 'Python & PyTorch', endorsements: 22 },
    { name: 'React.js & Tailwind CSS', endorsements: 19 },
    { name: 'Machine Learning & LLMs', endorsements: 16 },
    { name: 'PostgreSQL & Databases', endorsements: 14 },
    { name: 'Node.js & Express', endorsements: 11 },
  ]);

  const [projects] = useState([
    {
      id: 'proj_1',
      title: 'JECRC Alumni Connect & Mentorship Platform',
      role: 'Full Stack Developer',
      date: 'Jan 2026 – Present',
      description: 'Engineered a professional community portal for JECRC students and alumni featuring real-time community feed, mentorship scheduling, and alumni directory.',
      tech: ['React.js', 'Tailwind CSS', 'Vite', 'Node.js'],
      link: 'https://github.com/tokir07/Alumni-Portal',
    },
    {
      id: 'proj_2',
      title: 'Autonomous Drone Navigation with Deep Reinforcement Learning',
      role: 'AI Researcher',
      date: 'Aug 2025 – Dec 2025',
      description: 'Trained Deep Q-Networks (DQN) and PPO agents for obstacle avoidance in simulated indoor campus environments using PyTorch and AirSim.',
      tech: ['PyTorch', 'Python', 'OpenCV', 'Gymnasium'],
      link: 'https://github.com/tokir07',
    },
    {
      id: 'proj_3',
      title: 'Campus Placement Analytics & Prediction Engine',
      role: 'Lead ML Engineer',
      date: 'Feb 2025 – May 2025',
      description: 'Built predictive modeling pipelines analyzing past JECRC recruitment data to benchmark skill proficiencies and student placement readiness.',
      tech: ['Python', 'Scikit-Learn', 'Pandas', 'FastAPI'],
      link: 'https://github.com/tokir07',
    },
  ]);

  const myRequests = requests.filter((r) => r.studentId === student.id);
  const pendingRequests = myRequests.filter((r) => r.status === 'Pending');
  const upcomingSessions = myRequests.filter((r) => r.status === 'Accepted');

  const recommendedAlumni = alumniList.filter((a) =>
    selectedInterests.some((int) => a.domain === int || a.skills.includes(int))
  ).slice(0, 3);

  const handleEndorseSkill = (idx) => {
    setSkillsList((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, endorsements: s.endorsements + 1 } : s))
    );
    showNotification(`Endorsed skill: ${skillsList[idx].name}`);
  };

  return (
    <div className="min-h-screen bg-slate-100/75 py-5">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        
        {/* 2-Column LinkedIn Profile Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Main Profile Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* 1. Profile Hero Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* Cover Banner */}
              <div className="h-32 bg-slate-800 relative" />

              {/* Profile Details */}
              <div className="px-5 pb-5 pt-0 relative">
                <div className="-mt-14 mb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  {/* Avatar */}
                  <div className="relative inline-block">
                    <img
                      src={currentUser.avatar || student.avatar}
                      alt={currentUser.name || student.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white bg-white shadow-xs"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showNotification('Profile editing modal opened', 'info')}
                      className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit profile</span>
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        showNotification('Profile link copied to clipboard', 'info');
                      }}
                      className="p-1.5 rounded-md text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Share profile"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Identity & Headline */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <h1 className="text-xl font-bold text-slate-900">
                      {currentUser.name || student.name}
                    </h1>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                      Open to Work
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium max-w-xl leading-relaxed">
                    {student.headline || 'B.Tech CSE (AI-ML) | 3rd Year • Seeking SDE / AI Internships'}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-1">
                    <span>Department of Computer Science & Engineering</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">JECRC University, Jaipur</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3 h-3" />
                      <span>Jaipur, Rajasthan, India</span>
                    </span>
                    <span>•</span>
                    <a 
                      href="#contact" 
                      onClick={(e) => {
                        e.preventDefault();
                        showNotification(`Email: ${student.email || 'tokir.22bcon123@jecrcu.edu.in'}`);
                      }}
                      className="text-red-700 font-semibold hover:underline"
                    >
                      Contact info
                    </a>
                  </div>

                  {/* Network stats */}
                  <div className="pt-2 flex items-center gap-3 text-xs">
                    {(() => {
                      const countVal = Math.max(
                        userProfile?.connectionsCount || 0,
                        userProfile?.connectionCount || 0,
                        myConnections ? myConnections.length : 0
                      );
                      return (
                        <button
                          type="button"
                          onClick={() => setIsConnModalOpen(true)}
                          className="font-semibold text-slate-900 hover:text-red-700 hover:underline cursor-pointer transition-colors"
                        >
                          {countVal >= 500 ? '500+' : countVal} {' '}
                          <span className="text-slate-500 font-normal font-sans">
                            {countVal === 1 ? 'connection' : 'connections'}
                          </span>
                        </button>
                      );
                    })()}
                    <span>•</span>
                    <span className="font-semibold text-slate-900">
                      {userProfile?.graduationYear ? `Class of ${userProfile.graduationYear}` : 'Class of 2026'}
                    </span>
                  </div>
                </div>

                {/* Open to Work Callout Box */}
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Open to work</span>
                    <span className="text-[11px] text-slate-400">Internship & Full-time</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Software Development Engineer Intern, AI/ML Engineer Intern, Full Stack Developer roles.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. About Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-2.5">
              <h2 className="text-sm font-bold text-slate-900">About</h2>
              <p className="text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                {student.bio || `Passionate 3rd-year Computer Science & Engineering student at JECRC University specializing in Artificial Intelligence and Machine Learning. 

Strong foundation in Data Structures, Algorithms, Distributed Systems, and Modern Full-Stack Web Development. Proven experience building end-to-end full-stack applications with React, Node.js, and training deep learning models using PyTorch.

Actively preparing for upcoming 2026 software engineering internships and tech product roles. Eager to connect with JECRC alumni for technical mentorship, code reviews, and industry career guidance.`}
              </p>
            </div>

            {/* 3. Projects & Academic Work Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Featured Projects</h2>
                <button
                  onClick={() => showNotification('Add Project modal', 'info')}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                  title="Add project"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 divide-y divide-slate-100">
                {projects.map((proj) => (
                  <div key={proj.id} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{proj.title}</h3>
                        <p className="text-[11px] text-slate-500">{proj.role} • {proj.date}</p>
                      </div>
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="View project code"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-normal">
                      {proj.description}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {proj.tech.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Education Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Education</h2>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                  <GraduationCap className="w-5 h-5 text-red-700" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <h3 className="text-xs font-bold text-slate-900">JECRC University, Jaipur</h3>
                  <p className="text-xs text-slate-700 font-medium">
                    Bachelor of Technology - BTech, Computer Science and Engineering (AI-ML)
                  </p>
                  <p className="text-[11px] text-slate-500">2022 – 2026</p>
                  <p className="text-xs text-slate-600 pt-1 font-medium">
                    Grade: <span className="font-bold text-slate-900">8.8 CGPA</span> • Department Rank: Top 5%
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Skills & Endorsements Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Skills & Endorsements</h2>
                <span className="text-[11px] text-slate-400">Click to endorse</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {skillsList.map((skill, idx) => (
                  <button
                    key={skill.name}
                    onClick={() => handleEndorseSkill(idx)}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-between text-left group cursor-pointer"
                  >
                    <span className="text-xs font-medium text-slate-800 group-hover:text-slate-900">
                      {skill.name}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                      {skill.endorsements}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Sidebar Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* 1. Analytics Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900">Profile Analytics</h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Profile views</span>
                  <span className="text-lg font-bold text-slate-900">184</span>
                  <span className="text-[10px] text-emerald-600 font-medium block">↑ 14% this week</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Post impressions</span>
                  <span className="text-lg font-bold text-slate-900">1,420</span>
                  <span className="text-[10px] text-emerald-600 font-medium block">↑ 28% this week</span>
                </div>
              </div>
            </div>

            {/* 2. Mentorship Sessions Status Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Mentorship Sessions</h3>
                <Link
                  to="/my-connections"
                  className="text-[11px] font-semibold text-red-700 hover:underline"
                >
                  Manage
                </Link>
              </div>

              {upcomingSessions.length > 0 ? (
                <div className="space-y-2">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                          Confirmed
                        </span>
                        <span className="text-slate-500 font-medium">{session.scheduledTime}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{session.topic}</h4>
                      <p className="text-[11px] text-slate-600">With {session.alumniName}</p>
                      
                      {session.meetingLink && (
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-1 rounded text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors inline-flex items-center justify-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Meeting</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center space-y-1">
                  <p className="text-xs font-medium text-slate-700">No active sessions scheduled</p>
                  <p className="text-[11px] text-slate-400">Book 1-on-1 guidance with verified alumni mentors.</p>
                  <Link
                    to="/find-mentor"
                    className="inline-block mt-1 text-xs font-semibold text-red-700 hover:underline"
                  >
                    Find a mentor →
                  </Link>
                </div>
              )}

              {pendingRequests.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Pending Requests:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {pendingRequests.length} awaiting response
                  </span>
                </div>
              )}
            </div>

            {/* 3. Recommended Alumni Mentors */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Recommended JU Mentors</h3>
                <Link
                  to="/explore"
                  className="text-[11px] font-semibold text-red-700 hover:underline"
                >
                  All
                </Link>
              </div>

              <div className="space-y-3 divide-y divide-slate-100">
                {recommendedAlumni.map((alum) => (
                  <div key={alum.id} className="pt-3 first:pt-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <UserAvatar
                        src={alum.avatar || alum.avatarUrl}
                        name={alum.name}
                        className="w-9 h-9 shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <Link
                          to={`/alumni/${alum.id}`}
                          className="text-xs font-bold text-slate-900 hover:text-red-700 hover:underline block truncate"
                        >
                          {alum.name}
                        </Link>
                        <p className="text-[11px] text-slate-500 truncate">
                          {alum.currentRole} @ {alum.company}
                        </p>
                        <span className="text-[10px] text-slate-400 block">
                          JECRC Class of {alum.graduationYear}
                        </span>
                      </div>
                    </div>

                    <ConnectionButton userId={alum.id} targetUser={alum} size="sm" />
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* User Connections Modal */}
      <UserConnectionsModal
        isOpen={isConnModalOpen}
        onClose={() => setIsConnModalOpen(false)}
        userId={currentUser?.id || userProfile?.userId}
        userName={currentUser?.name || userProfile?.fullName}
        totalCount={userProfile?.connectionsCount || myConnections?.length || 0}
      />
    </div>
  );
};
