import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  GraduationCap, 
  UserCheck, 
  Camera, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  User
} from 'lucide-react';

export const OnboardingPage = ({ defaultRole }) => {
  const navigate = useNavigate();
  const { user: currentUser, activeRole, pendingRegistration, completeUserOnboarding } = useApp();

  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN' || activeRole === 'admin';
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const pathRole = window.location.pathname.includes('/alumni') ? 'alumni' : (window.location.pathname.includes('/student') ? 'student' : null);
  const rawRole = currentUser?.role || pendingRegistration?.role || pathRole || defaultRole || 'student';
  const userRole = String(rawRole).toLowerCase();
  const isStudent = userRole === 'student';

  const [step, setStep] = useState(1); // 1: Profile & Academic/Work | 2: Skills & Links | 3: Complete
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Personal
  const [fullName, setFullName] = useState(currentUser?.fullName || pendingRegistration?.name || '');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || currentUser?.avatar || '');
  const [bio, setBio] = useState('');

  // Academic
  const [degree, setDegree] = useState('B.Tech');
  const [branch, setBranch] = useState(isStudent ? 'Computer Science & Engineering (AI-ML)' : 'Computer Science & Engineering');
  const [graduationYear, setGraduationYear] = useState(isStudent ? '2026' : '2020');
  const [currentYear, setCurrentYear] = useState('3'); // 1, 2, 3, 4 for Students

  // Professional (Alumni Required)
  const [company, setCompany] = useState(isStudent ? '' : 'Google');
  const [designation, setDesignation] = useState(isStudent ? '' : 'Software Development Engineer');
  const [location, setLocation] = useState(isStudent ? 'Jaipur, Rajasthan' : 'Bengaluru, Karnataka');
  const [isAvailableForMentorship, setIsAvailableForMentorship] = useState(true);

  // Social Links
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  // Skills & Topics
  const allSkills = [
    'Data Structures & Algorithms',
    'Python & PyTorch',
    'React.js & Tailwind CSS',
    'Machine Learning & LLMs',
    'Node.js & Express',
    'PostgreSQL & SQL',
    'System Design',
    'Cloud Architecture (GCP/AWS)',
    'Java & Spring Boot',
    'Cybersecurity',
    'DevOps & Docker',
  ];

  const allInterests = [
    'Software Engineering',
    'AI & Machine Learning',
    'Data Science & Analytics',
    'Product Management',
    'Cloud & Distributed Systems',
    'Open Source Development',
    'Technical Interview Prep',
  ];

  const [selectedSkills, setSelectedSkills] = useState(
    isStudent 
      ? ['Data Structures & Algorithms', 'Python & PyTorch', 'React.js & Tailwind CSS']
      : ['System Design', 'Machine Learning & LLMs', 'Cloud Architecture (GCP/AWS)']
  );

  const [selectedInterests, setSelectedInterests] = useState([
    'Software Engineering',
    'AI & Machine Learning',
  ]);

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    setErrorMessage('');
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return false;
    }
    if (!avatarUrl || !avatarUrl.trim() || avatarUrl.includes('unsplash')) {
      setErrorMessage('Profile photo is mandatory. Please upload your profile photo to continue.');
      return false;
    }
    if (!phone.trim()) {
      setErrorMessage('Please enter your mobile phone number.');
      return false;
    }
    if (!degree.trim()) {
      setErrorMessage('Please select or specify your degree.');
      return false;
    }
    if (!branch.trim()) {
      setErrorMessage('Please enter your branch / specialization.');
      return false;
    }
    if (!graduationYear) {
      setErrorMessage('Please select your graduation year.');
      return false;
    }

    if (!isStudent) {
      if (!company.trim()) {
        setErrorMessage('Current company name is required for Alumni onboarding.');
        return false;
      }
      if (!designation.trim()) {
        setErrorMessage('Current job role / designation is required for Alumni onboarding.');
        return false;
      }
      if (!location.trim()) {
        setErrorMessage('Current location is required for Alumni onboarding.');
        return false;
      }
    }

    return true;
  };

  const validateStep2 = () => {
    setErrorMessage('');
    if (!isStudent) {
      if (!linkedinUrl.trim()) {
        setErrorMessage('LinkedIn profile URL is required for Alumni onboarding.');
        return false;
      }
      if (!linkedinUrl.toLowerCase().startsWith('http://') && !linkedinUrl.toLowerCase().startsWith('https://')) {
        setErrorMessage('LinkedIn URL must start with http:// or https://');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    }
  };

  const handleSubmitOnboarding = async () => {
    if (!validateStep2()) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      await completeUserOnboarding({
        fullName,
        phone,
        avatarUrl,
        bio,
        degree,
        branch,
        graduationYear,
        currentYear: isStudent ? currentYear : null,
        currentAcademicYear: isStudent ? currentYear : null,
        company: isStudent ? null : company,
        designation: isStudent ? null : designation,
        location,
        isAvailableForMentorship,
        linkedinUrl,
        githubUrl,
        skills: selectedSkills,
        interests: selectedInterests,
      });
      setStep(3);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit onboarding profile. Please check required fields.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-100/75 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {/* Step Progress Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-md mx-auto text-xs">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step > 1 ? 'bg-emerald-600 text-white' : step === 1 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              </div>
              <span>{isStudent ? 'Student Profile' : 'Alumni Profile'}</span>
            </div>

            <div className={`h-px w-12 sm:w-16 ${step >= 2 ? 'bg-slate-800' : 'bg-slate-200'}`} />

            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step > 2 ? 'bg-emerald-600 text-white' : step === 2 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
              </div>
              <span>Skills & Links</span>
            </div>

            <div className={`h-px w-12 sm:w-16 ${step === 3 ? 'bg-slate-800' : 'bg-slate-200'}`} />

            <div className={`flex items-center gap-2 ${step === 3 ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step === 3 ? <Check className="w-3.5 h-3.5" /> : '3'}
              </div>
              <span>Complete</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-snug">{errorMessage}</p>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: Personal & Academic/Work Information */}
          {/* ============================================================ */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {isStudent ? (
                    <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200 uppercase tracking-wider">
                      Student Onboarding
                    </span>
                  ) : (
                    <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Alumni Onboarding
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  {isStudent ? 'Tell us about your academic details' : 'Tell us about your professional journey'}
                </h1>
                <p className="text-xs text-slate-500">
                  {isStudent 
                    ? 'Fill out your student information to access mentors and JECRC events.'
                    : 'Required fields ensure the JECRC alumni directory stays verified and useful for students.'
                  }
                </p>
              </div>

              {/* Avatar Upload (Mandatory) */}
              <div className="flex items-center gap-4 pt-1">
                <div className="relative group">
                  {avatarUrl && !avatarUrl.includes('unsplash') ? (
                    <img
                      src={avatarUrl}
                      alt="Profile Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-red-200 shadow-2xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-dashed border-red-300 text-slate-400 flex items-center justify-center">
                      <User className="w-8 h-8" />
                    </div>
                  )}

                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Upload Photo"
                  >
                    <Camera className="w-5 h-5" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <div className="space-y-0.5">
                  <label
                    htmlFor="avatar-upload"
                    className="text-xs font-bold text-slate-800 hover:text-red-700 cursor-pointer block"
                  >
                    Upload profile photo <span className="text-red-600">* Required</span>
                  </label>
                  <span className="text-[11px] text-slate-500 block">
                    Mandatory for verified directory profile. Recommended square JPG or PNG.
                  </span>
                </div>
              </div>

              {/* Form Grid */}
              <div className="space-y-3.5">
                {/* Full Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Full name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Tokir Khan"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Mobile Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Degree & Branch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Degree / Program <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    >
                      <option value="B.Tech">B.Tech</option>
                      <option value="BCA">BCA</option>
                      <option value="MCA">MCA</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="BBA">BBA</option>
                      <option value="MBA">MBA</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Branch / Specialization <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. Computer Science & Engineering"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Graduation Year & Current Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      {isStudent ? 'Expected Graduation Year' : 'Graduation / Passout Year'} <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    >
                      {[2028, 2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2010].map((yr) => (
                        <option key={yr} value={yr}>Class of {yr}</option>
                      ))}
                    </select>
                  </div>

                  {isStudent ? (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Current Academic Year <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={currentYear}
                        onChange={(e) => setCurrentYear(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                      >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Current Location <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Bengaluru, Karnataka or New York, USA"
                        className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Alumni Professional Section */}
                {!isStudent && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Current Company <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. Google, Microsoft, Amazon"
                        className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Job Title / Designation <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Bio / About */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Short Bio (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={isStudent ? 'Passionate about web development and AI...' : 'Building scalable distributed systems...'}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Next CTA */}
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Continue to Links & Skills</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: Links & Skills */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">
                  Professional Links & Skills
                </h2>
                <p className="text-xs text-slate-500">
                  {isStudent
                    ? 'Connect your professional links and highlight skills to get noticed by alumni.'
                    : 'LinkedIn URL is required for alumni verification and networking.'
                  }
                </p>
              </div>

              {/* Professional Links */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    LinkedIn Profile URL {!isStudent && <span className="text-red-600">*</span>}
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    GitHub Profile URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/yourusername"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Skills Multi-select */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800 block">
                  Select Your Primary Skills ({selectedSkills.length} selected)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allSkills.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Alumni Mentorship Toggle */}
              {!isStudent && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block">
                      Available for 1-on-1 Mentorship
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Allow JECRC students to request mentorship and career guidance sessions.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAvailableForMentorship}
                    onChange={(e) => setIsAvailableForMentorship(e.target.checked)}
                    className="w-4 h-4 text-red-700 rounded focus:ring-red-600 cursor-pointer"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3.5 py-2 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleSubmitOnboarding}
                  className="px-5 py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  {isLoading ? (
                    <span>Completing Setup...</span>
                  ) : (
                    <>
                      <span>Complete Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: Complete Screen */}
          {/* ============================================================ */}
          {/* STEP 3: Complete Screen */}
          {/* ============================================================ */}
          {step === 3 && (
            <div className="text-center space-y-4 py-4 max-w-md mx-auto">
              {isStudent ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-900">
                      Welcome to JU Connect!
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Your JECRC institutional email (@jecrcu.edu.in) has been verified. Your profile is complete and ready.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-900">
                      Alumni Application Submitted!
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Your Alumni account request has been sent to JECRC Administration for approval.
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left space-y-2 text-xs text-amber-900">
                    <div className="flex items-center gap-2 font-bold text-amber-800">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Pending Admin Verification</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      JECRC Administration will review your graduation batch ({graduationYear}) and company details. You will receive an email notification once your alumni account is verified!
                    </p>
                  </div>
                </>
              )}

              {/* Summary Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-left flex items-center gap-3">
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0 space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block truncate">{fullName}</span>
                  <p className="text-[11px] text-slate-500 truncate">
                    {isStudent 
                      ? `${degree} ${branch} • Class of ${graduationYear}`
                      : `${designation || 'Alumni Member'} @ ${company || 'JECRC Graduate'}`
                    }
                  </p>
                  <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-1.5 py-0.2 rounded inline-block">
                    {isStudent ? 'JECRC Student' : 'JECRC Alumni (Pending Review)'}
                  </span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer shadow-2xs"
                >
                  {isStudent ? 'Enter Portal Dashboard' : 'Explore Community & View Status'}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
