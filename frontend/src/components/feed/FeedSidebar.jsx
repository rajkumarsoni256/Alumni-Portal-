import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { hashtagService } from '../../services/hashtagService';
import { eventService } from '../../services/eventService';
import { 
  ChevronRight, 
  Calendar, 
  Users, 
  TrendingUp,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const FeedSidebar = () => {
  const { 
    suggestedPeople, 
    toggleConnectUser, 
    setSearchQuery 
  } = useApp();

  // Trending state
  const [trendingTags, setTrendingTags] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [trendingError, setTrendingError] = useState(null);

  // Upcoming Events state
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  // Fetch Trending Hashtags
  const fetchTrending = async () => {
    setLoadingTrending(true);
    setTrendingError(null);
    try {
      const data = await hashtagService.getTrendingHashtags(5);
      setTrendingTags(data || []);
    } catch (err) {
      console.warn('Failed to load trending hashtags:', err);
      setTrendingError(err.message || 'Unable to load trending topics');
    } finally {
      setLoadingTrending(false);
    }
  };

  // Fetch Upcoming Events
  const fetchEvents = async () => {
    setLoadingEvents(true);
    setEventsError(null);
    try {
      const data = await eventService.getUpcomingEvents(2);
      setUpcomingEvents(data || []);
    } catch (err) {
      console.warn('Failed to load upcoming events:', err);
      setEventsError(err.message || 'Unable to load upcoming events');
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchTrending();
    fetchEvents();
  }, []);

  const defaultPeople = [
    { id: 'usr_101', name: 'Raj Kumar Soni', role: 'Student • B.Tech CSE \'26', mutualCount: 12, avatar: null },
    { id: 'usr_102', name: 'Rehan Khan', role: 'Student • B.Tech IT \'26', mutualCount: 8, avatar: null },
    { id: 'usr_103', name: 'Sneha Iyer', role: 'Alumni • B.Tech ECE \'22', mutualCount: 15, avatar: null },
  ];

  const peopleList = (suggestedPeople && suggestedPeople.length > 0) ? suggestedPeople.slice(0, 3) : defaultPeople;

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

        <div className="space-y-3">
          {peopleList.map((person) => (
            <div key={person.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <UserAvatar
                    src={person.avatar || person.avatarUrl}
                    name={person.name}
                    className="w-9 h-9"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
                </div>
                <div className="min-w-0">
                  <Link
                    to={`/profile/${person.id}`}
                    className="text-xs font-bold text-slate-900 hover:text-red-700 hover:underline block truncate"
                  >
                    {person.name}
                  </Link>
                  <p className="text-[10px] text-slate-500 truncate leading-tight">
                    {person.role || person.designation || 'JECRC Member'}
                  </p>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {person.mutualCount || 12} mutual connections
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleConnectUser(person.id)}
                className="px-3 py-1 rounded-md text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer shadow-2xs"
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Trending in JECRC (Real PostgreSQL Data) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-red-700" />
          <h3 className="text-xs font-bold text-slate-900">Trending in JECRC</h3>
        </div>

        {/* Loading State */}
        {loadingTrending && (
          <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-700" />
            <span>Loading trending topics...</span>
          </div>
        )}

        {/* Error State */}
        {!loadingTrending && trendingError && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-center space-y-1.5">
            <p className="text-[11px] text-rose-700 font-semibold">{trendingError}</p>
            <button
              type="button"
              onClick={fetchTrending}
              className="px-2.5 py-1 bg-rose-700 text-white rounded text-[10px] font-semibold hover:bg-rose-800 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loadingTrending && !trendingError && trendingTags.length === 0 && (
          <p className="text-xs text-slate-400 py-2 text-center">
            No trending topics yet.
          </p>
        )}

        {/* Hashtags List */}
        {!loadingTrending && !trendingError && trendingTags.length > 0 && (
          <div className="space-y-1">
            {trendingTags.map((item) => (
              <button
                key={item.id || item.name}
                type="button"
                onClick={() => setSearchQuery(item.displayName || `#${item.name}`)}
                className="w-full text-left py-1.5 px-2 rounded-md hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="space-y-0.5 min-w-0">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-red-700 block truncate">
                    {item.displayName || `#${item.name}`}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {item.count || `${item.postCount || 0} posts`}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Upcoming Campus Events (Real PostgreSQL Data) */}
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

        {/* Loading State */}
        {loadingEvents && (
          <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-700" />
            <span>Loading upcoming events...</span>
          </div>
        )}

        {/* Error State */}
        {!loadingEvents && eventsError && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-center space-y-1.5">
            <p className="text-[11px] text-rose-700 font-semibold">{eventsError}</p>
            <button
              type="button"
              onClick={fetchEvents}
              className="px-2.5 py-1 bg-rose-700 text-white rounded text-[10px] font-semibold hover:bg-rose-800 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loadingEvents && !eventsError && upcomingEvents.length === 0 && (
          <p className="text-xs text-slate-400 py-3 text-center">
            No upcoming events scheduled.
          </p>
        )}

        {/* Real Events List */}
        {!loadingEvents && !eventsError && upcomingEvents.length > 0 && (
          <div className="space-y-2">
            {upcomingEvents.map((evt) => {
              const dateObj = evt.startAt ? new Date(evt.startAt) : new Date();
              const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
              const day = dateObj.getDate();

              return (
                <Link
                  key={evt.id}
                  to={`/events`}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100/80 transition-colors block"
                >
                  {/* Calendar Date Badge */}
                  <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                    <span className="w-full bg-slate-100 text-[9px] font-bold text-slate-500 uppercase text-center py-0.5 border-b border-slate-200">
                      {month}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 leading-none py-1">
                      {day}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {evt.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {evt.location || 'Jaipur, Rajasthan'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {evt.time || '10:00 AM'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
