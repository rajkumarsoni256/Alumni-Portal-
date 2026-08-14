import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  X,
  Copy,
  Users,
  Share2,
  Check,
  Search,
  Send,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { connectionService } from '../../services/connectionService';
import { messageService } from '../../services/messageService';

/**
 * Skeleton Loader for Feed Posts
 */
export const FeedSkeletons = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx} 
          className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 bg-slate-200 rounded w-1/4" />
              <div className="h-2.5 bg-slate-200 rounded w-1/3" />
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="h-3 bg-slate-200 rounded w-full" />
            <div className="h-3 bg-slate-200 rounded w-5/6" />
          </div>

          {idx === 1 && (
            <div className="h-40 bg-slate-200 rounded-lg w-full" />
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="h-6 bg-slate-200 rounded w-16" />
            <div className="h-6 bg-slate-200 rounded w-16" />
            <div className="h-6 bg-slate-200 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Empty Feed State
 */
export const FeedEmptyState = ({ onResetFilter, onCreatePostClick, filterName = 'all' }) => {
  const isFiltered = filterName && filterName !== 'all' && filterName !== 'All';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center space-y-3 shadow-2xs">
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-sm font-bold text-slate-900">
          {isFiltered
            ? `No updates in "${filterName}"`
            : "Your community is quiet... for now."}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {isFiltered
            ? "Try resetting your filter to view all community updates."
            : "Be the first to share something with the JECRC community."}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 pt-1">
        <button
          type="button"
          onClick={onCreatePostClick}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer shadow-2xs"
        >
          Create a Post
        </button>

        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilter}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Show All
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Error Feed State
 */
export const FeedErrorState = ({ onRetry }) => {
  return (
    <div className="bg-white rounded-xl border border-rose-200 p-6 text-center space-y-3 shadow-2xs">
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-sm font-bold text-slate-900">Something went wrong.</h3>
        <p className="text-xs text-slate-500">
          We couldn't load the community feed.
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  );
};

/**
 * Complete Share Modal Component (Phases 10, 11, 12, 15, 21, 22, 23)
 */
export const ShareModal = ({ isOpen, onClose, post, onCopyLink }) => {
  const { myConnections: contextConnections, showNotification } = useApp();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'connections'
  const [connectionsList, setConnectionsList] = useState(contextConnections || []);
  const [loadingConn, setLoadingConn] = useState(false);
  const [connError, setConnError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConnectionIds, setSelectedConnectionIds] = useState([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (contextConnections && contextConnections.length > 0) {
      setConnectionsList(contextConnections);
    }
  }, [contextConnections]);

  const loadConnections = async () => {
    setLoadingConn(true);
    setConnError(null);
    try {
      const res = await connectionService.getMyConnections();
      const list = Array.isArray(res) ? res : (res?.connections || []);
      setConnectionsList(list);
    } catch (err) {
      console.warn('Failed to load connections:', err);
      setConnError(err.message || 'Unable to load connections.');
    } finally {
      setLoadingConn(false);
    }
  };

  const handleOpenConnections = () => {
    setActiveTab('connections');
    if (connectionsList.length === 0) {
      loadConnections();
    }
  };

  if (!isOpen || !post) return null;

  const canonicalPostUrl = `${window.location.origin}/posts/${post.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(canonicalPostUrl);
    setCopied(true);
    if (onCopyLink) onCopyLink();
    showNotification('Post link copied!', 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author?.name || 'JU Connect Member'}`,
          text: post.content ? `${post.content.slice(0, 100)}...` : 'Check out this post on JU Connect',
          url: canonicalPostUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const filteredConnections = connectionsList.filter((conn) => {
    const userObj = conn.user || conn;
    const name = (userObj.name || userObj.fullName || conn.name || conn.fullName || '').toLowerCase();
    const headline = (userObj.headline || userObj.company || conn.headline || conn.company || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return name.includes(query) || headline.includes(query);
  });

  const toggleSelectConnection = (id) => {
    setSelectedConnectionIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSendToConnections = async () => {
    if (selectedConnectionIds.length === 0 || isSending) return;
    setIsSending(true);

    let successCount = 0;
    let failCount = 0;

    try {
      const shareMessage = `Check out this post:\n${canonicalPostUrl}`;
      for (const targetId of selectedConnectionIds) {
        try {
          const conv = await messageService.createOrGetConversation(targetId);
          if (conv && conv.id) {
            await messageService.sendMessage(conv.id, shareMessage);
            successCount++;
          } else {
            failCount++;
          }
        } catch (singleErr) {
          console.warn(`Failed to share post with recipient ${targetId}:`, singleErr);
          failCount++;
        }
      }

      if (failCount === 0) {
        showNotification(`Post shared with ${successCount} connection(s)!`, 'success');
      } else if (successCount > 0) {
        showNotification(`Post shared with ${successCount} connection(s). ${failCount} connection(s) could not be reached.`, 'info');
      } else {
        showNotification('Unable to share post. Ensure you are connected with the selected recipient.', 'error');
      }

      setSelectedConnectionIds([]);
      setActiveTab('menu');
      onClose();
    } catch (err) {
      showNotification(err.message || 'Failed to share post with connections', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div 
        className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-4 space-y-4 relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 id="share-modal-title" className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-red-700" />
            <span>Share this post</span>
          </h3>
          <button 
            type="button"
            onClick={() => {
              setActiveTab('menu');
              onClose();
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Menu View */}
        {activeTab === 'menu' && (
          <div className="space-y-2">
            {/* 1. Copy Link Option */}
            <button
              type="button"
              onClick={handleCopy}
              className="w-full p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-700 transition-colors">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Copy link</span>
                  <span className="text-[11px] text-slate-500 block">Copy the canonical post URL</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 inline" /> : 'Copy'}
              </span>
            </button>

            {/* 2. Share with Connections Option */}
            <button
              type="button"
              onClick={handleOpenConnections}
              className="w-full p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-purple-50 group-hover:text-purple-700 transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Share with connections</span>
                  <span className="text-[11px] text-slate-500 block">Send this post as a private message</span>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-400">→</span>
            </button>

            {/* 3. Share Externally Option */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Share externally</span>
                  <span className="text-[11px] text-slate-500 block">Use your device share menu or browser</span>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-400">→</span>
            </button>
          </div>
        )}

        {/* Share with Connections Sub-View */}
        {activeTab === 'connections' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Select Connections</span>
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className="text-[11px] text-red-700 hover:underline font-semibold cursor-pointer"
              >
                Back to menu
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search connections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg outline-none text-slate-800"
              />
            </div>

            {/* Connection Loading State */}
            {loadingConn && (
              <div className="flex items-center justify-center py-6 text-xs text-slate-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-red-700" />
                <span>Loading your connections...</span>
              </div>
            )}

            {/* Connection Error State */}
            {!loadingConn && connError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-center space-y-1.5">
                <p className="text-xs text-rose-700 font-medium">{connError}</p>
                <button
                  type="button"
                  onClick={loadConnections}
                  className="text-xs font-bold text-rose-800 hover:underline cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Connection List */}
            {!loadingConn && !connError && (
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {filteredConnections.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    {connectionsList.length === 0 
                      ? "No connections yet. Connect with alumni and students to share posts directly."
                      : "No connections found matching your search."}
                  </p>
                ) : (
                  filteredConnections.map((conn) => {
                    const userObj = conn.user || conn;
                    const userId = userObj.id || userObj.userId || conn.id || conn.userId;
                    const name = userObj.name || userObj.fullName || conn.name || conn.fullName || 'JECRC Member';
                    const avatar = userObj.avatar || userObj.avatarUrl || conn.avatar || conn.avatarUrl;
                    const headline = userObj.headline || conn.headline || userObj.company || 'JECRC Connection';
                    const isSelected = selectedConnectionIds.includes(userId);

                    return (
                      <div
                        key={userId}
                        onClick={() => toggleSelectConnection(userId)}
                        className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-red-50/70 border-red-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar
                            src={avatar}
                            name={name}
                            className="w-8 h-8 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {name}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {headline}
                            </span>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-red-700 border-red-700 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendToConnections}
                disabled={selectedConnectionIds.length === 0 || isSending}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sharing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Share ({selectedConnectionIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
