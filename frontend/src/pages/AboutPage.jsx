import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Users, Target, ArrowRight, MapPin, Mail, Phone } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="min-h-screen bg-slate-100/75 py-6">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 space-y-6">
        
        {/* Header Title */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
              Directorate of Alumni Relations
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            JECRC Community & Alumni Network
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
            The official digital community established by JECRC University, Jaipur to bridge the gap between academic learning and industry success through structured alumni mentorship, job referrals, and career discussions.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <Users className="w-4 h-4 text-red-700" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">1-on-1 Mentorship</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct access to senior engineers, data scientists, and leaders graduated from JECRC.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <Target className="w-4 h-4 text-red-700" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Placement Preparation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Resume reviews, technical mock interviews, and referral guidance for top product companies.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Verified Network</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every alumnus profile is verified by the Directorate of Alumni Relations at JECRC University.
            </p>
          </div>
        </div>

        {/* Contact Directorate */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Alumni Relations Office
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>JECRC University, Vidhani, Sitapura Ext, Jaipur 303905</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>alumni@jecrcu.edu.in</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>+91 141 277 0232</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
