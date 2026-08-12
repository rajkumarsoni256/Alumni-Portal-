import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Send, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Video, 
  MapPin,
  HelpCircle,
  Target,
  UserCheck
} from 'lucide-react';

export const MentorshipRequestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { alumniList, submitMentorshipRequest } = useApp();

  const alumni = alumniList.find((a) => a.id === id) || alumniList[0];

  const [selectedTopics, setSelectedTopics] = useState(['Resume Review', 'Mock Interview']);
  const [reason, setReason] = useState('Preparing for top-tier tech campus placements. Want guidance on system design and portfolio project presentation.');
  const [goals, setGoals] = useState('Aiming for a Software Engineer role at Google, Microsoft, or Stripe in 2026.');
  const [meetingType, setMeetingType] = useState('Online (Google Meet)');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const availableTopics = [
    'Career Guidance',
    'Resume Review',
    'Mock Interview',
    'Project Guidance',
    'Placement Guidance',
    'Guest Sessions',
  ];

  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      if (selectedTopics.length > 1) {
        setSelectedTopics(selectedTopics.filter((t) => t !== topic));
      }
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMentorshipRequest({
      alumniId: alumni.id,
      alumniName: alumni.name,
      alumniRole: `${alumni.currentRole} @ ${alumni.company}`,
      alumniAvatar: alumni.avatar,
      category: selectedTopics.join(' & '),
      helpTopics: selectedTopics,
      reason,
      goals,
      meetingType,
    });
    setIsSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:border-indigo-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Profile</span>
      </button>

      {/* Main Request Form Container */}
      {!isSubmitted ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          
          {/* Header Bar */}
          <div className="gradient-bg text-white p-6 sm:p-8 space-y-3 relative">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mentorship Request</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Request Mentorship from {alumni.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              {alumni.currentRole} at <strong className="text-white font-bold">{alumni.company}</strong> • Class of {alumni.graduationYear}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
            
            {/* 1. What do you need help with? */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>What do you need help with?</span>
              </label>
              <p className="text-xs text-slate-500">Select one or more topics for this mentorship session:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableTopics.map((topic, idx) => {
                  const isChecked = selectedTopics.includes(topic);
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => toggleTopic(topic)}
                      className={`p-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                        isChecked
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <span>{topic}</span>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Why do you want this mentor? */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Why do you want this mentor?</span>
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why Priya's background matches your learning goals..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* 3. What are your goals? */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>What are your specific goals for this session?</span>
              </label>
              <textarea
                required
                rows={3}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="e.g., Get actionable feedback on my ML resume and 3 System Design tips..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* 4. Preferred Meeting Type */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Preferred Meeting Type</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMeetingType('Online (Google Meet)')}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    meetingType.includes('Online')
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Video className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold">Online (Google Meet)</p>
                    <p className="text-[11px] text-slate-500 font-normal">30-min virtual video call</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMeetingType('Offline (On-Campus Coffee)')}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    meetingType.includes('Offline')
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <MapPin className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold">Offline (Campus / Office Coffee)</p>
                    <p className="text-[11px] text-slate-500 font-normal">In-person session when alumnus is visiting campus</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 text-center">
              <button
                type="submit"
                className="w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-white gradient-accent-bg shadow-xl shadow-indigo-500/25 hover:scale-[1.02] transition-all inline-flex items-center justify-center gap-2 text-sm"
              >
                <Send className="w-4 h-4" />
                <span>Send Request to {alumni.name.split(' ')[0]}</span>
              </button>
            </div>

          </form>

        </div>
      ) : (
        /* Confirmation State */
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-extrabold text-slate-900">Mentorship Request Sent!</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Your request has been submitted to <strong className="text-slate-900">{alumni.name}</strong>. They typically respond within 24–48 hours.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/my-connections"
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md hover:bg-indigo-700 transition-colors"
            >
              Track in My Connections
            </Link>
            <Link
              to="/student-dashboard"
              className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
