import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ChevronRight } from 'lucide-react';

export const FeedRightSidebar = () => {
  const { 
    suggestedPeople, 
    toggleConnectUser, 
    events, 
    toggleEventRegistration, 
    setSearchQuery 
  } = useApp();

  const trendingTags = [
    { tag: '#Placements2026', count: '340 posts' },
    { tag: '#AlumniMeetJaipur', count: '185 posts' },
    { tag: '#GoogleInternships', count: '120 posts' },
    { tag: '#AIandML', count: '98 posts' },
    { tag: '#HackathonWinners', count: '64 posts' },
  ];

  const upcomingEvents = (events || []).slice(0, 2);

  return (
    <aside className="space-y-3 sticky top-18">
      {/* 1. People You May Know */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900">People You May Know</h3>
          <Link
            to="/explore"
            className="text-[11px] font-semibold text-red-700 hover:underline"
          >
            See all
          </Link>
        </div>

        <div className="space-y-3 divide-y divide-slate-100">
          {suggestedPeople.map((person) => {
            const isPending = person.connectionStatus === 'pending';
            const isConnected = person.connectionStatus === 'connected';

            return (
              <div key={person.id} className="pt-3 first:pt-0 flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 space-y-0.5">
                    <Link
                      to={person.id.startsWith('alm') ? `/alumni/${person.id}` : '#'}
                      className="text-xs font-bold text-slate-900 hover:text-red-700 hover:underline block truncate"
                    >
                      {person.name}
                    </Link>
                    <p className="text-[11px] text-slate-500 truncate">
                      {person.role}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      {person.mutualCount} mutual
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleConnectUser(person.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                    isConnected
                      ? 'bg-slate-100 text-slate-600'
                      : isPending
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  {isConnected ? 'Connected' : isPending ? 'Pending' : 'Connect'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Trending in JECRC */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2.5">
        <h3 className="text-xs font-bold text-slate-900">Trending in JECRC</h3>

        <div className="space-y-1.5">
          {trendingTags.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSearchQuery(item.tag)}
              className="w-full text-left py-1 px-1.5 rounded hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-slate-800 group-hover:text-red-700 block">
                  {item.tag}
                </span>
                <span className="text-[10px] text-slate-400">
                  {item.count}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
            </button>
          ))}
        </div>
      </div>

      {/* 3. Upcoming Events */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900">Upcoming Events</h3>
          <Link
            to="/events"
            className="text-[11px] font-semibold text-red-700 hover:underline"
          >
            All
          </Link>
        </div>

        <div className="space-y-3 divide-y divide-slate-100">
          {upcomingEvents.map((evt) => (
            <div key={evt.id} className="pt-2.5 first:pt-0 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-semibold text-red-700 bg-red-50 px-1.5 py-0.2 rounded">
                  {evt.date}
                </span>
                <span>{evt.seatsLeft} seats left</span>
              </div>

              <h4 className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2">
                {evt.title}
              </h4>

              <p className="text-[11px] text-slate-500 truncate">
                {evt.speaker}
              </p>

              <button
                type="button"
                onClick={() => toggleEventRegistration(evt.id)}
                className={`w-full py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  evt.isRegistered
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'border border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {evt.isRegistered ? '✓ Registered' : 'RSVP'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Mini Footer */}
      <div className="px-2 text-center text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Link to="/about" className="hover:text-slate-600">About</Link>
          <span>•</span>
          <Link to="/explore" className="hover:text-slate-600">Directory</Link>
          <span>•</span>
          <Link to="/events" className="hover:text-slate-600">Events</Link>
          <span>•</span>
          <a href="#" className="hover:text-slate-600">Privacy</a>
        </div>
        <p className="text-[10px]">
          JECRC Community © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
};
