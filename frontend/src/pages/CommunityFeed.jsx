import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { postService } from '../services/postService';
import { FeedSidebar } from '../components/feed/FeedSidebar';
import { CreatePostComposer } from '../components/feed/CreatePostComposer';
import { PostCard } from '../components/feed/PostCard';
import { FeedSkeletons, FeedEmptyState, FeedErrorState } from '../components/feed/FeedStates';
import { Search, X } from 'lucide-react';

export const CommunityFeed = () => {
  const { 
    posts, 
    setPosts, 
    feedFilter, 
    setFeedFilter, 
    searchQuery, 
    setSearchQuery 
  } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isComposerModalOpen, setIsComposerModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);

  // Category filter tabs
  const filterTabs = [
    { id: 'all', label: 'All Updates' },
    { id: 'alumni', label: 'Alumni' },
    { id: 'student', label: 'Students' },
    { id: 'jobs', label: 'Jobs & Hiring' },
    { id: 'saved', label: 'Saved' },
  ];

  const fetchFeedPosts = async (targetPage = 1, isInitial = false) => {
    if (isInitial) setIsLoading(true);
    setHasError(false);

    try {
      const result = await postService.getPosts({
        page: targetPage,
        limit: 15,
        filter: feedFilter,
        searchQuery: searchQuery,
      });

      if (targetPage === 1) {
        setPosts(result.posts || []);
      } else {
        setPosts((prev) => [...prev, ...(result.posts || [])]);
      }

      setTotalPosts(result.total || result.totalCount || 0);
      setHasMore(result.hasMore || false);
      setPage(targetPage);
    } catch (err) {
      console.warn('Failed to load feed posts:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedPosts(1, true);
  }, [feedFilter, searchQuery]);

  const handleFilterChange = (filterId) => {
    setFeedFilter(filterId);
  };

  const handleRetry = () => {
    fetchFeedPosts(1, true);
  };

  return (
    <div className="flex flex-col lg:flex-row items-start gap-6">
      
      {/* Main Feed Column (Flex-1) */}
      <div className="flex-1 min-w-0 w-full space-y-3">
        
        {/* 1. Feed Filter Pill Bar */}
        <div 
          className="bg-white rounded-xl border border-slate-200/90 p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-2xs"
          role="tablist"
          aria-label="Feed category filters"
        >
          {filterTabs.map((tab) => {
            const active = feedFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleFilterChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. Active Search / Tag Notice */}
        {searchQuery && (
          <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-100">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Showing results for <span className="font-semibold text-slate-900">"{searchQuery}"</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 3. Create Post Composer (Collapsed trigger + Modal) */}
        <CreatePostComposer
          initialExpanded={isComposerModalOpen}
          onCloseModal={() => setIsComposerModalOpen(false)}
        />

        {/* 4. Posts Stream */}
        {hasError ? (
          <FeedErrorState onRetry={handleRetry} />
        ) : isLoading ? (
          <FeedSkeletons count={3} />
        ) : posts.length === 0 ? (
          <FeedEmptyState
            filterName={feedFilter}
            onResetFilter={() => {
              setFeedFilter('all');
              setSearchQuery('');
            }}
            onCreatePostClick={() => setIsComposerModalOpen(true)}
          />
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => fetchFeedPosts(page + 1, false)}
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  Load More Updates
                </button>
              </div>
            )}

            {/* Feed Catch-up Notice */}
            {!hasMore && posts.length > 0 && (
              <div className="py-4 text-center">
                <span className="text-xs text-slate-400 font-medium">
                  You're all caught up with community updates ({totalPosts} posts)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Sidebar Widgets Column */}
      <div className="hidden lg:block w-64 xl:w-72 2xl:w-80 shrink-0 sticky top-20">
        <FeedSidebar />
      </div>

    </div>
  );
};
