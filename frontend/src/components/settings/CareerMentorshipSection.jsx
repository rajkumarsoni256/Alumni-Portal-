import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Briefcase, Award, Sparkles, Check, Loader2 } from 'lucide-react';

export const CareerMentorshipSection = () => {
  const { currentUser, userSettings, updateUserSettings, showNotification } = useApp();
  const isAlumni = (currentUser?.role || '').toUpperCase() === 'ALUMNI';

  const career = userSettings?.career || {};
  const alumni = userSettings?.alumni || {};

  const [careerStatus, setCareerStatus] = useState(career.careerStatus || 'OPEN_TO_FULLTIME');
  const [workTypeRemote, setWorkTypeRemote] = useState(career.workTypeRemote !== false);
  const [workTypeHybrid, setWorkTypeHybrid] = useState(career.workTypeHybrid !== false);
  const [workTypeOnsite, setWorkTypeOnsite] = useState(career.workTypeOnsite !== false);
  const [preferredRoles, setPreferredRoles] = useState(Array.isArray(career.preferredRoles) ? career.preferredRoles.join(', ') : (career.preferredRoles || 'Software Engineer, Full Stack Developer'));
  const [preferredLocations, setPreferredLocations] = useState(Array.isArray(career.preferredLocations) ? career.preferredLocations.join(', ') : (career.preferredLocations || 'Jaipur, Bengaluru, Remote'));
  const [lookingForMentor, setLookingForMentor] = useState(career.lookingForMentor !== false);

  const [showCompany, setShowCompany] = useState(alumni.showCompany !== false);
  const [showDesignation, setShowDesignation] = useState(alumni.showDesignation !== false);
  const [showLocation, setShowLocation] = useState(alumni.showLocation !== false);
  const [availableAsMentor, setAvailableAsMentor] = useState(alumni.availableAsMentor !== false);
  const [mentorshipTopics, setMentorshipTopics] = useState(
    Array.isArray(career.mentorshipTopics) ? career.mentorshipTopics.join(', ') : (career.mentorshipTopics || 'Career guidance, Technical skills, Interview preparation')
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = isAlumni
        ? {
            showCompany,
            showDesignation,
            showLocation,
            mentorshipVisibility: availableAsMentor,
            mentorshipTopics: mentorshipTopics.split(',').map((s) => s.trim()).filter(Boolean),
          }
        : {
            careerStatus,
            workTypeRemote,
            workTypeHybrid,
            workTypeOnsite,
            preferredRoles: preferredRoles.split(',').map((s) => s.trim()).filter(Boolean),
            preferredLocations: preferredLocations.split(',').map((s) => s.trim()).filter(Boolean),
            mentorshipVisibility: lookingForMentor,
            mentorshipTopics: mentorshipTopics.split(',').map((s) => s.trim()).filter(Boolean),
          };

      await updateUserSettings(payload);
      showNotification('Career & Mentorship settings saved', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="space-y-1 pb-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">
          {isAlumni ? 'Professional & Mentorship Controls' : 'Career & Mentorship Preferences'}
        </h2>
        <p className="text-xs text-slate-500">
          {isAlumni
            ? 'Configure how your corporate experience and mentorship availability are shared with students.'
            : 'Configure your job status, preferred roles, and mentorship requirements.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {!isAlumni ? (
          /* Student Career Form */
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Briefcase className="w-4 h-4 text-red-700 shrink-0" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Placement & Internship Status</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 block">Career Status</label>
              <select
                value={careerStatus}
                onChange={(e) => setCareerStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:border-slate-800"
              >
                <option value="OPEN_TO_INTERNSHIPS">Actively seeking internships</option>
                <option value="OPEN_TO_FULLTIME">Actively seeking full-time campus placements</option>
                <option value="NOT_LOOKING">Not currently looking for job opportunities</option>
              </select>
            </div>

            {/* Work Type Preferences */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-900 block">Preferred Work Modes</label>
              <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={workTypeRemote}
                    onChange={(e) => setWorkTypeRemote(e.target.checked)}
                    className="w-4 h-4 text-red-700 rounded"
                  />
                  <span>Remote</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={workTypeHybrid}
                    onChange={(e) => setWorkTypeHybrid(e.target.checked)}
                    className="w-4 h-4 text-red-700 rounded"
                  />
                  <span>Hybrid</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={workTypeOnsite}
                    onChange={(e) => setWorkTypeOnsite(e.target.checked)}
                    className="w-4 h-4 text-red-700 rounded"
                  />
                  <span>On-site</span>
                </label>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-900 block">Target Job Roles (comma-separated)</label>
              <input
                type="text"
                value={preferredRoles}
                onChange={(e) => setPreferredRoles(e.target.value)}
                placeholder="Software Engineer, Frontend Developer, Data Analyst"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-900 block">Preferred Locations (comma-separated)</label>
              <input
                type="text"
                value={preferredLocations}
                onChange={(e) => setPreferredLocations(e.target.value)}
                placeholder="Jaipur, Bengaluru, Remote"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
              />
            </div>
          </div>
        ) : (
          /* Alumni Professional Form */
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Briefcase className="w-4 h-4 text-red-700 shrink-0" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Professional Branding Visibility</h3>
            </div>

            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Show Company Name on Profile</span>
                <span className="text-[11px] text-slate-500">Display organization badge on posts & card header.</span>
              </div>
              <input
                type="checkbox"
                checked={showCompany}
                onChange={(e) => setShowCompany(e.target.checked)}
                className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
              />
            </div>

            <div className="flex items-center justify-between gap-4 py-1 border-t border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Show Designation / Title</span>
                <span className="text-[11px] text-slate-500">Display current job title on profile card.</span>
              </div>
              <input
                type="checkbox"
                checked={showDesignation}
                onChange={(e) => setShowDesignation(e.target.checked)}
                className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
              />
            </div>

            <div className="flex items-center justify-between gap-4 py-1 border-t border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Show Location</span>
                <span className="text-[11px] text-slate-500">Display city/region location.</span>
              </div>
              <input
                type="checkbox"
                checked={showLocation}
                onChange={(e) => setShowLocation(e.target.checked)}
                className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
              />
            </div>
          </div>
        )}

        {/* Mentorship Settings Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Award className="w-4 h-4 text-red-700 shrink-0" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Mentorship Program</h3>
          </div>

          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                {isAlumni ? 'Available as Alumni Mentor' : 'Seeking Mentorship from Alumni'}
              </span>
              <span className="text-[11px] text-slate-500">
                {isAlumni
                  ? 'Allow students to send 1-on-1 mentorship session requests.'
                  : 'Display seeking mentor badge in mentorship directory.'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={isAlumni ? availableAsMentor : lookingForMentor}
              onChange={(e) => isAlumni ? setAvailableAsMentor(e.target.checked) : setLookingForMentor(e.target.checked)}
              className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-900 block">Mentorship Topics (comma-separated)</label>
            <input
              type="text"
              value={mentorshipTopics}
              onChange={(e) => setMentorshipTopics(e.target.value)}
              placeholder="Career guidance, Resume review, Mock interviews, System design"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
