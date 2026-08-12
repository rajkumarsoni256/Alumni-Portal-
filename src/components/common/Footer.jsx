import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-red-900/40 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/ju-alumni-logo.svg"
                alt="JU ALUMNI Logo"
                className="h-16 w-auto object-contain"
              />
              <div>
                <span className="text-2xl font-black text-white tracking-tight">
                  Alum<span className="text-red-500">Bridge</span>
                </span>
                <span className="text-xs text-red-400 block font-extrabold">
                  Let's Unite, Grow Together
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Connecting JECRC University students with accomplished graduates for 1-on-1 mentorship, career guidance, resume reviews, placement preparation, and industry referrals.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/60 border border-red-800/80 px-3 py-1.5 rounded-full font-bold">
                <ShieldCheck className="w-4 h-4 text-red-400" />
                <span>Verified JECRC Alumni Network</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-white mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="hover:text-red-400 transition-colors">Home</Link></li>
              <li><Link to="/explore" className="hover:text-red-400 transition-colors">Explore Alumni Directory</Link></li>
              <li><Link to="/find-mentor" className="hover:text-red-400 transition-colors">Find a Mentor</Link></li>
              <li><Link to="/events" className="hover:text-red-400 transition-colors">Upcoming JU Events</Link></li>
              <li><Link to="/about" className="hover:text-red-400 transition-colors">About JU Network</Link></li>
            </ul>
          </div>

          {/* User Portals */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-white mb-4">Portals</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/student-dashboard" className="hover:text-red-400 transition-colors">Student Portal</Link></li>
              <li><Link to="/alumni-dashboard" className="hover:text-red-400 transition-colors">Alumni Mentor Hub</Link></li>
              <li><Link to="/admin" className="hover:text-red-400 transition-colors">JU Admin Portal</Link></li>
              <li><Link to="/my-connections" className="hover:text-red-400 transition-colors">My Connections</Link></li>
            </ul>
          </div>

          {/* University Info */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-white mb-4">JECRC University</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>Directorate of Alumni Relations, JECRC University, Vidhani, Sitapura Ext, Jaipur, Rajasthan 303905</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-red-500 shrink-0" />
                <span>alumni@jecrcu.edu.in</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-red-500 shrink-0" />
                <span>+91 141 277 0232</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-footer */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 AlumBridge • JU ALUMNI ASSOCIATION (JECRC University). Let's Unite, Grow Together.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400">Mentorship Guidelines</a>
            <a href="#" className="hover:text-slate-400">JECRC Honor Code</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
