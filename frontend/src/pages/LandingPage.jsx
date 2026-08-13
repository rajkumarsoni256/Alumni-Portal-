import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AlumniCard } from '../components/common/AlumniCard';
import { 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  Target, 
  ArrowRight, 
  Search, 
  CheckCircle2, 
  Briefcase, 
  Calendar, 
  MessageSquare,
  Sparkles,
  Award
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { alumniList, setSelectedInterests } = useApp();

  const featuredAlumni = alumniList.slice(0, 3);

  const handleDomainClick = (domain) => {
    setSelectedInterests([domain]);
    navigate('/find-mentor');
  };

  return (
    <div className="min-h-screen bg-slate-100/75 py-6 sm:py-8 space-y-12">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 space-y-12">
        
        {/* ============================================================ */}
        {/* 1. HERO SECTION */}
        {/* ============================================================ */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-10 lg:p-12 shadow-2xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content (7 Cols) */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-semibold">
                <img
                  src="/ju-alumni-logo.jpg"
                  alt="JECRC Alumni"
                  className="h-4 w-4 object-contain rounded"
                />
                <span>JECRC Alumni Association • Official Community</span>
              </div>

              {/* Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Where the JECRC network <span className="text-red-700">grows together.</span>
              </h1>

              {/* Subheading */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
                Connect with thousands of JECRC students and accomplished alumni. Discover 1-on-1 career mentorship, off-campus placement referrals, and technical discussions.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center justify-center gap-2 shadow-2xs"
                >
                  <span>Join the Community</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/login"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-md text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <span>Sign In</span>
                </Link>
              </div>

              {/* Trust Metrics */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Verified Graduates</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Free 1-on-1 Mentorship</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tier-1 Tech Referrals</span>
                </div>
              </div>
            </div>

            {/* Right Card (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-xl border border-slate-800 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Featured Network Spotlight</span>
                <h3 className="text-sm font-bold text-white">Alumni at Leading Tech Firms</h3>
              </div>

              <div className="space-y-2.5 divide-y divide-slate-800 text-xs">
                {featuredAlumni.map((alum) => (
                  <div key={alum.id} className="pt-2.5 first:pt-0 flex items-start gap-2.5">
                    <img
                      src={alum.avatar}
                      alt={alum.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 space-y-0.5">
                      <span className="font-bold text-white block truncate">{alum.name}</span>
                      <p className="text-[11px] text-slate-400 truncate">{alum.currentRole} @ {alum.company}</p>
                      <span className="text-[10px] text-slate-500 block">JECRC Class of {alum.graduationYear}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">1,890+ Verified JU Alumni</span>
                <Link to="/explore" className="text-red-400 font-semibold hover:underline">
                  Browse Directory →
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. WHY JECRC COMMUNITY (3 PILLARS) */}
        {/* ============================================================ */}
        <section className="space-y-4">
          <div className="text-center space-y-1 max-w-xl mx-auto">
            <h2 className="text-lg font-bold text-slate-900">
              Why JECRC Community?
            </h2>
            <p className="text-xs text-slate-500">
              Built exclusively for JECRC University students and alumni to accelerate careers and foster lifelong connections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <Users className="w-4 h-4 text-red-700" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">1-on-1 Mentorship</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Book direct 45-minute video sessions with senior software engineers, researchers, and product managers graduated from JECRC.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <Target className="w-4 h-4 text-red-700" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Placement Preparation</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Prepare for technical coding interviews, system design rounds, and resume screenings with mentors who walked the same campus halls.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Verified Alumni Network</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Every alumni profile is officially verified by the Directorate of Alumni Relations at JECRC University.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. STUDENT & ALUMNI VALUE COMPARISON */}
        {/* ============================================================ */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* For Students */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-red-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">For Students</h3>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Get Ahead in Your Placement Journey</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>1-on-1 mock interviews and resume reviews with industry veterans.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Off-campus job and internship referrals posted directly by alumni.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Explore student project collaborations and participate in campus hackathons.</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link
                to="/register"
                className="text-xs font-semibold text-red-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Register as Student</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* For Alumni */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-red-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">For Alumni</h3>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Give Back & Reconnect with Your Alma Mater</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Mentor talented students and guide the next generation of engineers.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Hire top JECRC talent and post company job referrals.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Network with fellow alumni across global tech chapters and annual mixers.</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link
                to="/register"
                className="text-xs font-semibold text-red-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Join as Alumni Mentor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. FINAL CALL TO ACTION */}
        {/* ============================================================ */}
        <section className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-2xs">
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-900">
              Ready to connect with the JECRC network?
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Join students and alumni already growing their careers together on JECRC Community.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Link
              to="/register"
              className="px-6 py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <span>Create Your Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/login"
              className="px-5 py-2.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};
