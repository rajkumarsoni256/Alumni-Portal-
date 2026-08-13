import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FeedSidebar } from '../components/feed/FeedSidebar';
import { CreatePostComposer } from '../components/feed/CreatePostComposer';
import { PostCard } from '../components/feed/PostCard';
import { FeedSkeletons, FeedEmptyState, FeedErrorState } from '../components/feed/FeedStates';
import { Search, X } from 'lucide-react';

export const CommunityFeed = () => {
  const { 
    posts, 
    usersMap, 
    feedFilter, 
    setFeedFilter, 
    searchQuery, 
    setSearchQuery 
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isComposerModalOpen, setIsComposerModalOpen] = useState(false);

  // Category filter tabs
  const filterTabs = [
    { id: 'all', label: 'All Updates' },
    { id: 'alumni', label: 'Alumni' },
    { id: 'student', label: 'Students' },
    { id: 'jobs', label: 'Jobs & Hiring' },
    { id: 'saved', label: 'Saved' },
  ];

  const handleFilterChange = (filterId) => {
    setIsLoading(true);
    setFeedFilter(filterId);
    setTimeout(() => {
      setIsLoading(false);
    }, 120);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 200);
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const author = usersMap[post.authorId] || {};

      // 1. Category Tab Filter
      if (feedFilter === 'alumni' && post.category !== 'alumni' && !author.isAlumni) return false;
      if (feedFilter === 'student' && post.category !== 'student' && author.isAlumni) return false;
      if (feedFilter === 'jobs' && post.type !== 'JOB') return false;
      if (feedFilter === 'saved' && !post.savedByCurrentUser) return false;

      // 2. Search query / Tag filter
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesContent = post.content && post.content.toLowerCase().includes(q);
        const matchesAuthor = author.name && author.name.toLowerCase().includes(q);
        const matchesTags = post.tags && post.tags.some((t) => t.toLowerCase().includes(q));
        const matchesJob = post.jobData && (
          (post.jobData.title && post.jobData.title.toLowerCase().includes(q)) || 
          (post.jobData.company && post.jobData.company.toLowerCase().includes(q))
        );

        return matchesContent || matchesAuthor || matchesTags || matchesJob;
      }

      return true;
    });
  }, [posts, usersMap, feedFilter, searchQuery]);

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
        ) : filteredPosts.length === 0 ? (
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
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Feed Catch-up Notice */}
            <div className="py-4 text-center">
              <span className="text-xs text-slate-400 font-medium">
                You're all caught up with community updates
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar Widgets Column (Desktop LG/XL, 280px width, sticky on scroll) */}
      <div className="hidden lg:block w-64 xl:w-72 2xl:w-80 shrink-0 sticky top-20">
        <FeedSidebar />
      </div>

    </div>
  );
};
