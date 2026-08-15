import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useApp } from '../../context/AppContext';
import { adminUserService } from '../../services/adminUserService';
import { 
  User, 
  Lock, 
  Save, 
  ShieldCheck, 
  Sliders, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Globe,
  Mail,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export const AdminSettingsPage = () => {
  const { showNotification, updateAdminProfileState } = useApp();

  // Admin Profile State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Global Platform Settings State
  const [platformName, setPlatformName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [alumniVerificationEnabled, setAlumniVerificationEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Page Status
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPlatform, setIsSavingPlatform] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  const navigate = useNavigate();

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    setErrorStatus(null);
    try {
      const data = await adminUserService.getSettings();
      if (data) {
        setPlatformName(data.platformName || 'JECRC Community Platform');
        setSupportEmail(data.supportEmail || 'alumni@jecrc.ac.in');
        setRegistrationEnabled(data.registrationEnabled !== false);
        setAlumniVerificationEnabled(data.alumniVerificationEnabled !== false);
        setMaintenanceMode(Boolean(data.maintenanceMode));
        if (data.adminProfile) {
          setName(data.adminProfile.name || 'Administrator');
          setEmail(data.adminProfile.email || 'admin@jecrc.ac.in');
          if (updateAdminProfileState) {
            updateAdminProfileState(data.adminProfile);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load admin settings:', err);
      setError(err.message || 'Failed to fetch settings from database.');
      setErrorStatus(err.status || null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updated = await adminUserService.updateSettings({ name, email });
      if (updateAdminProfileState) {
        updateAdminProfileState(updated?.adminProfile || { name, email });
      }
      showNotification('Administrator profile saved successfully.', 'success');
    } catch (err) {
      console.error('Failed to save admin profile:', err);
      showNotification(err.message || 'Failed to save admin profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePlatform = async (e) => {
    e.preventDefault();
    setIsSavingPlatform(true);
    try {
      await adminUserService.updateSettings({
        platformName,
        supportEmail,
        registrationEnabled,
        alumniVerificationEnabled,
        maintenanceMode,
      });
      showNotification('Platform configuration updated successfully.', 'success');
    } catch (err) {
      console.error('Failed to update platform settings:', err);
      showNotification(err.message || 'Failed to update platform settings.', 'error');
    } finally {
      setIsSavingPlatform(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showNotification('Password must be at least 6 characters.', 'error');
      return;
    }
    setIsSavingPassword(true);
    try {
      await adminUserService.updateSettings({ currentPassword, newPassword });
      showNotification('Administrator password updated successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Failed to update password:', err);
      showNotification(err.message || 'Failed to update password.', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-4xl">
        
        {/* Page Header */}
        <div className="border-b border-slate-200 pb-3.5">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Admin Settings
          </h1>
          <p className="text-xs text-slate-500">
            Manage administrative account details, platform controls, and security credentials.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <div>
                <p className="font-bold text-red-900">
                  {errorStatus === 401 ? 'Session Expired' : 'Failed to load live settings'}
                </p>
                <p className="text-[11px] text-red-700">
                  {errorStatus === 401
                    ? 'Your administrator session has expired. Please log in again to continue.'
                    : error}
                </p>
              </div>
            </div>
            {errorStatus === 401 ? (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-3 py-1 rounded bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                Log In Again
              </button>
            ) : (
              <button
                type="button"
                onClick={fetchSettings}
                className="px-3 py-1 rounded bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-md border border-slate-200 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-red-700" />
            <p>Loading settings from PostgreSQL database...</p>
          </div>
        ) : (
          <div className="space-y-5">
            
            {/* 1. Global Platform Controls & Configuration */}
            <div className="bg-white rounded-md border border-slate-200 p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <Sliders className="w-4 h-4 text-red-700" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Platform Controls &amp; Configuration</h2>
              </div>

              <form onSubmit={handleSavePlatform} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Platform Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Support Email
                    </label>
                    <input
                      type="email"
                      required
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-2 space-y-2.5 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200/80">
                    <div>
                      <span className="font-bold text-slate-900 block">User Registration</span>
                      <span className="text-[11px] text-slate-500">Allow new students and alumni to create accounts</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegistrationEnabled(!registrationEnabled)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        registrationEnabled
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {registrationEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200/80">
                    <div>
                      <span className="font-bold text-slate-900 block">Alumni Verification Workflow</span>
                      <span className="text-[11px] text-slate-500">Accept and process alumni degree verification submissions</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAlumniVerificationEnabled(!alumniVerificationEnabled)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        alumniVerificationEnabled
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {alumniVerificationEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200/80">
                    <div>
                      <span className="font-bold text-slate-900 block">Maintenance Mode</span>
                      <span className="text-[11px] text-slate-500">Display maintenance advisory banner across platform</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        maintenanceMode
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {maintenanceMode ? 'Active' : 'Off'}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingPlatform}
                    className="px-3.5 py-1.5 rounded text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingPlatform ? 'Saving...' : 'Save Platform Controls'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Admin Profile Information */}
            <div className="bg-white rounded-md border border-slate-200 p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <User className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Administrator Profile</h2>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3 max-w-md">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Administrator Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-3.5 py-1.5 rounded text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingProfile ? 'Saving...' : 'Save Profile Info'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 3. Security / Password Change */}
            <div className="bg-white rounded-md border border-slate-200 p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <Lock className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Security &amp; Password</h2>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="px-3.5 py-1.5 rounded text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isSavingPassword ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  );
};
