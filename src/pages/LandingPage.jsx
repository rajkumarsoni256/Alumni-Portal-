import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AlumniCard } from '../components/common/AlumniCard';
import { 
  Sparkles, 
  Search, 
  UserCheck, 
  Calendar, 
  MessageSquare, 
  Briefcase, 
  ArrowRight, 
  CheckCircle, 
  Shield, 
  GraduationCap, 
  Award,
  Users,
  Target,
  TrendingUp,
  Star
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { alumniList, events, setSelectedInterests } = useApp();

  const handleDomainClick = (domain) => {
    setSelectedInterests([domain]);
    navigate('/find-mentor');
  };

  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-10 pb-20 lg:pt-16 lg:pb-28 bg-gradient-to-b from-red-50/80 via-white to-slate-50">
        {/* Glow backdrop blobs with keyframe pulse animation */}
        <div className="hero-red-glow bg-red-600 w-[550px] h-[550px] -top-24 -left-24" />
        <div className="hero-red-glow bg-rose-500 w-[450px] h-[450px] top-40 right-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* JU Alumni Crest Badge Banner */}
              <div className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border-2 border-red-200 shadow-md animate-float">
                <img
                  src="/ju-alumni-logo.svg"
                  alt="JU ALUMNI Logo"
                  className="w-10 h-10 object-contain"
                />
                <div className="text-left">
                  <span className="text-xs font-black text-red-900 block leading-tight">JU ALUMNI ASSOCIATION</span>
                  <span className="text-[10px] font-extrabold text-red-600 tracking-wide uppercase">Let's Unite, Grow Together</span>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
                Connect with JU Alumni.{' '}
                <span className="gradient-text-red">Build Your Future.</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Bridge the gap between campus and career. Connect with experienced JECRC graduates for 1-on-1 mentorship, career advice, resume reviews, project feedback, and placement prep.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/find-mentor"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-extrabold text-white gradient-accent-red shadow-xl shadow-red-500/30 hover:shadow-red-500/45 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Find Your Mentor</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/explore"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-extrabold text-slate-900 bg-white border-2 border-red-600/30 hover:border-red-600 hover:bg-red-50/60 shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5 text-red-600" />
                  <span>Explore Alumni Directory</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-red-600" />
                  <span>100% Verified JU Graduates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-red-600" />
                  <span>Free 1-on-1 Mentorship</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-red-600" />
                  <span>Direct Campus Placement Prep</span>
                </div>
              </div>
            </div>

            {/* Right Hero Graphic Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Main Highlight Card */}
                <div className="glass-card rounded-3xl p-6 shadow-2xl space-y-5 border-2 border-red-100/90 animate-float">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
                        alt="Priya Sharma"
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-red-600 shadow-md"
                      />
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">Priya Sharma</h4>
                        <p className="text-xs font-bold text-red-600">Senior AI Engineer @ Google</p>
                        <p className="text-[11px] text-slate-500 font-semibold">JECRC CS Class of 2018</p>
                      </div>
                    </div>
                    <span className="bg-red-50 text-red-700 text-xs font-black px-3 py-1 rounded-full border border-red-200 shadow-2xs">
                      98% Match
                    </span>
                  </div>

                  <div className="bg-red-50/80 p-3.5 rounded-2xl border border-red-100 space-y-1">
                    <span className="text-xs font-black text-red-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-red-600" />
                      Mentorship Opportunity
                    </span>
                    <p className="text-xs text-slate-700 leading-snug">
                      "Offering mock technical interviews & resume feedback for JECRC CSE students targeting Google, Microsoft & AI roles."
                    </p>
                  </div>

                  <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
                    <span className="font-semibold">⚡ Responds within 24 hours</span>
                    <Link
                      to="/alumni/alm_1"
                      className="font-extrabold text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <span>View Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Floating Stat Badge */}
                <div className="absolute -bottom-6 -left-6 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800 hidden sm:flex">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
                  </div>
                  <div>
                    <p className="text-sm font-black">4.9 / 5.0 Rating</p>
                    <p className="text-[11px] text-slate-400">1,240+ JU Mentorship Sessions</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. PLATFORM STATISTICS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-red-950 to-slate-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-red-900/40">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-red-900/40">
            <div className="space-y-1">
              <p className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-300">
                1,890+
              </p>
              <p className="text-sm font-extrabold text-slate-200">Verified JU Alumni Mentors</p>
              <p className="text-xs text-slate-400">Across 12+ Global Tech Hubs</p>
            </div>

            <div className="space-y-1 pt-6 lg:pt-0">
              <p className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-300">
                4,250+
              </p>
              <p className="text-sm font-extrabold text-slate-200">Active JECRC Students</p>
              <p className="text-xs text-slate-400">Pursuing B.Tech, B.Des & MBA</p>
            </div>

            <div className="space-y-1 pt-6 lg:pt-0">
              <p className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-300">
                1,240+
              </p>
              <p className="text-sm font-extrabold text-slate-200">Mentorship Sessions</p>
              <p className="text-xs text-slate-400">1-on-1 Sessions Conducted</p>
            </div>

            <div className="space-y-1 pt-6 lg:pt-0">
              <p className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                94%
              </p>
              <p className="text-sm font-extrabold text-slate-200">Placement Success Rate</p>
              <p className="text-xs text-slate-400">Mentored Students Placed</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW ALUMBRIDGE WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-wider text-red-600 bg-red-50 px-3.5 py-1 rounded-full border border-red-200">
            Simple 4-Step Journey
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            How AlumBridge Powers JU Students
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            From discovering your ideal alumni mentor to booking your first 1-on-1 placement guidance session.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative space-y-4 hover:border-red-400 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 font-black text-lg flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
              01
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">Select Career Interests</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Choose your domain, career goals, target companies, and areas where you need guidance.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative space-y-4 hover:border-red-400 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 font-black text-lg flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
              02
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">Smart Mentor Match</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our matching algorithm suggests alumni based on skills, company experience, and match score.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative space-y-4 hover:border-red-400 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 font-black text-lg flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
              03
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">Request Session</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Submit your request specifying meeting objectives, resume review needs, or mock interview prep.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative space-y-4 hover:border-red-400 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 font-black text-lg flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
              04
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">Connect & Excel</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Meet online or on campus, receive actionable feedback, and build a lifelong professional network.
            </p>
          </div>

        </div>
      </section>

      {/* 4. CAREER DOMAINS */}
      <section className="bg-red-50/50 py-16 border-y border-red-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-red-600">
                Explore Specializations
              </span>
              <h2 className="text-3xl font-black text-slate-900 mt-1">
                Explore Popular Career Domains
              </h2>
            </div>
            <Link
              to="/find-mentor"
              className="text-sm font-extrabold text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <span>View All Mentors</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: "AI & Machine Learning", icon: Sparkles, count: "140+ Alumni" },
              { name: "Web Development", icon: Target, count: "210+ Alumni" },
              { name: "Data Science", icon: TrendingUp, count: "115+ Alumni" },
              { name: "Cyber Security", icon: Shield, count: "80+ Alumni" },
              { name: "Cloud Computing", icon: Users, count: "95+ Alumni" },
              { name: "UI/UX Design", icon: Award, count: "75+ Alumni" },
              { name: "Product Management", icon: Briefcase, count: "110+ Alumni" },
              { name: "Finance & Venture", icon: GraduationCap, count: "90+ Alumni" },
            ].map((domain, idx) => {
              const Icon = domain.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleDomainClick(domain.name)}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-red-500 hover:shadow-md transition-all text-left group flex flex-col justify-between"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-red-600 transition-colors">
                      {domain.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{domain.count}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. FEATURED ALUMNI */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-red-600">
              JU Industry Leaders
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-1">
              Featured Alumni Mentors
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Connect with top JECRC graduates working at global technology firms.
            </p>
          </div>

          <Link
            to="/explore"
            className="text-sm font-extrabold text-red-600 hover:text-red-800 flex items-center gap-1.5"
          >
            <span>Browse Full Directory</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {alumniList.slice(0, 3).map((alumni) => (
            <AlumniCard key={alumni.id} alumni={alumni} showMatchReasons={true} />
          ))}
        </div>
      </section>

      {/* 6. UPCOMING EVENTS */}
      <section className="bg-slate-950 text-white py-16 border-y border-red-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-red-400">
                JECRC Campus & Virtual Sessions
              </span>
              <h2 className="text-3xl font-black text-white mt-1">
                Upcoming Alumni Workshops & Talks
              </h2>
            </div>
            <Link
              to="/events"
              className="text-sm font-extrabold text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <span>View All Events</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.slice(0, 2).map((evt) => (
              <div
                key={evt.id}
                className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="bg-red-950/80 text-red-300 px-3 py-1 rounded-full border border-red-800 font-black uppercase tracking-wider">
                      {evt.category}
                    </span>
                    <span className="text-slate-400 font-semibold">{evt.date} • {evt.time}</span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white">{evt.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{evt.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={evt.speakerAvatar}
                      alt={evt.speaker}
                      className="w-10 h-10 rounded-full object-cover border border-red-500/50"
                    />
                    <div className="text-xs">
                      <p className="font-extrabold text-white">{evt.speaker}</p>
                      <p className="text-slate-400">{evt.location}</p>
                    </div>
                  </div>

                  <Link
                    to="/events"
                    className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-md"
                  >
                    Register
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. STUDENT TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-wider text-red-600">
            JECRC Placement Impact Stories
          </span>
          <h2 className="text-3xl font-black text-slate-900">
            What JU Students Say About AlumBridge
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote: "Priya's mock technical interview was the exact reason I cracked the Google SSE intern offer! She pointed out my resume weaknesses and gave me system design tips.",
              name: "Raj Kumar",
              role: "JU B.Tech CSE '26",
              company: "Placed @ Google (Intern)"
            },
            {
              quote: "Arjun helped me review my React project portfolio. His architectural advice gave me immense confidence during my Stripe interview process.",
              name: "Sneha Kapadia",
              role: "JU B.Tech IT '25",
              company: "Placed @ Stripe"
            },
            {
              quote: "The 1-on-1 placement guidance with JU alumni gave me clarity on choosing between Product Management and Data Science. Truly priceless!",
              name: "Vikrant Singh",
              role: "JU MBA Class of '25",
              company: "Placed @ Microsoft"
            }
          ].map((t, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:border-red-200 transition-colors">
              <div className="space-y-3">
                <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="font-extrabold text-slate-900 text-sm">{t.name}</h4>
                <p className="text-xs text-slate-500 font-semibold">{t.role} • <span className="font-extrabold text-emerald-600">{t.company}</span></p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. CALL-TO-ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="gradient-red-card text-white rounded-3xl p-10 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="hero-red-glow bg-rose-500 w-[350px] h-[350px] top-0 left-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Ready to Accelerate Your Career at JECRC?
            </h2>
            <p className="text-slate-200 text-base font-normal">
              Join thousands of JECRC University students connecting with top alumni mentors today.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/find-mentor"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-extrabold text-red-950 bg-white hover:bg-slate-100 transition-all shadow-lg scale-105"
              >
                Find My Mentor Now
              </Link>
              <Link
                to="/explore"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-extrabold text-white border-2 border-white/40 hover:bg-white/10 transition-all"
              >
                Browse Alumni Directory
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
