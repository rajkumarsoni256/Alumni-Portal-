import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AlumniCard } from '../components/common/AlumniCard';
import { Sparkles, Calendar, ShieldCheck, Video, Clock } from 'lucide-react';

export const FindMentor = () => {
  const { alumniList, selectedInterests } = useApp();
  const [selectedTopic, setSelectedTopic] = useState('All');

  const topics = [
    'All',
    'DSA & Coding',
    'System Design',
    'AI & Machine Learning',
    'Placement Preparation',
    'Resume Review',
    'Cloud Architecture',
  ];

  const mentors = useMemo(() => {
    return alumniList.filter((a) => {
      if (!a.isAvailableForMentorship) return false;
      if (selectedTopic === 'All') return true;

      const topicLower = selectedTopic.toLowerCase();
      return (
        a.skills.some((s) => s.toLowerCase().includes(topicLower)) ||
        a.domain.toLowerCase().includes(topicLower) ||
        (a.matchReasons && a.matchReasons.some((r) => r.toLowerCase().includes(topicLower)))
      );
    });
  }, [alumniList, selectedTopic]);

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
              Available Mentors ({mentors.length})
            </span>
          </div>

          {mentors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mentors.map((mentor) => (
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
