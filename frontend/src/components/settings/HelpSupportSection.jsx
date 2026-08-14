import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HelpCircle, MessageSquare, Shield, FileText, ExternalLink, Send, CheckCircle2, Loader2 } from 'lucide-react';

export const HelpSupportSection = () => {
  const { showNotification, currentUser } = useApp();
  const [problemTopic, setProblemTopic] = useState('bug');
  const [problemMessage, setProblemMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!problemMessage.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setProblemMessage('');
      showNotification('Problem report submitted to Directorate of Alumni Relations', 'success');
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="space-y-1 pb-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">Help & Support</h2>
        <p className="text-xs text-slate-500">Access community guidelines, report technical issues, or contact alumni relations support.</p>
      </div>

      {/* Report a Problem Card */}
      <form onSubmit={handleReportSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <MessageSquare className="w-4 h-4 text-red-700 shrink-0" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Report a Problem or Feedback</h3>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 block">Issue Category</label>
          <select
            value={problemTopic}
            onChange={(e) => setProblemTopic(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:border-slate-800"
          >
            <option value="bug">Technical Bug / Portal Error</option>
            <option value="profile">Account / Profile Verification Issue</option>
            <option value="abuse">Spam / Community Violation</option>
            <option value="feature">Feature Request / Feedback</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 block">Description</label>
          <textarea
            rows={3}
            required
            value={problemMessage}
            onChange={(e) => setProblemMessage(e.target.value)}
            placeholder="Provide specific details about what happened or steps to reproduce..."
            className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 rounded-lg p-3 text-xs text-slate-900 outline-none resize-none"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSubmitting || !problemMessage.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shadow-2xs"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Submit Report</span>
          </button>
        </div>
      </form>

      {/* Guidelines & Support Resources Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900">
            <Shield className="w-4 h-4 text-red-700 shrink-0" />
            <h4 className="text-xs font-bold">Community Guidelines</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Review JU Connect standards for respectful communication, networking ethics, and mentorship interactions.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900">
            <HelpCircle className="w-4 h-4 text-red-700 shrink-0" />
            <h4 className="text-xs font-bold">Direct Support Contact</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Email: <span className="font-semibold text-slate-800">alumni.relations@jecrc.ac.in</span>
          </p>
          <p className="text-[10px] text-slate-400">JECRC University, Campus Block A, Jaipur</p>
        </div>
      </div>

      {/* Application Version Footer */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
        <span>JU Connect Portal</span>
        <span>Version 1.2.4 (Build 2026.08)</span>
      </div>
    </div>
  );
};
