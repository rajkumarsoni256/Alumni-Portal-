import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getPortalHomePath } from '../../utils/navigation';

export const Footer = () => {
  const { activeRole } = useApp();

  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-100">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-3">
            <Link to={getPortalHomePath(activeRole)} className="flex items-center gap-2.5">
              <img
                src="/ju-alumni-logo.jpg"
                alt="JU Connect Logo"
                className="h-9 w-9 object-cover rounded-lg border border-slate-200"
              />
              <div>
                <span className="text-base font-bold text-slate-900 tracking-tight">
                  JU <span className="text-red-700">Connect</span>
                </span>
                <span className="text-[11px] text-slate-500 block font-medium">
                  Alumni Association
                </span>
              </div>
            </Link>

            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              Connecting JECRC University students with graduates for professional networking, mentorship, placement preparation, and alumni opportunities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-red-700 transition-colors">Community Feed</Link></li>
              <li><Link to="/explore" className="hover:text-red-700 transition-colors">Explore Alumni</Link></li>
              <li><Link to="/find-mentor" className="hover:text-red-700 transition-colors">Find a Mentor</Link></li>
              <li><Link to="/events" className="hover:text-red-700 transition-colors">Campus Events</Link></li>
              <li><Link to="/about" className="hover:text-red-700 transition-colors">About Network</Link></li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Portals</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/student-dashboard" className="hover:text-red-700 transition-colors">Student Portal</Link></li>
              <li><Link to="/alumni-dashboard" className="hover:text-red-700 transition-colors">Alumni Dashboard</Link></li>
              <li><Link to="/admin" className="hover:text-red-700 transition-colors">Administration</Link></li>
              <li><Link to="/messages" className="hover:text-red-700 transition-colors">Direct Messages</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">JECRC University</h4>
            <ul className="space-y-2.5 text-xs text-slate-500">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>Directorate of Alumni Relations, JECRC University, Jaipur 303905</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>alumni@jecrcu.edu.in</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>+91 141 277 0232</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-footer */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} JECRC Community • JECRC Alumni Association.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600">Terms of Service</a>
            <a href="#" className="hover:text-slate-600">Honor Code</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
