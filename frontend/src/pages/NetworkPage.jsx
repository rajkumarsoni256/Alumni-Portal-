import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { userService } from '../services/userService';
import { PersonCard } from '../components/network/PersonCard';
import { ConnectionRequestsSection } from '../components/network/ConnectionRequestsSection';
import { NetworkFilters } from '../components/network/NetworkFilters';
import { 
  NetworkSkeletons, 
  NetworkEmptyState, 
  NetworkErrorState 
} from '../components/network/NetworkStates';
import { Search, X, ArrowRight } from 'lucide-react';

export const NetworkPage = () => {
  const { usersMap } = useApp();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleType, setRoleType] = useState('all'); // 'all' | 'alumni' | 'student'
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Async Fetch State
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [displayedUsers, setDisplayedUsers] = useState([]);

  // Fetch users via userService layer
  const loadUsers = async (targetPage = 1, isInitial = false) => {
    if (isInitial) setIsLoading(true);
    setHasError(false);

    try {
      const result = await userService.getUsers({
        page: targetPage,
        limit: 18,
        type: roleType,
        branch: selectedBranch,
        batch: selectedBatch,
        location: selectedLocation,
        query: searchQuery,
      });

      // Synchronize with latest connection status from usersMap
      const syncedUsers = (result.users || []).map((u) => {
        return usersMap[u.id] ? { ...u, ...usersMap[u.id] } : u;
      });

      setDisplayedUsers(syncedUsers);
      setTotalCount(result.totalCount || 0);
      setHasMore(result.hasMore || false);
      setPage(targetPage);
    } catch (err) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch whenever filters change (with slight debounce feel)
  useEffect(() => {
    loadUsers(1, true);
  }, [roleType, selectedBranch, selectedBatch, selectedLocation, searchQuery, usersMap]);

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setRoleType('all');
    setSelectedBranch('all');
    setSelectedBatch('all');
    setSelectedLocation('all');
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    loadUsers(nextPage, false);
  };

  const resultCountText = useMemo(() => {
    if (roleType === 'alumni') return `${totalCount} alumni found`;
    if (roleType === 'student') return `${totalCount} students found`;
    return `Showing ${totalCount} people`;
  }, [totalCount, roleType]);

  return (
    <div className="min-h-screen bg-slate-100/75 py-5">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 space-y-4">
        
        {/* 1. Clean Page Header */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold text-slate-900">Network</h1>
            <p className="text-xs text-slate-500">
              Connect with students and alumni across the JECRC community.
            </p>
          </div>

          <div className="text-xs text-slate-600 font-semibold self-start sm:self-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
            {resultCountText}
          </div>
        </div>

        {/* 2. Incoming Connection Requests (Auto-renders when requests exist) */}
        <ConnectionRequestsSection />

        {/* 3. Prominent Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people by name, company, role, skill..."
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg pl-9 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
              aria-label="Search people"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4. Multi-Criteria Filters Bar */}
        <NetworkFilters
          roleType={roleType}
          setRoleType={setRoleType}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          selectedBatch={selectedBatch}
          setSelectedBatch={setSelectedBatch}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          onResetAll={handleResetAllFilters}
        />

        {/* 5. Results Grid / Stream */}
        {hasError ? (
          <NetworkErrorState onRetry={() => loadUsers(1, true)} />
        ) : isLoading ? (
          <NetworkSkeletons count={6} />
        ) : displayedUsers.length === 0 ? (
          <NetworkEmptyState
            searchQuery={searchQuery}
            onResetFilters={handleResetAllFilters}
          />
        ) : (
          <div className="space-y-4">
            {/* Responsive Grid: 3 cols on desktop, 2 cols on tablet, 1 col on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {displayedUsers.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>

            {/* Pagination / Load More Button */}
            {hasMore && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Load More Members</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* End of results indicator */}
            {!hasMore && displayedUsers.length > 0 && (
              <div className="py-4 text-center">
                <span className="text-xs text-slate-400 font-medium">
                  Showing all {displayedUsers.length} community members
                </span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
