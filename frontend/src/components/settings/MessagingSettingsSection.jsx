import React from 'react';
import { useApp } from '../../context/AppContext';
import { MessageSquare, UserCheck, Eye, CheckCircle2 } from 'lucide-react';

export const MessagingSettingsSection = () => {
  const { userSettings, updateUserSettings, showNotification } = useApp();
  const messaging = userSettings?.messaging || {};

  const handleSelectChange = async (key, val) => {
    try {
      await updateUserSettings({ [key]: val });
      showNotification('Messaging preference updated', 'info');
    } catch (err) {
      showNotification(err.message || 'Failed to update messaging preference', 'error');
    }
  };

  const handleToggle = async (key, currentVal) => {
    try {
      await updateUserSettings({ [key]: !currentVal });
      showNotification('Preference updated', 'info');
    } catch (err) {
      showNotification(err.message || 'Failed to update preference', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="space-y-1 pb-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">Messaging & Network Controls</h2>
        <p className="text-xs text-slate-500">Configure who can send you direct messages and connection invites.</p>
      </div>

      {/* Message Permissions Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <MessageSquare className="w-4 h-4 text-red-700 shrink-0" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Direct Messaging</h3>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 block">Who can send me direct messages?</label>
          <select
            value={messaging.allowMessagesFrom || 'CONNECTIONS'}
            onChange={(e) => handleSelectChange('allowMessagesFrom', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:border-slate-800"
          >
            <option value="CONNECTIONS">My Connections Only (Recommended)</option>
            <option value="EVERYONE">Everyone on JU Connect</option>
          </select>
          <p className="text-[11px] text-slate-500">
            {messaging.allowMessagesFrom === 'EVERYONE'
              ? 'Any verified user on JU Connect can send you private message requests.'
              : 'Only users with accepted connection status can start a 1-to-1 conversation with you.'}
          </p>
        </div>

        {/* Read Receipts */}
        <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-900 block">Send read receipts</span>
            <span className="text-[11px] text-slate-500">Let conversation partners know when you've viewed their messages.</span>
          </div>
          <input
            type="checkbox"
            checked={messaging.showReadReceipts !== false}
            onChange={() => handleToggle('showReadReceipts', messaging.showReadReceipts !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>

        {/* Typing Indicators */}
        <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-900 block">Typing indicators</span>
            <span className="text-[11px] text-slate-500">Show when you are typing a message reply in real-time.</span>
          </div>
          <input
            type="checkbox"
            checked={messaging.showTypingIndicator !== false}
            onChange={() => handleToggle('showTypingIndicator', messaging.showTypingIndicator !== false)}
            className="w-4 h-4 text-red-700 rounded cursor-pointer shrink-0"
          />
        </div>
      </div>

      {/* Connection Requests Permission Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <UserCheck className="w-4 h-4 text-red-700 shrink-0" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Connection Requests</h3>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 block">Who can send me connection requests?</label>
          <select
            value={messaging.allowConnectionRequestsFrom || 'EVERYONE'}
            onChange={(e) => handleSelectChange('allowConnectionRequestsFrom', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:border-slate-800"
          >
            <option value="EVERYONE">Everyone on JU Connect</option>
            <option value="COMMUNITY">Verified JECRC Community Only</option>
            <option value="NOBODY">Nobody (Pause incoming requests)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
