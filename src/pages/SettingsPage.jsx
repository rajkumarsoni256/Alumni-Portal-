import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { useApp } from '../context/AppContext';
import { User, Bell, Shield, Check, Save } from 'lucide-react';

export const SettingsPage = () => {
  const { currentUser, showNotification } = useApp();

  const [activeTab, setActiveTab] = useState('account');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [mentorshipAlerts, setMentorshipAlerts] = useState(true);
  const [profilePublic, setProfilePublic] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    showNotification('Preferences updated successfully!', 'success');
  };

  return (
    <PageContainer
      title="Settings"
      description="Manage your account details, notification alerts, and privacy preferences."
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        {/* Left Settings Sidebar (4 Cols) */}
        <div className="md:col-span-4 bg-slate-50 border-r border-slate-200 p-3 space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`w-full px-3 py-2 rounded-lg text-xs font-medium text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
              activeTab === 'account'
                ? 'bg-white text-red-700 font-semibold shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`w-full px-3 py-2 rounded-lg text-xs font-medium text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-white text-red-700 font-semibold shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`w-full px-3 py-2 rounded-lg text-xs font-medium text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-white text-red-700 font-semibold shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Privacy & Security</span>
          </button>
        </div>

        {/* Right Settings Form (8 Cols) */}
        <div className="md:col-span-8 p-6 space-y-6">
          
          {activeTab === 'account' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Account Details</h3>
                <p className="text-xs text-slate-500">Update your primary display name and email address.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Full Name</label>
                  <input
                    type="text"
                    defaultValue={currentUser.name}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Email Address</label>
                  <input
                    type="email"
                    defaultValue={currentUser.email || 'tokir@jecrc.edu.in'}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Headline Bio</label>
                  <input
                    type="text"
                    defaultValue={currentUser.headline}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Notification Alerts</h3>
                <p className="text-xs text-slate-500">Configure how you receive community and mentorship alerts.</p>
              </div>

              <div className="space-y-3 divide-y divide-slate-100">
                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Email Notifications</span>
                    <span className="text-[11px] text-slate-500">Receive email digests for post interactions and connection requests.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifs}
                    onChange={(e) => setEmailNotifs(e.target.checked)}
                    className="w-4 h-4 text-red-700 rounded cursor-pointer"
                  />
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Mentorship Session Reminders</span>
                    <span className="text-[11px] text-slate-500">Instant reminders 30 minutes before video call meetings.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={mentorshipAlerts}
                    onChange={(e) => setMentorshipAlerts(e.target.checked)}
                    className="w-4 h-4 text-red-700 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Privacy & Security</h3>
                <p className="text-xs text-slate-500">Manage directory visibility and security controls.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Public Directory Profile</span>
                    <span className="text-[11px] text-slate-500">Allow other JECRC students and alumni to find your profile.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profilePublic}
                    onChange={(e) => setProfilePublic(e.target.checked)}
                    className="w-4 h-4 text-red-700 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </PageContainer>
  );
};
