import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FeedLeftSidebar } from '../components/feed/FeedLeftSidebar';
import { FeedRightSidebar } from '../components/feed/FeedRightSidebar';
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

  // Filter Categories Tabs
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
    }, 150);
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const author = usersMap[post.authorId] || {};

      // 1. Tab category filter
      if (feedFilter === 'alumni' && post.category !== 'alumni' && !author.isAlumni) return false;
      if (feedFilter === 'student' && post.category !== 'student' && author.isAlumni) return false;
      if (feedFilter === 'jobs' && post.type !== 'JOB') return false;
      if (feedFilter === 'saved' && !post.savedByCurrentUser) return false;

      // 2. Search Query match
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesContent = post.content.toLowerCase().includes(q);
        const matchesAuthor = author.name && author.name.toLowerCase().includes(q);
        const matchesTags = post.tags && post.tags.some((t) => t.toLowerCase().includes(q));
        const matchesJob = post.jobData && (
          post.jobData.title.toLowerCase().includes(q) || 
          post.jobData.company.toLowerCase().includes(q)
        );

        return matchesContent || matchesAuthor || matchesTags || matchesJob;
      }

      return true;
    });
  }, [posts, usersMap, feedFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-100/75 py-4 sm:py-5">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        
        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5 items-start">
          
          {/* Left Sidebar */}
          <div className="hidden md:block md:col-span-4 lg:col-span-3">
            <FeedLeftSidebar />
          </div>

          {/* Center Feed */}
          <main className="col-span-1 md:col-span-8 lg:col-span-6 space-y-3">
            
            {/* 1. Feed Filter Pill Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-2xs">
              {filterTabs.map((tab) => {
                const active = feedFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleFilterChange(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 2. Active Search Notice */}
            {searchQuery && (
              <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Results for <span className="font-semibold text-slate-900">"{searchQuery}"</span></span>
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 3. Create Post Trigger */}
            <CreatePostComposer
              initialExpanded={isComposerModalOpen}
              onCloseModal={() => setIsComposerModalOpen(false)}
            />

            {/* 4. Posts Stream */}
            {hasError ? (
              <FeedErrorState onRetry={() => setHasError(false)} />
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

                {/* Feed End Notice */}
                <div className="py-4 text-center">
                  <span className="text-xs text-slate-400 font-medium">
                    You're all caught up
                  </span>
                </div>
              </div>
            )}
          </main>

          {/* Right Sidebar */}
          <div className="hidden lg:block lg:col-span-3">
            <FeedRightSidebar />
          </div>

        </div>

      </div>
    </div>
  );
};
