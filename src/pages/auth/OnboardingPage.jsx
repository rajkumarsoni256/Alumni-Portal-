import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  GraduationCap, 
  UserCheck, 
  Camera, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  X,
  Upload
} from 'lucide-react';

export const OnboardingPage = ({ defaultRole }) => {
  const navigate = useNavigate();
  const { pendingRegistration, completeUserOnboarding } = useApp();

  const currentRole = defaultRole || pendingRegistration?.role || 'student';
  const isStudent = currentRole === 'student';

  const [step, setStep] = useState(1); // 1: Profile Info | 2: Skills & Preferences | 3: Complete
  const [isLoading, setIsLoading] = useState(false);

  // Profile fields state
  const [name, setName] = useState(pendingRegistration?.name || (isStudent ? 'Tokir Khan' : 'Priya Sharma'));
  const [avatar, setAvatar] = useState(
    isStudent 
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
      : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300'
  );
  const [degree, setDegree] = useState('B.Tech');
  const [branch, setBranch] = useState(isStudent ? 'Computer Science & Engineering (AI-ML)' : 'Computer Science & Engineering');
  const [graduationYear, setGraduationYear] = useState(isStudent ? '2026' : '2018');
  const [headline, setHeadline] = useState(
    isStudent 
      ? 'B.Tech CSE (AI-ML) | 3rd Year • Seeking SDE / AI Internships'
      : 'Senior AI Engineer @ Google | LLMs & Distributed Systems'
  );
  
  // Alumni specific
  const [company, setCompany] = useState(isStudent ? '' : 'Google');
  const [roleTitle, setRoleTitle] = useState(isStudent ? '' : 'Senior AI Engineer');
  const [location, setLocation] = useState(isStudent ? 'Jaipur, Rajasthan' : 'Bengaluru, Karnataka');
  const [isAvailableForMentorship, setIsAvailableForMentorship] = useState(true);

  // Step 2: Skills and Interests
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
      const url = URL.createObjectURL(file);
      setAvatar(url);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setIsLoading(true);
      setTimeout(async () => {
        await completeUserOnboarding({
          name,
          avatar,
          degree,
          branch,
          graduationYear,
          headline,
          company,
          roleTitle,
          location,
          isAvailableForMentorship,
          skills: selectedSkills,
          interests: selectedInterests,
        });
        setIsLoading(false);
        setStep(3);
      }, 500);
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
              <span>Profile</span>
            </div>

            <div className={`h-px w-12 sm:w-16 ${step >= 2 ? 'bg-slate-800' : 'bg-slate-200'}`} />

            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step > 2 ? 'bg-emerald-600 text-white' : step === 2 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
              </div>
              <span>Skills & Topics</span>
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
          
          {/* ============================================================ */}
          {/* STEP 1: Profile Information */}
          {/* ============================================================ */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-slate-900">
                  {isStudent ? 'Tell us about your student journey' : 'Tell us about your career journey'}
                </h1>
                <p className="text-xs text-slate-500">
                  This information will be displayed on your JECRC Community profile.
                </p>
              </div>

              {/* Avatar Upload */}
              <div className="flex items-center gap-4 pt-1">
                <div className="relative group">
                  <img
                    src={avatar}
                    alt="Profile Avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 shadow-2xs"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Change Photo"
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
                    className="text-xs font-semibold text-red-700 hover:underline cursor-pointer block"
                  >
                    Change profile photo
                  </label>
                  <span className="text-[11px] text-slate-400 block">
                    Recommended square JPG or PNG.
                  </span>
                </div>
              </div>

              {/* Form Grid */}
              <div className="space-y-3.5">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    required
                  />
                </div>

                {/* Degree & Branch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Degree / Program
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
                      Graduation Year
                    </label>
                    <select
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    >
                      {[2028, 2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map((yr) => (
                        <option key={yr} value={yr}>Class of {yr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Branch / Specialization
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. Computer Science & Engineering (AI-ML)"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Alumni fields: Company & Role */}
                {!isStudent && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Current Company
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
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={roleTitle}
                        onChange={(e) => setRoleTitle(e.target.value)}
                        placeholder="e.g. Senior AI Engineer"
                        className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Headline */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. B.Tech CSE (AI-ML) | 3rd Year • Seeking SDE Internships"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
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
                  <span>Continue to Skills</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: Skills & Interests */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">
                  Skills & Areas of Interest
                </h2>
                <p className="text-xs text-slate-500">
                  Select your primary technical skills and career interests for community recommendations.
                </p>
              </div>

              {/* Skills Multi-select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  Select Your Skills ({selectedSkills.length} selected)
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

              {/* Interests Multi-select */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800 block">
                  Career Topics & Domains
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allInterests.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-red-700 text-white border-red-700 font-semibold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {interest}
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
                      Allow JECRC students to request 45-minute video sessions for career guidance.
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
                  disabled={isLoading || selectedSkills.length === 0}
                  onClick={handleNextStep}
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
          {step === 3 && (
            <div className="text-center space-y-4 py-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">
                  Welcome to JECRC Community!
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your profile has been created. You are now connected to the JECRC University alumni and student network.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-left flex items-center gap-3">
                <img
                  src={avatar}
                  alt={name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0 space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block truncate">{name}</span>
                  <p className="text-[11px] text-slate-500 truncate">{headline}</p>
                  <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-1.5 py-0.2 rounded inline-block">
                    {isStudent ? 'JECRC Student' : 'JECRC Alumni'}
                  </span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer shadow-2xs"
                >
                  Enter the Community Feed
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
