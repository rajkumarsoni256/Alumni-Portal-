import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { useApp } from '../context/AppContext';
import { AccountSection } from '../components/settings/AccountSection';
import { ProfileSettingsSection } from '../components/settings/ProfileSettingsSection';
import { PrivacySection } from '../components/settings/PrivacySection';
import { NotificationSettingsSection } from '../components/settings/NotificationSettingsSection';
import { MessagingSettingsSection } from '../components/settings/MessagingSettingsSection';
import { SecuritySection } from '../components/settings/SecuritySection';
import { CareerMentorshipSection } from '../components/settings/CareerMentorshipSection';
import { AppearanceSection } from '../components/settings/AppearanceSection';
import { DataPrivacySection } from '../components/settings/DataPrivacySection';
import { BlockedUsersSection } from '../components/settings/BlockedUsersSection';
import { HelpSupportSection } from '../components/settings/HelpSupportSection';

import { 
  User, 
  UserCheck, 
  Shield, 
  Bell, 
  MessageSquare, 
  Lock, 
  Briefcase, 
  Award, 
  Sun, 
  Database, 
  UserX, 
  HelpCircle,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

export const SettingsPage = () => {
  const { currentUser, userSettings, fetchUserSettings } = useApp();
  const [activeTab, setActiveTab] = useState('account');
  const [mobileSubScreenOpen, setMobileSubScreenOpen] = useState(false);

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const isAlumni = (currentUser?.role || '').toUpperCase() === 'ALUMNI';

  const TABS = [
    { id: 'account', label: 'Account', icon: User, desc: 'Email, password & status' },
    { id: 'profile', label: 'Profile Details', icon: UserCheck, desc: 'Public bio & headline' },
    { id: 'privacy', label: 'Privacy & Visibility', icon: Shield, desc: 'Directory & contact rules' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'In-app & email alerts' },
    { id: 'messaging', label: 'Messaging & Network', icon: MessageSquare, desc: 'Message & request controls' },
    { id: 'security', label: 'Security & 2FA', icon: Lock, desc: '2FA & active sessions' },
    { 
      id: 'career', 
      label: isAlumni ? 'Professional & Mentorship' : 'Career & Mentorship', 
      icon: isAlumni ? Award : Briefcase, 
      desc: isAlumni ? 'Mentorship availability' : 'Job status & preferences' 
    },
    { id: 'appearance', label: 'Appearance', icon: Sun, desc: 'Light, dark & system themes' },
    { id: 'data', label: 'Data & Privacy', icon: Database, desc: 'Export archive & history' },
    { id: 'blocked', label: 'Blocked Accounts', icon: UserX, desc: 'Manage blocked users' },
    { id: 'support', label: 'Help & Support', icon: HelpCircle, desc: 'Guidelines & report issue' },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMobileSubScreenOpen(true);
  };

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'account':
        return <AccountSection />;
      case 'profile':
        return <ProfileSettingsSection />;
      case 'privacy':
        return <PrivacySection />;
      case 'notifications':
        return <NotificationSettingsSection />;
      case 'messaging':
        return <MessagingSettingsSection />;
      case 'security':
        return <SecuritySection />;
      case 'career':
        return <CareerMentorshipSection />;
      case 'appearance':
        return <AppearanceSection />;
      case 'data':
        return <DataPrivacySection />;
      case 'blocked':
        return <BlockedUsersSection />;
      case 'support':
        return <HelpSupportSection />;
      default:
        return <AccountSection />;
    }
  };

  return (
    <PageContainer
      title="Settings & Preferences"
      description="Manage account details, privacy visibility, notification channels, security, and career preferences."
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
        
        {/* Left Sidebar Menu (Desktop: 4-cols on MD, 3-cols on LG) */}
        <div className={`md:col-span-4 lg:col-span-3 bg-slate-50/80 border-r border-slate-200 p-3 space-y-1 ${
          mobileSubScreenOpen ? 'hidden md:block' : 'block'
        }`}>
          <div className="px-3 py-2 pb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Settings Navigation</span>
          </div>

          <div className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-red-700 font-bold shadow-2xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-red-700' : 'text-slate-500'}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'text-red-700 translate-x-0.5' : 'text-slate-300'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Panel (Desktop: 8-cols on MD, 9-cols on LG) */}
        <div className={`md:col-span-8 lg:col-span-9 p-4 sm:p-6 md:p-8 bg-white ${
          !mobileSubScreenOpen ? 'hidden md:block' : 'block'
        }`}>
          {/* Mobile Back Header */}
          <div className="md:hidden flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setMobileSubScreenOpen(false)}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Menu</span>
            </button>
          </div>

          {/* Active Settings Section */}
          {renderActiveSection()}
        </div>

      </div>
    </PageContainer>
  );
};
