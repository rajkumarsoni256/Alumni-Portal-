import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  AlertCircle,
  Info 
} from 'lucide-react';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';

import { getPortalHomePath } from '../../utils/navigation';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, loginWithGoogle } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [errors, setErrors] = useState({});

  const fromPath = location.state?.from;

  const getTargetRoute = (userRole, isComplete) => {
    // Admin users MUST ALWAYS route to the Admin Portal
    if (userRole === 'admin') {
      return '/admin/dashboard';
    }

    if (
      fromPath &&
      typeof fromPath === 'string' &&
      fromPath.startsWith('/') &&
      !fromPath.startsWith('//') &&
      !fromPath.toLowerCase().includes('http') &&
      !fromPath.startsWith('/onboarding')
    ) {
      return fromPath;
    }
    if (!isComplete) return '/onboarding';
    return getPortalHomePath(userRole);
  };

  const handleGoogleSuccess = async (idToken) => {
    if (!idToken) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const user = await loginWithGoogle(idToken);
      const userRole = (user && user.role) ? user.role.toLowerCase() : 'student';
      const isComplete = user && user.profileComplete !== false;
      navigate(getTargetRoute(userRole, isComplete));
    } catch (err) {
      setErrorMessage(err.message || 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Please enter your password.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const user = await loginUser({ email, password });
      const userRole = (user && user.role) ? user.role.toLowerCase() : 'student';
      const isComplete = user && user.profileComplete !== false;
      navigate(getTargetRoute(userRole, isComplete));
    } catch (err) {
      if (err.errorCode === 'EMAIL_NOT_VERIFIED') {
        setErrorMessage('Your email address is not verified yet. Please check your inbox or complete verification.');
      } else if (err.errorCode === 'ACCOUNT_PENDING_APPROVAL' || err.errorCode === 'ALUMNI_APPROVAL_PENDING') {
        setErrorMessage(err.message || 'Your account is currently under review and pending approval by the Admin.');
      } else if (err.errorCode === 'ALUMNI_APPROVAL_REJECTED') {
        setErrorMessage('Your alumni registration request was not approved by university administration.');
      } else {
        setErrorMessage(err.message || 'Invalid email or password. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@jecrc.ac.in');
      setPassword('AdminPassword@123');
    } else if (role === 'alumni') {
      setEmail('priya.sharma@alumni.jecrc.ac.in');
      setPassword('Password123!');
    } else {
      setEmail('rahul.verma@student.jecrc.ac.in');
      setPassword('Password123!');
    }
    setErrors({});
    setErrorMessage('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-100/75">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 animate-in fade-in duration-200">
        
        {/* Left: Branding & Feature Panel (5 Cols) */}
        <div className="hidden md:flex col-span-5 bg-slate-900 text-white p-8 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/ju-alumni-logo.jpg"
                alt="JECRC Community"
                className="h-9 w-9 object-contain rounded-lg border border-slate-800 bg-white p-0.5"
              />
              <div>
                <span className="text-base font-bold text-white tracking-tight">
                  JECRC <span className="text-red-500">Community</span>
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Alumni Association
                </span>
              </div>
            </Link>

            <div className="space-y-2 pt-4">
              <h2 className="text-xl font-bold leading-snug">
                Where the JECRC network grows together.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Unified community platform connecting students, alumni, and administrators for mentorship, careers, and alumni relations.
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-red-400 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Verified JECRC students & alumni</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span>1-on-1 career & tech mentorship</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <span>Direct campus placement referrals</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-slate-800 text-[11px] text-slate-500">
            JECRC University • Jaipur, Rajasthan
          </div>
        </div>

        {/* Right: Clean Sign In Form (7 Cols) */}
        <div className="col-span-1 md:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          
          <div className="space-y-5">
            {/* Header */}
            <div className="space-y-1">
              <div className="md:hidden flex items-center gap-2 mb-4">
                <img
                  src="/ju-alumni-logo.jpg"
                  alt="JECRC Community"
                  className="h-7 w-7 object-contain rounded-md"
                />
                <span className="text-sm font-bold text-slate-900">JECRC Community</span>
              </div>

              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Welcome back
              </h1>
              <p className="text-xs text-slate-500">
                Sign in to your JECRC Community account.
              </p>
            </div>

            {/* Personal Email Login Notice Banner */}
            <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200/80 text-[11px] text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-snug">
                <span className="font-bold">Note:</span> Use the personal email you provided during registration to log in. Your JECRC institutional email is used only for student verification.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="leading-snug">{errorMessage}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="name@jecrc.edu.in or personal email"
                  autoComplete="email"
                  className={`w-full bg-slate-50 border ${
                    errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-600 focus:bg-white'
                  } rounded-md px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors`}
                />
                {errors.email && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-semibold text-red-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`w-full bg-slate-50 border ${
                      errors.password ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-600 focus:bg-white'
                    } rounded-md pl-3 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.password}</p>
                )}
              </div>

              {/* Primary CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                OR
              </span>
            </div>

            {/* Google OAuth Integration */}
            <div className="w-full flex flex-col items-center justify-center gap-2">
              <GoogleAuthButton
                onSuccess={handleGoogleSuccess}
                onError={(err) => setErrorMessage(err.message || 'Google authentication failed.')}
                text="continue_with"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Footer Register Link */}
          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-red-700 font-semibold hover:underline">
              Join the Community
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};
