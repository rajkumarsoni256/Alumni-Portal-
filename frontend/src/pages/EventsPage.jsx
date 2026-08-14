import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Search, 
  Check,
  CalendarX,
  Loader2
} from 'lucide-react';

export const EventsPage = () => {
  const { events, fetchEvents, toggleEventRegistration, showNotification } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    'All',
    'Workshops',
    'Networking',
    'Career Talks',
    'Webinars',
    'Chapter Meets',
  ];

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        await fetchEvents({
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          search: searchQuery.trim() ? searchQuery : undefined,
        });
      } catch (err) {
        showNotification('Failed to fetch events', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadEvents();
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  const registeredCountTotal = events.filter((e) => e.isRegistered).length;

  return (
    <div className="min-h-screen bg-slate-100/75 py-5">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 space-y-4">
        
        {/* Header Title */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h1 className="text-lg font-bold text-slate-900">Campus & Alumni Events</h1>
              <p className="text-xs text-slate-500">
                Participate in tech workshops, career panel talks, and annual JECRC alumni networking meets.
              </p>
            </div>

            <div className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg self-start sm:self-auto flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{registeredCountTotal} Registered</span>
            </div>
          </div>

          {/* Search and Category Filter */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by title, description, or speaker..."
                className="w-full bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Loading Spinner State */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs space-y-3">
            <Loader2 className="w-7 h-7 text-red-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Loading events from JECRC network...</p>
          </div>
        ) : events.length > 0 ? (
          /* Events Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between"
              >
                {/* Event Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      {evt.category}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{evt.date} • {evt.time}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {evt.description}
                    </p>
                  </div>

                  {/* Speaker & Location */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Speaker / Host</span>
                      <span className="font-semibold text-slate-900 block truncate">{evt.speaker}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Venue</span>
                      <span className="font-medium text-slate-700 block truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{evt.location}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{evt.registeredCount} attending</span>
                    <span>•</span>
                    <span className="text-amber-700 font-semibold">{evt.seatsLeft} seats left</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleEventRegistration(evt.id)}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 ${
                      evt.isRegistered
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-red-700 hover:bg-red-800 text-white'
                    }`}
                  >
                    {evt.isRegistered ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Registered</span>
                      </>
                    ) : (
                      <span>RSVP Now</span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs space-y-3">
            <CalendarX className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No events found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no events matching your filter criteria. Try adjusting your category or search query.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
