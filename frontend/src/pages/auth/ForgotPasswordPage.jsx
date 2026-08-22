import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { sendForgotPasswordLink, verifyResetOTP, resendResetOTP, resetUserPassword } = useApp();

  // State machine: 'EMAIL' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS'
  const [step, setStep] = useState('EMAIL');

  // Form State
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Timers
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(600); // 10 minutes

  // Handle 60s Resend Cooldown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle 10-minute OTP Expiry Countdown
  useEffect(() => {
    let timer;
    if (step === 'OTP' && expirySeconds > 0) {
      timer = setInterval(() => {
        setExpirySeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, expirySeconds]);

  // STEP 1: Send Initial OTP to Email
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await sendForgotPasswordLink(email);
      setStep('OTP');
      setResendCooldown(60);
      setExpirySeconds(600);
    } catch (err) {
      setError(err.message || 'Unable to process password reset request.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendOTP = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError('');
    setIsLoading(true);
    try {
      await resendResetOTP(email);
      setResendCooldown(60);
      setExpirySeconds(600);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify 6-Digit OTP Code
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const res = await verifyResetOTP({ email, otp: otpCode });
      if (res && res.resetToken) {
        setResetToken(res.resetToken);
        setStep('NEW_PASSWORD');
      } else {
        throw new Error('Verification failed. Invalid token received.');
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired 6-digit OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Reset Password with Reset Token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await resetUserPassword({ resetToken, newPassword });
      setStep('SUCCESS');
    } catch (err) {
      setError(err.message || 'Password reset failed. Token may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format MM:SS for countdown timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-100/75 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">

        {/* ERROR DISPLAY */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 1: Enter Email */}
        {/* ============================================================ */}
        {step === 'EMAIL' && (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Forgot your password?
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Enter your email address to receive a secure 6-digit verification code.
              </p>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Email Address *
                </label>
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="name@jecrcu.edu.in or personal email"
                  autoComplete="email"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {isLoading ? (
                  <span>Sending Code...</span>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 text-center">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* STEP 2: Enter 6-Digit OTP Code */}
        {/* ============================================================ */}
        {step === 'OTP' && (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6 text-amber-700" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Enter Verification Code
              </h1>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                We sent a 6-digit OTP code to <strong className="text-slate-900 underline">{email}</strong>.
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block text-center">
                  6-Digit Password Reset OTP Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, ''));
                    if (error) setError('');
                  }}
                  placeholder="123456"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-red-700 focus:bg-white rounded-lg px-4 py-3 text-center text-xl font-mono font-bold tracking-widest text-slate-900 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Code expires in: <strong className="font-mono text-slate-800">{formatTime(expirySeconds)}</strong></span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-red-700 font-semibold hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-full py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {isLoading ? (
                  <span>Verifying OTP...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Verify OTP &amp; Continue</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => { setStep('EMAIL'); setError(''); }}
                className="text-slate-500 hover:text-slate-900 font-medium cursor-pointer inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Email</span>
              </button>
              <Link to="/login" className="text-red-700 font-semibold hover:underline">
                Back to Sign In
              </Link>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* STEP 3: Create New Password */}
        {/* ============================================================ */}
        {step === 'NEW_PASSWORD' && (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-emerald-700" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Create New Password
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Choose a strong new password for your JU Connect account.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="At least 8 chars"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md pl-3 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Confirm New Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Repeat new password"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>

              {/* Password Requirements List */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-[11px] text-slate-600">
                <p className="font-bold text-slate-800 text-xs mb-1">Password Requirements:</p>
                <div className="flex items-center gap-1.5">
                  <span className={newPassword.length >= 8 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    {newPassword.length >= 8 ? '✓' : '•'} Minimum 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    {/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? '✓' : '•'} Uppercase &amp; lowercase letters
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={/\d/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    {/\d/.test(newPassword) ? '✓' : '•'} At least 1 number (0-9)
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {isLoading ? (
                  <span>Resetting Password...</span>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Reset Password &amp; Secure Account</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* ============================================================ */}
        {/* STEP 4: Success Confirmation */}
        {/* ============================================================ */}
        {step === 'SUCCESS' && (
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Password Reset Complete!</h2>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Your JU Connect password has been updated. All active sessions have been invalidated for security.
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors block text-center shadow-2xs cursor-pointer"
              >
                Sign In with New Password
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
