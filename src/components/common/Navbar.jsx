import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  Menu, 
  X, 
  LayoutDashboard,
  MessageSquare
} from 'lucide-react';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { activeRole } = useApp();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Explore Alumni', path: '/explore' },
    { name: 'Find a Mentor', path: '/find-mentor' },
    { name: 'Events', path: '/events' },
    { name: 'About JU Network', path: '/about' },
  ];

  const getDashboardPath = () => {
    if (activeRole === 'student') return '/student-dashboard';
    if (activeRole === 'alumni') return '/alumni-dashboard';
    return '/admin';
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 glass-nav shadow-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* OFFICIAL JU ALUMNI CREST BRAND LOGO */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <img
            src="/ju-alumni-logo.svg"
            alt="JU ALUMNI • Let's Unite, Grow Together"
            className="h-14 sm:h-16 w-auto object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-200"
          />
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-slate-900">
                Alum<span className="text-red-600">Bridge</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200">
                JECRC
              </span>
            </div>
            <span className="text-[11px] text-red-600 font-extrabold block -mt-1 tracking-tight">
              Let's Unite, Grow Together
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-red-50/80 p-1.5 rounded-full border border-red-100/90 shadow-2xs">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`px-4 py-2 rounded-full text-xs font-black transition-all duration-200 ${
                  active
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-red-700 hover:bg-white/80'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {activeRole === 'student' && (
            <Link
              to="/my-connections"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-red-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:border-red-200 transition-colors shadow-2xs"
            >
              <MessageSquare className="w-4 h-4 text-red-600" />
              <span>Connections</span>
            </Link>
          )}

          <Link
            to={getDashboardPath()}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-red-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:border-red-200 transition-colors shadow-2xs"
          >
            <LayoutDashboard className="w-4 h-4 text-red-600" />
            <span className="capitalize">{activeRole} Portal</span>
          </Link>
          
          <Link
            to="/find-mentor"
            className="gradient-accent-red text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-1.5"
          >
            <span>Find Mentor</span>
            <Sparkles className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-slate-700 hover:text-red-600 hover:bg-red-50"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-red-600" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-red-100 px-4 pt-2 pb-6 space-y-3 shadow-xl">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-black transition-colors ${
                  isActive(link.path)
                    ? 'bg-red-50 text-red-700 font-extrabold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to={getDashboardPath()}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center font-extrabold text-slate-800 bg-slate-100 rounded-xl text-xs"
            >
              Dashboard ({activeRole})
            </Link>
            <Link
              to="/find-mentor"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center font-black text-white gradient-accent-red rounded-xl shadow-sm text-xs"
            >
              Find Your Mentor
            </Link>
          </div>
        </div>
      )}

    </header>
  );
};
