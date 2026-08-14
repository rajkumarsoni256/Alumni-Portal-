import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Eye, 
  EyeOff, 
  ArrowRight, 
  GraduationCap, 
  UserCheck, 
  Check, 
  AlertCircle 
} from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { registerUser, loginWithGoogle } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student'); // 'student' | 'alumni'
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleSuccess = async (idToken) => {
    if (!idToken) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const user = await loginWithGoogle(idToken);
      const userRole = (user && user.role) ? user.role.toLowerCase() : 'student';
      const isComplete = user && user.profileComplete !== false;
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (!isComplete) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Google signup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '792367093796-odhflll8ul8kgk83cci4aamgqgrvlk8p.apps.googleusercontent.com';
    let isMounted = true;

    const initGoogle = () => {
      if (window.google?.accounts?.id && isMounted) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response) => {
              if (response && response.credential) {
                await handleGoogleSuccess(response.credential);
              }
            },
          });

          const btnContainer = document.getElementById('googleRegisterBtnContainer');
          if (btnContainer && btnContainer.children.length === 0) {
            window.google.accounts.id.renderButton(btnContainer, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'signup_with',
              shape: 'rectangular',
            });
          }
        } catch (e) {
          console.warn('Google Identity Services initialization warning:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const timer = setTimeout(initGoogle, 500);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Please enter your full name.';
    }

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Please enter a password.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
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
      await registerUser({ name, email, password, role });
      navigate('/verify-email');
    } catch (err) {
      if (err.errors && typeof err.errors === 'object') {
        setErrors(err.errors);
      }
      setErrorMessage(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/75 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        {/* Left: Brand Identity Banner */}
        <div className="hidden md:flex md:col-span-5 bg-slate-900 text-white p-8 flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/ju-alumni-logo.jpg"
                alt="JECRC Community"
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
                Join the private professional network for JECRC.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Connect with thousands of students, recent graduates, and senior alumni working at leading tech enterprises.
              </p>
            </div>

            <div className="p-3.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-white block">Next steps after registration:</span>
              <p className="text-slate-400 text-[11px]">
                1. Verify your email with a 6-digit code<br />
                2. Complete your academic or career profile<br />
                3. Access the JECRC feed and alumni network
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500">
            JECRC University • Directorate of Alumni Relations
          </div>
        </div>

        {/* Right: Register Form */}
        <div className="col-span-1 md:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          
          <div className="space-y-4">
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
                Create your account
              </h1>
              <p className="text-xs text-slate-500">
                Join JECRC students and graduates in one unified professional platform.
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
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Role Selection Cards */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  I am connected to JECRC as:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                      role === 'student'
                        ? 'border-red-600 bg-red-50/50 ring-1 ring-red-600/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <GraduationCap className={`w-4 h-4 ${role === 'student' ? 'text-red-700' : 'text-slate-500'}`} />
                      {role === 'student' && <Check className="w-3.5 h-3.5 text-red-700" />}
                    </div>
                    <div className="pt-2">
                      <span className="text-xs font-bold text-slate-900 block">Student</span>
                      <span className="text-[10px] text-slate-500 block">Currently studying</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('alumni')}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                      role === 'alumni'
                        ? 'border-red-600 bg-red-50/50 ring-1 ring-red-600/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <UserCheck className={`w-4 h-4 ${role === 'alumni' ? 'text-red-700' : 'text-slate-500'}`} />
                      {role === 'alumni' && <Check className="w-3.5 h-3.5 text-red-700" />}
                    </div>
                    <div className="pt-2">
                      <span className="text-xs font-bold text-slate-900 block">Alumni</span>
                      <span className="text-[10px] text-slate-500 block">Graduated from JU</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. Tokir Khan"
                  autoComplete="name"
                  className={`w-full bg-slate-50 border ${
                    errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-600 focus:bg-white'
                  } rounded-md px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors`}
                />
                {errors.name && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.name}</p>
                )}
              </div>

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

              {/* Passwords (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                      }}
                      placeholder="At least 8 chars"
                      autoComplete="new-password"
                      className={`w-full bg-slate-50 border ${
                        errors.password ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-600 focus:bg-white'
                      } rounded-md pl-3 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[10px] text-rose-600 font-medium">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Confirm password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                    }}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    className={`w-full bg-slate-50 border ${
                      errors.confirmPassword ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-600 focus:bg-white'
                    } rounded-md px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-[10px] text-rose-600 font-medium">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Primary CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Continue to Verification</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Centered OR Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                OR
              </span>
            </div>

            {/* Google Signup Button */}
            <div className="w-full flex flex-col items-center justify-center gap-2">
              <div id="googleRegisterBtnContainer" className="w-full flex justify-center min-h-[40px]"></div>
            </div>
          </div>

          {/* Footer Sign In Link */}
          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-red-700 font-semibold hover:underline">
              Sign In
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};
