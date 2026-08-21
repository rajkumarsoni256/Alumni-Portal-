import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';

export const ConnectionRequestsSection = () => {
  const { 
    connectionRequests = [], 
    acceptConnectionRequest, 
    ignoreConnectionRequest 
  } = useApp();

  if (!connectionRequests || connectionRequests.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Connection Requests
          </h2>
          <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-red-100 text-red-800">
            {connectionRequests.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
        {connectionRequests.map((req) => {
          const user = req.fromUser || req.user || req;
          const userId = req.fromUserId || user.id || user.userId;
          const name = user.name || user.fullName || 'JECRC Member';
          const avatar = user.avatar || user.avatarUrl || null;
          const headline = user.headline || user.company || user.designation || user.currentRole || (user.branch ? `${user.role || 'Member'} • ${user.branch}` : 'Community Member');
          const batch = user.batch || (user.graduationYear ? `Class of ${user.graduationYear}` : '');
          const mutualCount = req.mutualCount || user.mutualCount || user.mutualConnectionsCount || 0;
          const isAlumni = (user.role || '').toUpperCase() === 'ALUMNI' || user.isAlumni;
          const profileLink = isAlumni ? `/alumni/${userId}` : `/profile/${userId}`;

          return (
            <div 
              key={req.id} 
              className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between space-y-2.5"
            >
              <div className="flex items-start gap-3">
                <Link to={profileLink}>
                  <UserAvatar
                    src={avatar}
                    name={name}
                    className="w-10 h-10 shrink-0"
                  />
                </Link>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <Link
                    to={profileLink}
                    className="text-xs font-bold text-slate-900 hover:text-red-700 hover:underline block truncate"
                  >
                    {name}
                  </Link>
                  <p className="text-[11px] text-slate-600 truncate leading-snug">
                    {headline}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    {batch && <span>{batch}</span>}
                    {mutualCount > 0 && (
                      <>
                        {batch && <span>•</span>}
                        <span>{mutualCount} mutual connection{mutualCount > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => ignoreConnectionRequest(req.id)}
                  className="py-1 rounded-md text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Ignore
                </button>

                <button
                  type="button"
                  onClick={() => acceptConnectionRequest(req.id, userId)}
                  className="py-1 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer"
                >
                  Accept
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
