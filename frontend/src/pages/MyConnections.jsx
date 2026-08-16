import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserAvatar } from '../components/common/UserAvatar';
import { connectionService } from '../services/connectionService';
import { 
  Users, 
  UserCheck,
  MessageSquare, 
  Calendar,
  Search,
  UserX,
  Loader2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const MyConnections = () => {
  const { requests, currentUser, showNotification } = useApp();
  const currentUserId = currentUser?.id;

  // Primary Section Tab: 'connections' | 'mentorship'
  const [sectionTab, setSectionTab] = useState('connections');

  // Connections State
  const [myConnections, setMyConnections] = useState([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [connectionSearch, setConnectionSearch] = useState('');

  // Mentorship Sub-tab: 'accepted' | 'pending' | 'history'
  const [mentorshipTab, setMentorshipTab] = useState('accepted');

  // Fetch real accepted connections from PostgreSQL backend
  const loadMyConnections = async () => {
    setIsLoadingConnections(true);
    try {
      const connectionsList = await connectionService.getMyConnections();
      const filtered = (connectionsList || []).filter((item) => {
        const uid = item.user?.id || item.user?.userId;
        return uid !== currentUserId;
      });
      setMyConnections(filtered);
    } catch (err) {
      showNotification('Failed to fetch your connections', 'error');
      setMyConnections([]);
    } finally {
      setIsLoadingConnections(false);
    }
  };

  const [confirmRemoveUser, setConfirmRemoveUser] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    loadMyConnections();
  }, []);

  const handleRemoveConnection = async () => {
    if (!confirmRemoveUser) return;
    const { id: targetUserId, name: targetName } = confirmRemoveUser;
    setIsRemoving(true);
    try {
      await connectionService.removeConnection(targetUserId);
      setMyConnections((prev) => prev.filter((c) => c.user?.id !== targetUserId && c.user?.userId !== targetUserId));
      showNotification(`Removed connection with ${targetName || 'user'}`, 'info');
      setConfirmRemoveUser(null);
    } catch (err) {
      showNotification(err.message || 'Failed to remove connection', 'error');
    } finally {
      setIsRemoving(false);
    }
  };

  // Filter connections by search term
  const filteredConnections = myConnections.filter((item) => {
    const u = item.user || {};
    const q = connectionSearch.toLowerCase().trim();
    if (!q) return true;

    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.company && u.company.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.branch && u.branch.toLowerCase().includes(q)) ||
      (u.location && u.location.toLowerCase().includes(q))
    );
  });

  // Mentorship filtering
  const acceptedMentors = requests.filter((r) => (r.status || '').toUpperCase() === 'ACCEPTED');
  const pendingRequests = requests.filter((r) => (r.status || '').toUpperCase() === 'PENDING');
  const completedMentorships = requests.filter((r) => (r.status || '').toUpperCase() === 'COMPLETED' || (r.status || '').toUpperCase() === 'DECLINED');

  const getDisplayedMentorshipList = () => {
    if (mentorshipTab === 'accepted') return acceptedMentors;
    if (mentorshipTab === 'pending') return pendingRequests;
    return completedMentorships;
  };

  const displayedMentorships = getDisplayedMentorshipList();

  return (
    <div className="min-h-screen bg-slate-100/75 py-5">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 space-y-4">
        
        {/* Header Title with View Switcher */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">Connections & Networking</h1>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Verified JECRC Network
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manage your confirmed network connections, incoming/outgoing mentorship requests, and direct alumni chats.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/network"
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Discover People</span>
            </Link>

            <Link
              to="/messages"
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Open Messages</span>
            </Link>
          </div>
        </div>

        {/* Primary Navigation Tabs: My Connections vs Mentorship Requests */}
        <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-2xs flex items-center gap-1">
          <button
            onClick={() => setSectionTab('connections')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              sectionTab === 'connections'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>My Connections ({myConnections.length})</span>
          </button>

          <button
            onClick={() => setSectionTab('mentorship')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              sectionTab === 'mentorship'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Mentorship Sessions ({acceptedMentors.length + pendingRequests.length})</span>
          </button>
        </div>

        {/* SECTION 1: MY CONNECTIONS */}
        {sectionTab === 'connections' && (
          <div className="space-y-3">
            {/* Search Connections Input */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={connectionSearch}
                  onChange={(e) => setConnectionSearch(e.target.value)}
                  placeholder="Filter connections by name, company, role, location..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 focus:outline-none transition-colors"
                />
              </div>

              <span className="text-xs text-slate-500 font-semibold shrink-0">
                {filteredConnections.length} connected
              </span>
            </div>

            {/* Connections Cards Grid */}
            {isLoadingConnections ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs space-y-3">
                <Loader2 className="w-7 h-7 text-red-600 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-600">Loading your connections from JECRC network...</p>
              </div>
            ) : filteredConnections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredConnections.map((item) => {
                  const u = item.user || {};
                  const targetUserId = u.id || u.userId;
                  const name = u.fullName || u.name || (u.email ? u.email.split('@')[0] : 'Community Member');
                  const role = u.designation || u.currentRole || (u.role === 'ALUMNI' ? 'Alumni' : 'Student');
                  const company = u.company || (u.role === 'ALUMNI' ? 'Industry Professional' : 'JECRC University');
                  const avatar = u.avatarUrl || u.avatar || null;
                  const branch = u.branch || 'CSE';
                  const batch = u.graduationYear ? `Class of ${u.graduationYear}` : 'JECRC';
                  const location = u.location || 'Jaipur, India';

                  return (
                    <div
                      key={item.id || targetUserId}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Link to={`/profile/${targetUserId}`}>
                            <UserAvatar
                              src={avatar}
                              name={name}
                              className="w-12 h-12 shrink-0 hover:ring-2 hover:ring-red-600/30 transition-all cursor-pointer"
                            />
                          </Link>

                          <div className="min-w-0 space-y-0.5">
                            <Link
                              to={`/profile/${targetUserId}`}
                              className="text-xs font-bold text-slate-900 hover:text-red-700 hover:underline block truncate"
                            >
                              {name}
                            </Link>
                            <p className="text-[11px] font-semibold text-slate-700 truncate">
                              {role}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {company}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
                              <span>{branch}</span>
                              <span>•</span>
                              <span>{batch}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <Link
                          to={`/messages?userId=${targetUserId}`}
                          className="flex-1 py-1.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors text-center inline-flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Message</span>
                        </Link>

                        <Link
                          to={`/profile/${targetUserId}`}
                          className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-1"
                          title="View Public Profile"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setConfirmRemoveUser({ id: targetUserId, name })}
                          className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-400 hover:text-red-700 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
                          title="Remove Connection"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    {connectionSearch ? 'No connections match your filter' : 'No connections yet'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {connectionSearch
                      ? 'Try adjusting your search criteria.'
                      : 'Connect with fellow JECRC students and alumni to expand your university professional network.'}
                  </p>
                </div>
                <Link
                  to="/network"
                  className="px-4 py-2 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-block shadow-2xs"
                >
                  Discover & Connect People
                </Link>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: MENTORSHIP SESSIONS */}
        {sectionTab === 'mentorship' && (
          <div className="space-y-3">
            {/* Sub-tabs Switcher */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <button
                onClick={() => setMentorshipTab('accepted')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  mentorshipTab === 'accepted' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Confirmed Sessions ({acceptedMentors.length})
              </button>
              <button
                onClick={() => setMentorshipTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  mentorshipTab === 'pending' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Pending Requests ({pendingRequests.length})
              </button>
              <button
                onClick={() => setMentorshipTab('history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  mentorshipTab === 'history' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Past History ({completedMentorships.length})
              </button>
            </div>

            {/* Mentorship List */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              {displayedMentorships.length > 0 ? (
                <div className="space-y-3 divide-y divide-slate-100">
                  {displayedMentorships.map((item) => {
                    const partnerName = item.mentor?.name || item.student?.name || 'Community Member';
                    const partnerRole = item.mentor?.designation || item.student?.branch || 'JECRC Network';
                    const partnerCompany = item.mentor?.company || 'JECRC University';
                    const partnerAvatar = item.mentor?.avatar || item.student?.avatar || null;
                    const partnerId = item.mentor?.id || item.student?.id;

                    return (
                      <div key={item.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <UserAvatar
                            src={partnerAvatar}
                            name={partnerName}
                            className="w-10 h-10 shrink-0"
                          />
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-bold text-slate-900">{partnerName}</h3>
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                {item.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium">{partnerRole} @ {partnerCompany}</p>
                            <p className="text-xs text-slate-700 pt-0.5">Topic: <strong>{item.topic}</strong></p>
                            <p className="text-xs text-slate-500 max-w-xl line-clamp-2">"{item.message}"</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                          <Link
                            to={`/messages?userId=${partnerId}`}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No mentorship sessions in this view</p>
                  <p className="text-slate-500">Discover alumni mentors to request 1-on-1 career guidance.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Remove Connection Confirmation Modal */}
      {confirmRemoveUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Remove Connection</h3>
                <p className="text-xs text-slate-500">This action can be undone by sending a new request.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong className="text-slate-900">{confirmRemoveUser.name || 'this member'}</strong> from your university connections?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isRemoving}
                onClick={() => setConfirmRemoveUser(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemoving}
                onClick={handleRemoveConnection}
                className="px-3.5 py-1.5 rounded-lg bg-red-700 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isRemoving ? 'Removing...' : 'Remove Connection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
