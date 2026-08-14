import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ShieldCheck, User, Loader2 } from 'lucide-react';
import { connectionService } from '../../services/connectionService';

export const NewMessageModal = ({
  isOpen,
  onClose,
  onSelectUser,
  currentUserId,
}) => {
  const [search, setSearch] = useState('');
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setIsLoading(true);
      connectionService.getMyConnections()
        .then((res) => {
          setConnections(res || []);
        })
        .catch(() => {
          setConnections([]);
        })
        .finally(() => {
          setIsLoading(false);
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 50);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredUsers = connections.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (u.fullName || u.name || '').toLowerCase();
    const headline = (u.headline || u.designation || u.branch || '').toLowerCase();
    const company = (u.company || '').toLowerCase();
    return name.includes(q) || headline.includes(q) || company.includes(q);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-message-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 id="new-message-title" className="text-sm font-bold text-slate-900">
              New message
            </h3>
            <p className="text-[11px] text-slate-500">
              Select an accepted connection from the JECRC community to start a chat
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search connected peers by name, company, branch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-8 pr-3 py-2 border border-slate-200 focus:border-slate-300 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1 max-h-80 scrollbar-thin scrollbar-thumb-slate-200">
          {isLoading ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-red-700 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading your connections...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 space-y-1">
              <User className="w-6 h-6 mx-auto stroke-[1.5]" />
              <p className="text-xs font-semibold text-slate-600">No active connections found</p>
              <p className="text-[11px] text-slate-400">Connect with alumni or students first to exchange private messages</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const userId = user.id || user.userId;
              const isAlumni = (user.role || '').toUpperCase() === 'ALUMNI';
              const name = user.fullName || user.name || user.email;
              const subtitle = user.designation ? `${user.designation} @ ${user.company || 'Company'}` : (user.branch || 'JECRC Member');
              const batch = user.graduationYear ? `Class of ${user.graduationYear}` : (isAlumni ? 'Alumni' : 'Student');

              return (
                <button
                  key={userId}
                  type="button"
                  onClick={() => {
                    onSelectUser(userId);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={user.avatarUrl || user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300'}
                      alt={name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-red-600/20 transition-all"
                    />
                    {isAlumni && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"
                        title="Verified Alumni"
                      />
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-red-700 transition-colors truncate block">
                        {name}
                      </span>
                      {isAlumni && (
                        <ShieldCheck className="w-3.5 h-3.5 text-red-700 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 truncate leading-snug">
                      {subtitle}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {batch}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
