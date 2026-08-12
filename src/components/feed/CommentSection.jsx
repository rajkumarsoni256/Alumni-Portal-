import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CornerDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CommentSection = ({ post }) => {
  const { currentUser, usersMap, addComment, addReply, toggleLikeComment } = useApp();
  const [commentText, setCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const comments = post.comments || [];

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText);
    setCommentText('');
  };

  const handleReplySubmit = (e, commentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    addReply(post.id, commentId, replyText);
    setReplyText('');
    setReplyingToCommentId(null);
  };

  return (
    <div className="pt-3 border-t border-slate-100 space-y-3">
      {/* 1. Comment Input */}
      <form onSubmit={handleCommentSubmit} className="flex items-start gap-2.5">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
        />
        <div className="flex-1 space-y-1">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
          />
          {commentText.trim() && (
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-3 py-1 rounded text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer"
              >
                Post
              </button>
            </div>
          )}
        </div>
      </form>

      {/* 2. Comments List */}
      {comments.length > 0 && (
        <div className="space-y-2.5 pt-1">
          {comments.map((comment) => {
            const author = usersMap[comment.authorId] || {
              name: 'Community Member',
              headline: 'JECRC Network',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
              verified: false,
              isAlumni: false,
            };

            const isReplying = replyingToCommentId === comment.id;

            return (
              <div key={comment.id} className="space-y-1.5">
                {/* Main Comment Bubble */}
                <div className="flex items-start gap-2.5">
                  <img
                    src={author.avatar}
                    alt={author.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                  />

                  <div className="flex-1 space-y-1">
                    <div className="bg-slate-100 rounded-lg p-2.5 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex items-baseline gap-1.5">
                          {author.isAlumni ? (
                            <Link 
                              to={`/alumni/${author.id}`} 
                              className="text-xs font-bold text-slate-900 hover:text-red-700 hover:underline"
                            >
                              {author.name}
                            </Link>
                          ) : (
                            <span className="text-xs font-bold text-slate-900">{author.name}</span>
                          )}
                          <span className="text-[10px] text-slate-400 font-normal truncate max-w-xs">• {author.headline}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{comment.createdAt}</span>
                      </div>

                      <p className="text-xs text-slate-800 leading-snug">
                        {comment.content}
                      </p>
                    </div>

                    {/* Actions: Like & Reply */}
                    <div className="flex items-center gap-3 pl-1 text-[11px] text-slate-500 font-medium">
                      <button
                        onClick={() => toggleLikeComment(post.id, comment.id)}
                        className={`hover:text-red-700 cursor-pointer ${
                          comment.likedByCurrentUser ? 'text-red-700 font-bold' : ''
                        }`}
                      >
                        Like {comment.likes > 0 && `· ${comment.likes}`}
                      </button>

                      <button
                        onClick={() => {
                          setReplyingToCommentId(isReplying ? null : comment.id);
                          setReplyText('');
                        }}
                        className="hover:text-slate-800 cursor-pointer"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Reply Input */}
                {isReplying && (
                  <form
                    onSubmit={(e) => handleReplySubmit(e, comment.id)}
                    className="ml-9 flex items-center gap-2 pt-1"
                  >
                    <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${author.name.split(' ')[0]}...`}
                      className="flex-1 bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="px-2.5 py-1 rounded text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-40 cursor-pointer"
                    >
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyingToCommentId(null)}
                      className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </form>
                )}

                {/* 3. Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-9 space-y-1.5 pt-1 border-l-2 border-slate-100 pl-3">
                    {comment.replies.map((reply) => {
                      const replyAuthor = usersMap[reply.authorId] || {
                        name: 'Community Member',
                        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
                        isAlumni: false,
                      };

                      return (
                        <div key={reply.id} className="flex items-start gap-2">
                          <img
                            src={replyAuthor.avatar}
                            alt={replyAuthor.name}
                            className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                          />
                          <div className="bg-slate-100 rounded-md p-2 flex-1 space-y-0.5">
                            <div className="flex items-baseline justify-between gap-1">
                              <span className="text-[11px] font-bold text-slate-900">{replyAuthor.name}</span>
                              <span className="text-[9px] text-slate-400">{reply.createdAt}</span>
                            </div>
                            <p className="text-xs text-slate-800 leading-snug">{reply.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
