import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { apiClient, setAuthToken } from '../../services/apiClient';
import { 
  Eye, 
  EyeOff, 
  ArrowRight, 
  GraduationCap, 
  UserCheck, 
  Check, 
  AlertCircle,
  ShieldCheck,
  Info,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { registerUser, loginWithGoogle, setAuthUser } = useApp();

  const [name, setName] = useState('');
  const [role, setRole] = useState('student'); // 'student' | 'alumni'

  // Student 2-Step Registration State
  const [studentStep, setStudentStep] = useState(1); // 1: Input Form, 2: OTP Verification
  const [institutionalEmail, setInstitutionalEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [course, setCourse] = useState('BTECH');
  const [joiningYear, setJoiningYear] = useState('2024');
  const [graduationYear, setGraduationYear] = useState('2028');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Alumni Specific Fields
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

  const validateStudentStep1 = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Please enter your full name.';

    if (!rollNumber.trim()) {
      newErrors.rollNumber = 'University Roll Number is required for students.';
    }

    if (!institutionalEmail.trim()) {
      newErrors.institutionalEmail = 'JECRC Institutional Email (@jecrcu.edu.in) is required.';
    } else if (!institutionalEmail.trim().toLowerCase().endsWith('@jecrcu.edu.in')) {
      newErrors.institutionalEmail = 'Institutional email must belong to @jecrcu.edu.in domain.';
    }

    if (!personalEmail.trim()) {
      newErrors.personalEmail = 'Personal email address is required for account login.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail.trim())) {
      newErrors.personalEmail = 'Please enter a valid personal email address.';
    } else if (personalEmail.trim().toLowerCase() === institutionalEmail.trim().toLowerCase()) {
      newErrors.personalEmail = 'Personal email cannot be the same as your institutional email.';
    }

    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required.';
    } else if (!/^[6-9]\d{9}$/.test(mobileNumber.trim().replace(/[\s\-\(\)]/g, ''))) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number.';
    }

    if (!joiningYear) {
      newErrors.joiningYear = 'Admission year is required.';
    }

    if (!graduationYear) {
      newErrors.graduationYear = 'Graduation year is required.';
    } else if (parseInt(graduationYear, 10) <= parseInt(joiningYear, 10)) {
      newErrors.graduationYear = 'Graduation year must be after admission year.';
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

  const validateAlumniForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Please enter your full name.';

    if (!personalEmail.trim()) {
      newErrors.personalEmail = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail.trim())) {
      newErrors.personalEmail = 'Please enter a valid email address.';
    }

    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required.';
    } else if (!/^[6-9]\d{9}$/.test(mobileNumber.trim().replace(/[\s\-\(\)]/g, ''))) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number.';
    }

    if (!graduationYear) {
      newErrors.graduationYear = 'Graduation year is required.';
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

  const handleStudentInit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateStudentStep1()) return;

    setIsLoading(true);
    try {
      const res = await apiClient.post('/api/v1/auth/student/register-init', {
        name: name.trim(),
        rollNumber: rollNumber.trim().toUpperCase(),
        institutionalEmail: institutionalEmail.trim().toLowerCase(),
        personalEmail: personalEmail.trim().toLowerCase(),
        mobileNumber: mobileNumber.trim(),
        password,
        course,
        joiningYear,
        graduationYear,
      });

      setSuccessMessage(res.message || 'OTP sent to your JECRC institutional email.');
      setStudentStep(2);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to initiate student verification.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentVerifyOTP = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setErrors({ otpCode: 'Please enter the 6-digit OTP code.' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post('/api/v1/auth/student/verify-otp', {
        name: name.trim(),
        rollNumber: rollNumber.trim().toUpperCase(),
        institutionalEmail: institutionalEmail.trim().toLowerCase(),
        personalEmail: personalEmail.trim().toLowerCase(),
        mobileNumber: mobileNumber.trim(),
        password,
        course,
        joiningYear,
        graduationYear,
        code: otpCode.trim(),
      });

      if (res.token) {
        setAuthToken(res.token);
      }
      if (res.user && setAuthUser) {
        setAuthUser(res.user);
      }

      navigate('/');
    } catch (err) {
      setErrorMessage(err.message || 'Unable to verify student details. Please check your information and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlumniSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateAlumniForm()) return;

    setIsLoading(true);
    try {
      await registerUser({
        name: name.trim(),
        email: personalEmail.trim().toLowerCase(),
        mobileNumber: mobileNumber.trim(),
        phone: mobileNumber.trim(),
        password,
        role: 'alumni',
        graduationYear,
        company: company.trim(),
        designation: designation.trim(),
        linkedinUrl: linkedinUrl.trim(),
      });
      navigate('/verify-email');
    } catch (err) {
      if (err.errors && typeof err.errors === 'object') {
        setErrors(err.errors);
      }
      setErrorMessage(err.message || 'Alumni registration failed. Please check your details.');
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
            {role === 'student' ? (
              studentStep === 1 ? (
                /* STUDENT STEP 1: Form Inputs */
                <form onSubmit={handleStudentInit} className="space-y-3.5">
                  {/* Role Selector */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      I am connected to JECRC as:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setRole('student'); setStudentStep(1); }}
                        className="p-3 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between border-red-600 bg-red-50/50 ring-1 ring-red-600/20"
                      >
                        <div className="flex items-center justify-between">
                          <GraduationCap className="w-4 h-4 text-red-700" />
                          <Check className="w-3.5 h-3.5 text-red-700" />
                        </div>
                        <div className="pt-2">
                          <span className="text-xs font-bold text-slate-900 block">Student</span>
                          <span className="text-[10px] text-slate-500 block">Currently studying</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('alumni')}
                        className="p-3 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between border-slate-200 bg-slate-50 hover:bg-slate-100/70"
                      >
                        <div className="flex items-center justify-between">
                          <UserCheck className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="pt-2">
                          <span className="text-xs font-bold text-slate-900 block">Alumni</span>
                          <span className="text-[10px] text-slate-500 block">Graduated from JU</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Informational Banner */}
                  <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200/80 text-[11px] text-blue-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      Your JECRC email (<span className="font-semibold text-blue-950">@jecrcu.edu.in</span>) is used only to verify your student identity. You will use your personal email address to log in after registration.
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Full name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                      }}
                      placeholder="e.g. Tokir Khan"
                      className={`w-full bg-slate-50 border ${
                        errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-600 focus:bg-white'
                      } rounded-md px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors`}
                    />
                    {errors.name && <p className="text-[11px] text-rose-600 font-medium">{errors.name}</p>}
                  </div>

                  {/* Roll Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">University Roll Number *</label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => {
                        setRollNumber(e.target.value.toUpperCase());
                        if (errors.rollNumber) setErrors((prev) => ({ ...prev, rollNumber: null }));
                      }}
                      placeholder="e.g. 24BCON0332 or 25BTECH0332"
                      className={`w-full bg-slate-50 border ${
                        errors.rollNumber ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-600 focus:bg-white'
                      } rounded-md px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors uppercase`}
                    />
                    {errors.rollNumber && <p className="text-[11px] text-rose-600 font-medium">{errors.rollNumber}</p>}
                  </div>

                  {/* Email Grid: Institutional vs Personal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">JECRC Email (Verification) *</label>
                      <input
                        type="email"
                        value={institutionalEmail}
                        onChange={(e) => {
                          setInstitutionalEmail(e.target.value);
                          if (errors.institutionalEmail) setErrors((prev) => ({ ...prev, institutionalEmail: null }));
                        }}
                        placeholder="student@jecrcu.edu.in"
                        className={`w-full bg-slate-50 border ${
                          errors.institutionalEmail ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-600 focus:bg-white'
                        } rounded-md px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors`}
                      />
                      {errors.institutionalEmail && <p className="text-[10px] text-rose-600 font-medium">{errors.institutionalEmail}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">Personal Email (Login Email) *</label>
                      <input
                        type="email"
                        value={personalEmail}
                        onChange={(e) => {
                          setPersonalEmail(e.target.value);
                          if (errors.personalEmail) setErrors((prev) => ({ ...prev, personalEmail: null }));
                        }}
                        placeholder="personal@gmail.com"
                        className={`w-full bg-slate-50 border ${
                          errors.personalEmail ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-600 focus:bg-white'
                        } rounded-md px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors`}
                      />
                      {errors.personalEmail && <p className="text-[10px] text-rose-600 font-medium">{errors.personalEmail}</p>}
                    </div>
                  </div>

                  {/* Mobile & Course Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">Mobile Number *</label>
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => {
                          setMobileNumber(e.target.value);
                          if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: null }));
                        }}
                        placeholder="10-digit mobile number"
                        className={`w-full bg-slate-50 border ${
                          errors.mobileNumber ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-600 focus:bg-white'
                        } rounded-md px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors`}
                      />
                      {errors.mobileNumber && <p className="text-[10px] text-rose-600 font-medium">{errors.mobileNumber}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">Degree / Course *</label>
                      <select
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 focus:border-slate-600 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value="BTECH">BTECH (B.Technology)</option>
                        <option value="BCON">BCON (B.Commerce / Construction)</option>
                        <option value="BCS">BCS (B.Computer Science)</option>
                        <option value="MCA">MCA (Master of Computer App)</option>
                        <option value="MBA">MBA (Master of Business Admin)</option>
                        <option value="BCA">BCA (B.Computer Applications)</option>
                      </select>
                    </div>
                  </div>

                  {/* Academic Years Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">Admission Year *</label>
                      <input
                        type="number"
                        min="2010"
                        max="2030"
                        value={joiningYear}
                        onChange={(e) => {
                          setJoiningYear(e.target.value);
                          if (errors.joiningYear) setErrors((prev) => ({ ...prev, joiningYear: null }));
                        }}
                        placeholder="2024"
                        className={`w-full bg-slate-50 border ${
                          errors.joiningYear ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-600 focus:bg-white'
                        } rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none transition-colors`}
                      />
                      {errors.joiningYear && <p className="text-[10px] text-rose-600 font-medium">{errors.joiningYear}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">Expected Graduation Year *</label>
                      <input
                        type="number"
                        min="2010"
                        max="2035"
                        value={graduationYear}
                        onChange={(e) => {
                          setGraduationYear(e.target.value);
                          if (errors.graduationYear) setErrors((prev) => ({ ...prev, graduationYear: null }));
                        }}
                        placeholder="2028"
                        className={`w-full bg-slate-50 border ${
                          errors.graduationYear ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-600 focus:bg-white'
                        } rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none transition-colors`}
                      />
                      {errors.graduationYear && <p className="text-[10px] text-rose-600 font-medium">{errors.graduationYear}</p>}
                    </div>
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                          }}
                          placeholder="At least 8 chars"
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
                      {errors.password && <p className="text-[10px] text-rose-600 font-medium">{errors.password}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">Confirm Password *</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                        }}
                        placeholder="Repeat password"
                        className={`w-full bg-slate-50 border ${
                          errors.confirmPassword ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-600 focus:bg-white'
                        } rounded-md px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors`}
                      />
                      {errors.confirmPassword && <p className="text-[10px] text-rose-600 font-medium">{errors.confirmPassword}</p>}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-2.5 rounded-md text-xs font-bold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    {isLoading ? (
                      <span>Sending OTP...</span>
                    ) : (
                      <>
                        <span>Verify Student Identity &amp; Send OTP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* STUDENT STEP 2: Enter 6-Digit OTP */
                <form onSubmit={handleStudentVerifyOTP} className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>OTP Verification Sent</span>
                    </div>
                    <p className="leading-relaxed text-[11px]">
                      We sent a 6-digit verification OTP code to your JECRC email: <span className="font-bold underline">{institutionalEmail}</span>.
                    </p>
                    <p className="text-[10px] text-emerald-800">
                      Login email after verification will be: <span className="font-bold">{personalEmail}</span>.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Enter 6-Digit Verification OTP Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, ''));
                        if (errors.otpCode) setErrors((prev) => ({ ...prev, otpCode: null }));
                      }}
                      placeholder="123456"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-red-700 focus:bg-white rounded-lg px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:outline-none"
                    />
                    {errors.otpCode && <p className="text-[11px] text-rose-600 font-medium">{errors.otpCode}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setStudentStep(1)}
                      className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
                    >
                      ← Back to edit information
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-md text-xs font-bold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    {isLoading ? (
                      <span>Verifying OTP...</span>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Verify OTP &amp; Complete Registration</span>
                      </>
                    )}
                  </button>
                </form>
              )
            ) : (
              /* ALUMNI REGISTRATION FORM */
              <form onSubmit={handleAlumniSubmit} className="space-y-3.5">
                {/* Role Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    I am connected to JECRC as:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setRole('student'); setStudentStep(1); }}
                      className="p-3 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between border-slate-200 bg-slate-50 hover:bg-slate-100/70"
                    >
                      <div className="flex items-center justify-between">
                        <GraduationCap className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="pt-2">
                        <span className="text-xs font-bold text-slate-900 block">Student</span>
                        <span className="text-[10px] text-slate-500 block">Currently studying</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('alumni')}
                      className="p-3 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between border-red-600 bg-red-50/50 ring-1 ring-red-600/20"
                    >
                      <div className="flex items-center justify-between">
                        <UserCheck className="w-4 h-4 text-red-700" />
                        <Check className="w-3.5 h-3.5 text-red-700" />
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
                  <label className="text-xs font-semibold text-slate-700 block">Full name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Personal Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Personal Email *</label>
                    <input
                      type="email"
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                      placeholder="alumni@gmail.com"
                      className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Mobile Number *</label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Passout Batch & Company */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Graduation Batch *</label>
                    <input
                      type="number"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      placeholder="2020"
                      className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Company / Organization</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Google"
                      className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Password *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 chars"
                      className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Confirm Password *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 rounded-md text-xs font-bold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                >
                  {isLoading ? 'Submitting Alumni Application...' : 'Register as Alumni'}
                </button>
              </form>
            )}

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
              <GoogleAuthButton
                onSuccess={handleGoogleSuccess}
                onError={(err) => setErrorMessage(err.message || 'Google signup failed.')}
                text="signup_with"
                disabled={isLoading}
              />
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
