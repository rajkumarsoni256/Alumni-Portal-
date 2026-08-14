import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Video, 
  Send, 
  GraduationCap 
} from 'lucide-react';

export const MentorshipRequestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { alumniList, submitMentorshipRequest } = useApp();

  const alumni = alumniList.find((a) => a.id === id || a.userId === id) || alumniList[0];

  const [selectedTopics, setSelectedTopics] = useState(['Resume Review', 'Mock Interview']);
  const [reason, setReason] = useState('Preparing for software engineering campus placements. Seeking guidance on system design and portfolio project presentation.');
  const [goals, setGoals] = useState('Targeting SDE internship roles at top product firms in 2026.');
  const [preferredSlot, setPreferredSlot] = useState('Upcoming Saturday 3:00 PM - 3:45 PM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const availableTopics = [
    'System Design',
    'Resume Review',
    'Mock Interview',
    'DSA & Coding Roadmap',
    'Campus Placement Strategy',
    'AI & ML Research Advice',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitMentorshipRequest({
        mentorId: alumni.id || alumni.userId,
        topic: selectedTopics.join(', '),
        message: `${reason}\nImmediate Goal: ${goals}\nPreferred Slot: ${preferredSlot}`,
      });
      setIsSubmitted(true);
    } catch (err) {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/75 py-5">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 space-y-4">
        
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to profile</span>
        </button>

        {!isSubmitted ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            
            {/* Left: Mentor Summary (4 Cols) */}
            <div className="md:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Requesting Mentorship From</span>

              <div className="flex items-start gap-3">
                <img
                  src={alumni.avatar || alumni.avatarUrl}
                  alt={alumni.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0 space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{alumni.name || alumni.fullName}</h3>
                  <p className="text-[11px] text-slate-600 font-medium truncate">{alumni.currentRole || alumni.designation}</p>
                  <p className="text-[11px] text-slate-500 font-bold">{alumni.company}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>JECRC Class of {alumni.graduationYear || 'Alumnus'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-slate-400" />
                  <span>45 Min Video Call (Google Meet)</span>
                </div>
              </div>
            </div>

            {/* Right: Booking Form (8 Cols) */}
            <div className="md:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-slate-900">Session Details & Goals</h2>
                <p className="text-xs text-slate-500">
                  Provide context so your mentor can prepare tailored guidance for your session.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* 1. Topics */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Select Mentorship Topics
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTopics.map((topic) => {
                      const isSelected = selectedTopics.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => toggleTopic(topic)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Specific Questions / Message */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    What would you like to discuss?
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly describe what you need help with..."
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-300 rounded-md p-2.5 text-xs text-slate-900 focus:outline-none"
                    required
                  />
                </div>

                {/* 3. Goals */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Your Immediate Career Target
                  </label>
                  <input
                    type="text"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="e.g. SDE-1 role at top product company"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    required
                  />
                </div>

                {/* 4. Preferred Time */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Preferred Time Slot
                  </label>
                  <select
                    value={preferredSlot}
                    onChange={(e) => setPreferredSlot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="Upcoming Saturday 3:00 PM - 3:45 PM">Upcoming Saturday 3:00 PM - 3:45 PM</option>
                    <option value="Upcoming Sunday 11:00 AM - 11:45 AM">Upcoming Sunday 11:00 AM - 11:45 AM</option>
                    <option value="Upcoming Sunday 5:00 PM - 5:45 PM">Upcoming Sunday 5:00 PM - 5:45 PM</option>
                    <option value="Next Weekday Evening 7:00 PM">Next Weekday Evening 7:00 PM</option>
                  </select>
                </div>

                {/* Submit button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-3.5 py-2 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Sending...' : 'Submit Request'}</span>
                  </button>
                </div>
              </form>
            </div>

          </div>
        ) : (
          /* Confirmation State */
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-2xs text-center space-y-3 max-w-md mx-auto">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Mentorship Request Sent</h3>
              <p className="text-xs text-slate-500">
                Your request has been delivered to <strong>{alumni.name || alumni.fullName}</strong>. You will be notified once they confirm the slot.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-center gap-2">
              <Link
                to="/my-connections"
                className="px-4 py-2 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors"
              >
                Track in My Connections
              </Link>
              <Link
                to="/explore"
                className="px-3 py-2 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Browse Alumni
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
