import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TEST_ACCOUNTS } from '../../services/authService';
import { 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  AlertCircle 
} from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { loginUser } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Please enter your password.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
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
      await loginUser({ email, password });
      navigate('/');
    } catch (err) {
      setErrorMessage(err.message || 'We could not sign you in. Please check your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (role) => {
    const creds = TEST_ACCOUNTS[role] || TEST_ACCOUNTS.student;
    setEmail(creds.email);
    setPassword(creds.password);
    setErrors({});
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-100/75 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        {/* Left: Brand Identity Banner (5 Cols) */}
        <div className="hidden md:flex md:col-span-5 bg-slate-900 text-white p-8 flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/ju-alumni-logo.jpg"
                alt="JECRC Alumni Association"
                className="h-9 w-9 object-contain rounded-md bg-white p-0.5"
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
                Private professional community connecting students with graduates for 1-on-1 mentorship, career advice, and placement referrals.
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

          <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500">
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

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="leading-snug">{errorMessage}</p>
              </div>
            )}

            {/* Quick Demo Fill Bar */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-medium text-[11px]">Quick Demo:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleFillDemo('student')}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Student (Tokir)
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo('alumni')}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Alumni (Priya)
                </button>
              </div>
            </div>

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
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-2 text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                or
              </span>
            </div>

            {/* Google OAuth simulation */}
            <button
              type="button"
              onClick={() => {
                handleFillDemo('student');
                loginUser({ email: TEST_ACCOUNTS.student.email, password: TEST_ACCOUNTS.student.password });
                navigate('/');
              }}
              className="w-full py-2 rounded-md text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
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
