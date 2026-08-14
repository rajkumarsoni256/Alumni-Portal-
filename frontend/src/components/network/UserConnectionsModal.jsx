import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, Users, Loader2, Check, UserPlus, RefreshCw } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { connectionService } from '../../services/connectionService';
import { useApp } from '../../context/AppContext';

export const UserConnectionsModal = ({ isOpen, onClose, userId, userName, totalCount = 0 }) => {
  const navigate = useNavigate();
  const { currentUser, toggleConnectUser } = useApp();

  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(totalCount);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch connections on open, userId, or debouncedSearch change
  useEffect(() => {
    if (!isOpen || !userId) return;

    let isMounted = true;
    const fetchInitialConnections = async () => {
      setLoading(true);
      setError(null);
      setPage(1);

      try {
        const res = await connectionService.getUserConnections(userId, {
          search: debouncedSearch,
          page: 1,
          limit: 20,
        });

        if (isMounted) {
          const list = Array.isArray(res) ? res : (res?.connections || []);
          setConnections(list);
          setTotal(res?.total !== undefined ? res.total : (res?.totalCount !== undefined ? res.totalCount : list.length));
          setHasMore(Boolean(res?.hasMore));
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Failed to load user connections:', err);
          setError(err.message || 'Unable to load connections.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitialConnections();
    return () => { isMounted = false; };
  }, [isOpen, userId, debouncedSearch]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const res = await connectionService.getUserConnections(userId, {
        search: debouncedSearch,
        page: nextPage,
        limit: 20,
      });

      const list = Array.isArray(res) ? res : (res?.connections || []);
      setConnections((prev) => [...prev, ...list]);
      setHasMore(Boolean(res?.hasMore));
      setPage(nextPage);
    } catch (err) {
      console.warn('Failed to load more connections:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (!isOpen) return null;

  const realCount = total !== undefined ? total : totalCount;
  const countDisplay = realCount >= 500 ? '500+' : String(realCount);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="connections-modal-title"
    >
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full flex flex-col max-h-[85vh] relative animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h3 id="connections-modal-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-red-700" />
              <span>{userName ? `${userName}'s Connections` : 'Connections'}</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {countDisplay} {realCount === 1 ? 'connection' : 'connections'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close connections dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search connections by name, company, branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-400 text-slate-900 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12 text-xs text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-red-700" />
              <span>Loading connections...</span>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2">
              <p className="text-xs text-rose-700 font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  connectionService.getUserConnections(userId, { search: debouncedSearch, page: 1, limit: 20 })
                    .then(res => {
                      setConnections(Array.isArray(res) ? res : (res?.connections || []));
                      setLoading(false);
                    })
                    .catch(err => {
                      setError(err.message || 'Unable to load connections.');
                      setLoading(false);
                    });
                }}
                className="px-3 py-1 rounded-md text-xs font-semibold bg-rose-700 text-white hover:bg-rose-800 cursor-pointer inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Try Again</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && connections.length === 0 && (
            <div className="py-12 text-center space-y-1.5 max-w-xs mx-auto">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {debouncedSearch ? 'No connections found' : 'No connections yet'}
              </h4>
              <p className="text-xs text-slate-500">
                {debouncedSearch
                  ? `No connections found matching "${debouncedSearch}".`
                  : 'This member has not connected with anyone yet.'}
              </p>
            </div>
          )}

          {/* Connection Item Cards */}
          {!loading && !error && connections.length > 0 && (
            <div className="space-y-2">
              {connections.map((conn) => {
                const connUserId = conn.id || conn.userId || conn.user?.id;
                const isSelf = currentUser && (currentUser.id === connUserId || currentUser.userId === connUserId);
                const isAlumni = conn.isAlumni || conn.role === 'alumni' || conn.role === 'ALUMNI';
                const profilePath = isAlumni ? `/alumni/${connUserId}` : `/profile/${connUserId}`;

                return (
                  <div
                    key={connUserId}
                    className="p-3 rounded-xl border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 transition-all flex items-center justify-between gap-3 group bg-white"
                  >
                    {/* User Card Main Info */}
                    <div
                      onClick={() => {
                        onClose();
                        navigate(profilePath);
                      }}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <UserAvatar
                        src={conn.avatar || conn.avatarUrl}
                        name={conn.name || conn.fullName}
                        className="w-11 h-11 shrink-0 group-hover:scale-102 transition-transform"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-900 block truncate group-hover:text-red-700 transition-colors">
                          {conn.name || conn.fullName}
                        </span>
                        <p className="text-[11px] text-slate-500 block truncate leading-snug">
                          {conn.headline || (isAlumni ? `Alumni @ ${conn.company || 'JECRC'}` : 'JECRC Member')}
                        </p>
                        {conn.location && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            {conn.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge / Action */}
                    <div className="shrink-0">
                      {isSelf ? (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
                          You
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold inline-flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Connected</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {!loading && !error && hasMore && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Load more connections</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
