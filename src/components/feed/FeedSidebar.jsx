import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  ChevronRight, 
  Sparkles, 
  Calendar, 
  Users, 
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export const FeedSidebar = () => {
  const { 
    currentUser,
    activeRole,
    suggestedPeople, 
    toggleConnectUser, 
    setSearchQuery,
    events
  } = useApp();

  const trendingTags = [
    { tag: '#Placements2026', count: '340+ posts' },
    { tag: '#AlumniMeetJaipur', count: '185 posts' },
    { tag: '#GoogleInternships', count: '120 posts' },
    { tag: '#AIandML', count: '98 posts' },
    { tag: '#HackathonWinners', count: '64 posts' },
  ];

  const visibleSuggestions = (suggestedPeople || []).slice(0, 4);
  const upcomingEvents = (events || []).slice(0, 2);

  return (
    <aside className="space-y-3.5">
      {/* 1. People You May Know */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-900">People You May Know</h3>
          </div>
          <Link
            to="/network"
            className="text-[11px] font-semibold text-red-700 hover:underline"
          >
            See all
          </Link>
        </div>

        <div className="space-y-3 divide-y divide-slate-100">
          {visibleSuggestions.map((person) => {
            const isPending = person.connectionStatus === 'pending';
            const isConnected = person.connectionStatus === 'connected';

            return (
              <div key={person.id} className="pt-3 first:pt-0 flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Link to={`/profile/${person.id}`}>
                    <img
                      src={person.avatar}
                      alt={person.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 hover:ring-2 hover:ring-red-600/30 transition-all cursor-pointer"
                    />
                  </Link>
                  <div className="min-w-0 space-y-0.5">
                    <Link
                      to={`/profile/${person.id}`}
                      className="text-xs font-bold text-slate-900 hover:text-red-700 hover:underline block truncate"
                    >
                      {person.name}
                    </Link>
                    <p className="text-[11px] text-slate-500 truncate leading-tight">
                      {person.role}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      {person.batch || `${person.mutualCount || 12} mutual`}
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
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-red-700" />
          <h3 className="text-xs font-bold text-slate-900">Trending in JECRC</h3>
        </div>

        <div className="space-y-1">
          {trendingTags.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSearchQuery(item.tag)}
              className="w-full text-left py-1.5 px-2 rounded-md hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="space-y-0.5 min-w-0">
                <span className="text-xs font-medium text-slate-800 group-hover:text-red-700 block truncate">
                  {item.tag}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {item.count}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* 3. Upcoming Campus Events */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-900">Upcoming Events</h3>
          </div>
          <Link
            to="/events"
            className="text-[11px] font-semibold text-red-700 hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="space-y-2.5">
          {upcomingEvents.map((evt) => (
            <Link
              key={evt.id}
              to="/events"
              className="block p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-colors space-y-1"
            >
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
                {evt.date} • {evt.category}
              </span>
              <p className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug">
                {evt.title}
              </p>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {evt.speaker}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Mini Footer */}
      <div className="px-2 text-center text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Link to="/about" className="hover:text-slate-600">About</Link>
          <span>•</span>
          <Link to="/network" className="hover:text-slate-600">Network</Link>
          <span>•</span>
          <Link to="/events" className="hover:text-slate-600">Events</Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-slate-600">Privacy</Link>
        </div>
        <p className="text-[10px]">
          JECRC Community © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
};
