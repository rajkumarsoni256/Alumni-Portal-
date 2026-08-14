import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AlumniCard } from '../components/common/AlumniCard';
import { userService } from '../services/userService';
import { Sparkles, Calendar, ShieldCheck, Video, Clock, Loader2 } from 'lucide-react';

export const FindMentor = () => {
  const { showNotification } = useApp();
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [mentorsList, setMentorsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const topics = [
    'All',
    'DSA & Coding',
    'System Design',
    'AI & Machine Learning',
    'Placement Preparation',
    'Resume Review',
    'Cloud Architecture',
  ];

  useEffect(() => {
    const fetchAlumniMentors = async () => {
      setIsLoading(true);
      try {
        const res = await userService.getUsers({ role: 'ALUMNI' });
        const realAlumni = (res.users || []).map((u) => ({
          id: u.userId || u.id,
          userId: u.userId || u.id,
          name: u.fullName || (u.email ? u.email.split('@')[0] : 'Alumni User'),
          email: u.email,
          currentRole: u.designation || 'Software Engineer',
          company: u.company || 'Tech Leader',
          graduationYear: u.graduationYear || 2022,
          degree: u.degree || 'B.Tech',
          branch: u.branch || 'CSE',
          location: u.location || 'Jaipur, India',
          avatar: u.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
          skills: u.skills ? u.skills.split(',').map((s) => s.trim()) : ['System Design', 'Resume Review', 'DSA'],
          isAvailableForMentorship: true,
          bio: u.bio || 'Passionate JECRC alumnus guiding students for campus placements and technical interviews.',
        }));
        setMentorsList(realAlumni);
      } catch (err) {
        showNotification('Failed to fetch alumni mentors', 'error');
        setMentorsList([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlumniMentors();
  }, []);

  const filteredMentors = mentorsList.filter((a) => {
    if (!a.isAvailableForMentorship) return false;
    if (selectedTopic === 'All') return true;

    const topicLower = selectedTopic.toLowerCase();
    return (
      a.skills.some((s) => s.toLowerCase().includes(topicLower)) ||
      (a.domain && a.domain.toLowerCase().includes(topicLower)) ||
      (a.company && a.company.toLowerCase().includes(topicLower))
    );
  });

  return (
    <div className="min-h-screen bg-slate-100/75 py-5">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 space-y-4">
        
        {/* Header Title Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">1-on-1 Alumni Mentorship</h1>
                <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.2 rounded-full">
                  Verified JECRC Alumni
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Book free 45-minute video mentorship sessions with experienced graduates for interview prep and career guidance.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg self-start sm:self-auto">
              <span className="flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-slate-400" />
                <span>Google Meet</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>45 Mins</span>
              </span>
            </div>
          </div>

          {/* Topic Pills */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0 mr-1">Topic:</span>
            {topics.map((t) => {
              const active = selectedTopic === t;
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTopic(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mentors Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-600">
              Available Mentors ({filteredMentors.length})
            </span>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs space-y-3">
              <Loader2 className="w-7 h-7 text-red-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Loading verified Alumni mentors from JECRC network...</p>
            </div>
          ) : filteredMentors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMentors.map((mentor) => (
                <AlumniCard key={mentor.id} alumni={mentor} showMatchReasons={true} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
              <h3 className="text-sm font-bold text-slate-900">No mentors available for "{selectedTopic}"</h3>
              <p className="text-xs text-slate-500">
                Please select another mentorship topic or browse all available alumni mentors.
              </p>
              <button
                onClick={() => setSelectedTopic('All')}
                className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer"
              >
                Show All Mentors
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
