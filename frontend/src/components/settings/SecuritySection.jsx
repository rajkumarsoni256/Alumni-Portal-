import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { settingsService } from '../../services/settingsService';
import { 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  Laptop, 
  Key, 
  LogOut, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const SecuritySection = () => {
  const { userSettings, updateUserSettings, showNotification } = useApp();
  const account = userSettings?.account || {};

  const [twoFactor, setTwoFactor] = useState(account.twoFactorEnabled || false);
  const [show2FAmodal, setShow2FAmodal] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [revokingId, setRevokingId] = useState(null);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const list = await settingsService.getActiveSessions();
      setSessions(list);
    } catch (err) {
      console.warn('Failed to load active sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handle2FAToggle = async () => {
    const nextVal = !twoFactor;
    try {
      await updateUserSettings({ twoFactorEnabled: nextVal });
      setTwoFactor(nextVal);
      showNotification(nextVal ? 'Two-Factor Authentication enabled' : 'Two-Factor Authentication disabled', 'info');
      setShow2FAmodal(false);
    } catch (err) {
      showNotification(err.message || 'Failed to update 2FA status', 'error');
    }
  };

  const handleRevokeSession = async (sessionId) => {
    setRevokingId(sessionId);
    try {
      await settingsService.revokeSession(sessionId);
      showNotification('Session revoked successfully', 'info');
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      showNotification(err.message || 'Failed to revoke session', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="space-y-1 pb-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">Security & Authentication</h2>
        <p className="text-xs text-slate-500">Manage two-factor authentication, active login sessions, and credential security.</p>
      </div>

      {/* 2FA Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Two-Factor Authentication (2FA)</h3>
              <p className="text-[11px] text-slate-500 max-w-md">
                Add an extra layer of security to your account requiring a verification code upon login.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShow2FAmodal(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              twoFactor
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-red-700 text-white hover:bg-red-800'
            }`}
          >
            {twoFactor ? 'Enabled (Configured)' : 'Enable 2FA'}
          </button>
        </div>
      </div>

      {/* Active Sessions Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-red-700 shrink-0" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active Login Sessions</h3>
          </div>
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            {sessions.length} Active
          </span>
        </div>

        {isLoadingSessions ? (
          <div className="py-6 text-center">
            <Loader2 className="w-5 h-5 text-red-700 animate-spin mx-auto" />
          </div>
        ) : (
          <div className="space-y-3 divide-y divide-slate-100">
            {sessions.map((session, idx) => (
              <div key={session.id || idx} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Monitor className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {session.device || 'Chrome / Web Browser'}
                      </span>
                      {session.isCurrent && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                          Current Device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      IP: {session.ip_address || '127.0.0.1'} • Last active: {new Date(session.last_active_at || Date.now()).toLocaleString()}
                    </p>
                  </div>
                </div>

                {!session.isCurrent && (
                  <button
                    type="button"
                    disabled={revokingId === session.id}
                    onClick={() => handleRevokeSession(session.id)}
                    className="text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {revokingId === session.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                    <span>Revoke</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2FA Setup Modal */}
      {show2FAmodal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-900">
              {twoFactor ? 'Disable Two-Factor Authentication?' : 'Enable Two-Factor Authentication'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {twoFactor
                ? 'Disabling 2FA will remove mandatory OTP login verification.'
                : 'Enabling 2FA prompts a 6-digit verification code when logging in from new devices.'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShow2FAmodal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handle2FAToggle}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg cursor-pointer"
              >
                Confirm Status Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
