import React from 'react';
import { PostCard } from '../feed/PostCard';

export const ProfilePostsSection = ({ posts = [], authorName = 'Member' }) => {
  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-slate-900">Activity & Posts</h2>
        {posts.length > 0 && (
          <span className="text-xs text-slate-500 font-medium">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </span>
        )}
      </div>

      {(!posts || posts.length === 0) ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center space-y-1.5 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">
            {authorName} has not shared any public updates yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};
