import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Users, Target, Award, Sparkles, ArrowRight } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-1.5 rounded-full text-xs font-black border border-red-200">
          <GraduationCap className="w-4 h-4 text-red-600" />
          <span>JECRC University Alumni Association</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Empowering JU Students Through Lifelong Alumni Connection
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          AlumBridge was established by JECRC University, Jaipur to bridge the gap between academic learning and real-world placement success by connecting undergraduate students with distinguished university graduates.
        </p>
      </div>

      {/* Core Values Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-red-300 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">1-on-1 Mentorship</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Direct access to senior engineers, product managers, data scientists, and executives who walked the same JECRC campus halls.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-red-300 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Targeted Placement Guidance</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Resume reviews, mock technical interviews, system design practice, and referral assistance for tier-1 global tech companies.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-red-300 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Verified Network Trust</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every alumnus on AlumBridge is officially verified by the Directorate of Alumni Relations at JECRC University.
          </p>
        </div>
      </div>

      {/* University Mission Banner */}
      <div className="gradient-red-card text-white rounded-3xl p-10 sm:p-14 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <span className="text-xs font-black uppercase tracking-wider text-red-300">JECRC Mission</span>
          <h2 className="text-3xl font-black text-white">
            Transforming Every JU Student’s Placement Potential
          </h2>
          <p className="text-slate-200 text-sm leading-relaxed">
            We believe no JECRC student should navigate their placement journey alone. By fostering meaningful, structured alumni mentorship, we empower every student to discover their true path and thrive.
          </p>
        </div>

        <div className="pt-2 relative z-10">
          <Link
            to="/find-mentor"
            className="px-8 py-3.5 bg-white text-red-950 font-black rounded-xl text-xs hover:bg-slate-100 transition-all inline-flex items-center gap-2 shadow-lg"
          >
            <span>Find a Mentor Today</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
