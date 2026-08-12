import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AlumniCard } from '../components/common/AlumniCard';
import { CAREER_DOMAINS, INDUSTRIES } from '../data/mockData';
import { Sparkles, Check, ArrowRight, Target, Sliders, Award, Zap } from 'lucide-react';

export const FindMentor = () => {
  const navigate = useNavigate();
  const {
    alumniList,
    selectedInterests,
    setSelectedInterests,
    careerGoal,
    setCareerGoal,
    experienceLevel,
    setExperienceLevel,
    preferredIndustry,
    setPreferredIndustry,
    showNotification,
  } = useApp();

  const [hasSearched, setHasSearched] = useState(true);

  const toggleInterest = (domain) => {
    if (selectedInterests.includes(domain)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter((d) => d !== domain));
      } else {
        showNotification('Please keep at least 1 career interest selected.', 'info');
      }
    } else {
      setSelectedInterests([...selectedInterests, domain]);
    }
  };

  const handleFindMentors = (e) => {
    e.preventDefault();
    setHasSearched(true);
    showNotification(`Found top JU alumni matches for ${selectedInterests.slice(0, 2).join(' & ')}!`);
  };

  // Compute matched mentors dynamically
  const matchedMentors = alumniList
    .map((alumni) => {
      let score = 70;
      if (selectedInterests.includes(alumni.domain)) score += 20;
      if (alumni.skills.some((s) => selectedInterests.includes(s))) score += 5;
      if (alumni.industry === preferredIndustry) score += 4;
      return {
        ...alumni,
        calculatedMatch: Math.min(score, 99),
      };
    })
    .sort((a, b) => b.calculatedMatch - a.calculatedMatch);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-1.5 rounded-full text-xs font-black border border-red-200">
          <Zap className="w-4 h-4 text-red-600 animate-pulse" />
          <span>JECRC Smart Alumni Matching Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
          Find the right JU mentor for your journey.
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Select your target career interests, goals, and industry preferences. We will connect you with experienced JECRC graduates ready to guide you.
        </p>
      </div>

      {/* Main Interactive Matching Form */}
      <form onSubmit={handleFindMentors} className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-lg space-y-8">
        
        {/* Step 1: Select Career Interests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center">
                1
              </span>
              <span>Selectable Career Interests</span>
            </h3>
            <span className="text-xs text-red-600 font-extrabold">
              {selectedInterests.length} selected
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CAREER_DOMAINS.map((domain, idx) => {
              const isSelected = selectedInterests.includes(domain);
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => toggleInterest(domain)}
                  className={`p-3.5 rounded-2xl text-left border text-xs font-extrabold transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-500/20 scale-[1.02]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-red-300 hover:bg-white'
                  }`}
                >
                  <span>{domain}</span>
                  {isSelected ? (
                    <Check className="w-4 h-4 text-white shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Goal, Experience & Industry */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
          
          {/* Career Goal */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-red-600" />
              <span>Career Goal</span>
            </label>
            <input
              type="text"
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              placeholder="e.g. Software Engineer / AI Researcher"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-red-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-red-600" />
              <span>Target Mentor Experience Level</span>
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <option value="0-2 years (Entry / Campus)">1-3 Years (Recent JECRC Graduates)</option>
              <option value="4-7 years (Mid-Senior)">4-7 Years (Senior / Staff Engineers)</option>
              <option value="8+ years (Leadership)">8+ Years (Directors / PMs)</option>
            </select>
          </div>

          {/* Preferred Industry */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-red-600" />
              <span>Preferred Industry</span>
            </label>
            <select
              value={preferredIndustry}
              onChange={(e) => setPreferredIndustry(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              {INDUSTRIES.map((ind, idx) => (
                <option key={idx} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Submit CTA */}
        <div className="pt-2 text-center">
          <button
            type="submit"
            className="w-full sm:w-auto px-10 py-4 rounded-xl text-base font-extrabold text-white gradient-accent-red shadow-xl shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>Find My Mentors</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </form>

      {/* RECOMMENDED MENTORS RESULTS */}
      {hasSearched && (
        <div className="space-y-8 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-red-600" />
                <span>Top Recommended JECRC Alumni Mentors</span>
              </h2>
              <p className="text-sm text-slate-500 font-semibold">
                Sorted by AI match score for <strong className="text-slate-900">{selectedInterests.join(', ')}</strong>
              </p>
            </div>
            <span className="text-xs font-black text-red-700 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
              {matchedMentors.length} Verified JU Alumni Matched
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {matchedMentors.map((alumni) => (
              <AlumniCard
                key={alumni.id}
                alumni={{
                  ...alumni,
                  matchPercentage: alumni.calculatedMatch,
                }}
                showMatchReasons={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
