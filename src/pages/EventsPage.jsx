import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar, 
  MapPin, 
  UserCheck, 
  Users, 
  CheckCircle2, 
  Clock, 
  Search, 
  Sparkles,
  Ticket
} from 'lucide-react';

export const EventsPage = () => {
  const { events, toggleEventRegistration } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    'Workshops',
    'Networking',
    'Career Talks',
    'Webinars',
    'Chapter Meets',
  ];

  const filteredEvents = events.filter((evt) => {
    const matchesCat = selectedCategory === 'All' || evt.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.speaker.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
          <Calendar className="w-3.5 h-3.5" />
          <span>Campus & Virtual Events</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Alumni & Student Events
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          Join interactive technical workshops, career panel talks, industry webinars, and annual chapter networking mixers.
        </p>
      </div>

      {/* Controls Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title or speaker name..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {categories.map((cat, idx) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

      </div>

      {/* Grid of Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredEvents.map((evt) => (
          <div
            key={evt.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
          >
            {/* Header Banner */}
            <div>
              <div className={`h-28 bg-gradient-to-r ${evt.coverBg || 'from-indigo-600 to-purple-800'} p-5 relative flex items-start justify-between text-white`}>
                <span className="bg-white/90 backdrop-blur-md text-indigo-900 text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                  {evt.category}
                </span>

                <span className="bg-black/30 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-xs">
                  {evt.seatsLeft} seats left
                </span>
              </div>

              {/* Event Content */}
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{evt.date} • {evt.time}</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 leading-snug">{evt.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={evt.speakerAvatar}
                      alt={evt.speaker}
                      className="w-10 h-10 rounded-full object-cover border border-indigo-200"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">{evt.speaker}</p>
                      <p className="text-slate-500 font-medium">{evt.speakerRole}</p>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="font-bold text-slate-700 block">{evt.registeredCount}</span>
                    <span className="text-slate-400 text-[11px]">Attending</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{evt.location}</span>
              </span>

              <button
                onClick={() => toggleEventRegistration(evt.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  evt.isRegistered
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'gradient-accent-bg text-white shadow-md hover:scale-[1.02]'
                }`}
              >
                {evt.isRegistered ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Registered ✓</span>
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4" />
                    <span>Register Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
