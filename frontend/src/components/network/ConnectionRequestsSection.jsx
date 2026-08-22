import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useConnection } from '../../context/ConnectionContext';
import { UserAvatar } from '../common/UserAvatar';
import { ConnectionButton } from '../common/ConnectionButton';

export const ConnectionRequestsSection = () => {
  const { connectionRequests: appReqs = [] } = useApp();
  const { incomingRequests = [], acceptRequest, declineRequest } = useConnection();

  const requests = incomingRequests.length > 0 ? incomingRequests : appReqs;

  if (!requests || requests.length === 0) {
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
            {requests.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
        {requests.map((req) => {
          const user = req.fromUser || req.user || req;
          const userId = req.fromUserId || user.id || user.userId || user.user_id;
          const name = user.name || user.fullName || user.full_name || 'JECRC Member';
          const avatar = user.avatar || user.avatarUrl || user.avatar_url || null;
          const headline = user.headline || user.company || user.designation || user.currentRole || (user.branch ? `${user.role || 'Member'} • ${user.branch}` : 'Community Member');
          const batch = user.batch || (user.graduationYear ? `Class of ${user.graduationYear}` : '');
          const mutualCount = req.mutualCount || user.mutualCount || user.mutualConnectionsCount || 0;
          const isAlumni = (user.role || '').toUpperCase() === 'ALUMNI' || user.isAlumni;
          const profileLink = isAlumni ? `/alumni/${userId}` : `/profile/${userId}`;

          return (
            <div 
              key={req.id || req.requestId || userId} 
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

              {/* Action Buttons via ConnectionButton or Direct Handlers */}
              <div className="flex items-center justify-end pt-1 border-t border-slate-200/60">
                <ConnectionButton
                  userId={userId}
                  targetUser={user}
                  initialStatus="PENDING_RECEIVED"
                  size="sm"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
