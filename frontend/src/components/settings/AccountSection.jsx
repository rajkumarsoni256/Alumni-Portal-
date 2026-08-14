import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { settingsService } from '../../services/settingsService';
import { 
  Mail, 
  Lock, 
  CheckCircle2, 
  ShieldAlert, 
  User, 
  Trash2, 
  Loader2,
  AlertTriangle
} from 'lucide-react';

export const AccountSection = () => {
  const { currentUser, userSettings, showNotification, logout } = useApp();

  // Modals state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEmailChangeSubmit = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || isSubmittingEmail) return;

    setIsSubmittingEmail(true);
    try {
      await settingsService.changeEmail({ newEmail, currentPassword: emailPassword });
      showNotification('Email address updated successfully', 'success');
      setShowEmailModal(false);
      setNewEmail('');
      setEmailPassword('');
    } catch (err) {
      showNotification(err.message || 'Failed to update email', 'error');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showNotification('Password must be at least 6 characters', 'error');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await settingsService.changePassword({ currentPassword, newPassword });
      showNotification('Password updated successfully', 'success');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showNotification(err.message || 'Failed to change password', 'error');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    setIsDeactivating(true);
    try {
      await settingsService.deactivateAccount();
      showNotification('Account deactivated', 'info');
      if (logout) logout();
    } catch (err) {
      showNotification(err.message || 'Failed to deactivate account', 'error');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleDeleteConfirm = async (e) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      await settingsService.deleteAccount({ password: deletePassword });
      showNotification('Account deletion requested', 'info');
      if (logout) logout();
    } catch (err) {
      showNotification(err.message || 'Failed to request account deletion', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="space-y-1 pb-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">Account Preferences</h2>
        <p className="text-xs text-slate-500">Manage your primary email, password credentials, and account lifecycle.</p>
      </div>

      {/* Account Details Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-2xs">
        {/* Email Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-xs font-bold text-slate-900">Email Address</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium pl-6">{currentUser?.email || 'user@jecrc.ac.in'}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            Change
          </button>
        </div>

        {/* Password Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-xs font-bold text-slate-900">Password Credentials</span>
            </div>
            <p className="text-xs text-slate-500 pl-6">••••••••••••</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            Change password
          </button>
        </div>

        {/* Account Type Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-xs font-bold text-slate-900">Account Type</span>
            </div>
            <p className="text-xs text-slate-500 pl-6">Role assigned by JECRC University administration.</p>
          </div>
          <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-md capitalize border border-red-200">
            {currentUser?.role || 'Student'}
          </span>
        </div>
      </div>

      {/* Danger Zone Card */}
      <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-rose-800">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Danger Zone</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-rose-100">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Deactivate Account</h4>
            <p className="text-[11px] text-slate-500">Temporarily hide your profile from search and public community directory.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeactivateModal(true)}
            className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Deactivate
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-rose-100">
          <div>
            <h4 className="text-xs font-bold text-rose-900">Delete Account</h4>
            <p className="text-[11px] text-slate-500">Permanently request account deletion and removal of personal data.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Change Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleEmailChangeSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-900">Change Primary Email</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">New Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="newemail@jecrc.ac.in"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Current Password (Verification)</label>
                <input
                  type="password"
                  required
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-slate-800"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingEmail}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSubmittingEmail && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save New Email</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handlePasswordChangeSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-slate-800"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSubmittingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900">Deactivate Account?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your profile and posts will be hidden from other community members. You can reactivate your account anytime simply by logging back in.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeactivating}
                onClick={handleDeactivateConfirm}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isDeactivating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Deactivate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleDeleteConfirm} className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-rose-700">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900">Permanently Delete Account?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This action disables your account and flags your personal records for permanent removal according to JU Connect data retention guidelines.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Enter Password to Confirm</label>
              <input
                type="password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDeleting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Permanently Delete</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
