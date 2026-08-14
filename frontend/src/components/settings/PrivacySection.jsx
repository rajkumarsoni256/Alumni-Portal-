import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Eye, Lock, Search, Users, Radio, Check } from 'lucide-react';

const VISIBILITY_OPTIONS = [
  { value: 'EVERYONE', label: 'Everyone on JU Connect', desc: 'Visible to all registered members and visitors' },
  { value: 'COMMUNITY', label: 'JECRC Community', desc: 'Visible only to verified JECRC students, alumni, and faculty' },
  { value: 'CONNECTIONS', label: 'My Connections', desc: 'Visible only to accepted network connections' },
  { value: 'ONLY_ME', label: 'Only Me', desc: 'Hidden from public directory view' },
];

export const PrivacySection = () => {
  const { userSettings, updateUserSettings, showNotification, currentUser } = useApp();
  const privacy = userSettings?.privacy || {};

  const [savingKey, setSavingKey] = useState(null);

  const handleToggle = async (key, currentVal) => {
    setSavingKey(key);
    try {
      await updateUserSettings({ [key]: !currentVal });
      showNotification('Privacy preference updated', 'info');
    } catch (err) {
      showNotification(err.message || 'Failed to update privacy setting', 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const handleSelectChange = async (key, val) => {
    setSavingKey(key);
    try {
      await updateUserSettings({ [key]: val });
      showNotification('Visibility preference updated', 'info');
    } catch (err) {
      showNotification(err.message || 'Failed to update visibility setting', 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const isAlumni = (currentUser?.role || '').toUpperCase() === 'ALUMNI';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="space-y-1 pb-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">Privacy & Visibility</h2>
        <p className="text-xs text-slate-500">Control who can discover your profile, contact details, connections list, and online status.</p>
      </div>

      {/* Profile & Contact Visibility Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Eye className="w-4 h-4 text-red-700 shrink-0" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Visibility Levels</h3>
        </div>

        {/* Profile Visibility */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 block">Who can see my profile?</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VISIBILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectChange('profileVisibility', opt.value)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  (privacy.profileVisibility || 'COMMUNITY') === opt.value
                    ? 'bg-red-50/60 border-red-300 ring-1 ring-red-600/30'
                    : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                  (privacy.profileVisibility || 'COMMUNITY') === opt.value
                    ? 'border-red-700 bg-red-700 text-white'
                    : 'border-slate-400 bg-white'
                }`}>
                  {(privacy.profileVisibility || 'COMMUNITY') === opt.value && <Check className="w-2.5 h-2.5" />}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block">{opt.label}</span>
                  <span className="text-[11px] text-slate-500 leading-snug block">{opt.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Connection Visibility */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-900 block">Who can see my connections list?</label>
          <select
            value={privacy.connectionsVisibility || 'COMMUNITY'}
            onChange={(e) => handleSelectChange('connectionsVisibility', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:border-slate-800"
          >
            <option value="EVERYONE">Everyone on JU Connect</option>
            <option value="COMMUNITY">JECRC Community Only</option>
            <option value="CONNECTIONS">My Connections Only</option>
            <option value="ONLY_ME">Only Me (Private)</option>
          </select>
        </div>

        {/* Email Visibility */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-900 block">Who can see my email address?</label>
          <select
            value={privacy.emailVisibility || 'CONNECTIONS'}
            onChange={(e) => handleSelectChange('emailVisibility', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:border-slate-800"
          >
            <option value="EVERYONE">Everyone</option>
            <option value="CONNECTIONS">My Connections Only</option>
            <option value="ONLY_ME">Only Me (Hidden)</option>
          </select>
        </div>

        {/* Phone Visibility */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-900 block">Who can see my phone number?</label>
          <select
            value={privacy.phoneVisibility || 'ONLY_ME'}
            onChange={(e) => handleSelectChange('phoneVisibility', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:border-slate-800"
          >
            <option value="EVERYONE">Everyone</option>
            <option value="CONNECTIONS">My Connections Only</option>
            <option value="ONLY_ME">Only Me (Hidden)</option>
          </select>
        </div>
      </div>

      {/* Discovery & Status Toggles Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Search className="w-4 h-4 text-red-700 shrink-0" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Search & Directory Privacy</h3>
        </div>

        {/* Search Visibility Toggle */}
        <div className="flex items-center justify-between gap-4 py-1">
          <div>
            <span className="text-xs font-bold text-slate-900 block">Allow people to find me in JU Connect search</span>
            <span className="text-[11px] text-slate-500">Include profile in global search directory queries.</span>
          </div>
          <input
            type="checkbox"
            checked={privacy.searchVisibility !== false}
            onChange={() => handleToggle('searchVisibility', privacy.searchVisibility !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>

        {/* Directory Visibility Toggle */}
        <div className="flex items-center justify-between gap-4 py-1 border-t border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              {isAlumni ? 'Show me in Alumni Directory' : 'Show me in Student Directory'}
            </span>
            <span className="text-[11px] text-slate-500">Display profile card in role-specific directory listings.</span>
          </div>
          <input
            type="checkbox"
            checked={privacy.directoryVisibility !== false}
            onChange={() => handleToggle('directoryVisibility', privacy.directoryVisibility !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>

        {/* Online Status Toggle */}
        <div className="flex items-center justify-between gap-4 py-1 border-t border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-900 block">Show when I'm online</span>
            <span className="text-[11px] text-slate-500">Display active green indicator in messaging and community lists.</span>
          </div>
          <input
            type="checkbox"
            checked={privacy.onlineStatusVisible !== false}
            onChange={() => handleToggle('onlineStatusVisible', privacy.onlineStatusVisible !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>

        {/* Mentorship Availability Toggle */}
        <div className="flex items-center justify-between gap-4 py-1 border-t border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-900 block">Mentorship Program Visibility</span>
            <span className="text-[11px] text-slate-500">Show available status badge in Find Mentor directory.</span>
          </div>
          <input
            type="checkbox"
            checked={privacy.mentorshipVisibility !== false}
            onChange={() => handleToggle('mentorshipVisibility', privacy.mentorshipVisibility !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>
      </div>
    </div>
  );
};
