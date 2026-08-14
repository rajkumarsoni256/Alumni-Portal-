import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { userService } from '../services/userService';
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
  Award,
  Loader2
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { setSelectedInterests } = useApp();
  const [featuredAlumni, setFeaturedAlumni] = useState([]);
  const [isLoadingAlumni, setIsLoadingAlumni] = useState(true);

  useEffect(() => {
    const fetchFeaturedAlumni = async () => {
      setIsLoadingAlumni(true);
      try {
        const res = await userService.getUsers({ role: 'ALUMNI', limit: 3 });
        const mappedUsers = (res.users || []).map((u) => ({
          id: u.userId || u.id,
          userId: u.userId || u.id,
          name: u.fullName || (u.email ? u.email.split('@')[0] : 'Alumni Member'),
          email: u.email,
          currentRole: u.designation || 'Software Engineer',
          company: u.company || 'Industry Leader',
          graduationYear: u.graduationYear || 2020,
          degree: u.degree || 'B.Tech',
          branch: u.branch || 'CSE',
          location: u.location || 'Jaipur, India',
          avatar: u.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
          skills: u.skills ? u.skills.split(',').map((s) => s.trim()) : ['System Design', 'Mentorship'],
          isAvailableForMentorship: true,
        }));
        setFeaturedAlumni(mappedUsers);
      } catch (err) {
        setFeaturedAlumni([]);
      } finally {
        setIsLoadingAlumni(false);
      }
    };

    fetchFeaturedAlumni();
  }, []);

  const handleDomainClick = (domain) => {
    setSelectedInterests([domain]);
    navigate('/find-mentor');
  };

  return (
    <div className="min-h-screen bg-slate-100/75 py-6 sm:py-8 space-y-12">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 space-y-12">
        
        {/* HERO SECTION */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-10 lg:p-12 shadow-2xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-red-700 bg-red-50 border border-red-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Official JECRC Alumni & Student Network</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Connect with Distinguished Alumni, Accelerate Your Tech Career
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Bridge the gap between campus learning and industry excellence. Get 1-on-1 mentorship, resume reviews, referral requests, and placement guidance from verified JECRC graduates working worldwide.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors shadow-2xs inline-flex items-center gap-2"
                >
                  <span>Join JECRC Network</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/explore"
                  className="px-5 py-2.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                  <span>Browse Alumni Directory</span>
                </Link>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs text-slate-600">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">10,000+</span>
                  <span className="text-slate-500 text-[11px]">Active Alumni</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm block">500+</span>
                  <span className="text-slate-500 text-[11px]">Global Tech Firms</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm block">100%</span>
                  <span className="text-slate-500 text-[11px]">Free Mentorship</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Why Join?</span>
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Direct 1-on-1 mentorship with senior engineers & PMs</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Exclusive referral opportunities & job board</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Campus placement webinars & resume feedback</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* FEATURED ALUMNI MENTORS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Featured Verified Alumni</h2>
              <p className="text-xs text-slate-500">Connect with distinguished graduates leading tech teams worldwide.</p>
            </div>

            <Link
              to="/explore"
              className="text-xs font-semibold text-red-700 hover:text-red-800 inline-flex items-center gap-1"
            >
              <span>View All Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoadingAlumni ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-2xs space-y-2">
              <Loader2 className="w-6 h-6 text-red-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Loading verified JECRC alumni...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredAlumni.map((alum) => (
                <AlumniCard key={alum.id} alumni={alum} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};
