import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/common/Navbar';
import { PostCard } from '../components/feed/PostCard';
import { FeedSkeletons } from '../components/feed/FeedStates';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { postService } from '../services/postService';

export const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { posts } = useApp();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSinglePost = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      // Check local AppContext posts state first
      const localPost = posts.find((p) => p.id === id);
      if (localPost) {
        setPost(localPost);
        setLoading(false);
        return;
      }

      try {
        const data = await postService.getPostById(id);
        if (isMounted) {
          if (data && (data.post || data.id)) {
            setPost(data.post || data);
          } else {
            setError('Post not found.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load post details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSinglePost();
    return () => { isMounted = false; };
  }, [id, posts]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 space-y-4">
        {/* Back Button Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <span className="text-xs font-bold text-slate-500">Post Detail</span>
        </div>

        {/* Loading State */}
        {loading && <FeedSkeletons count={1} />}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Post Unavailable</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
            </div>
            <Link
              to="/"
              className="inline-block px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors shadow-2xs"
            >
              Return to Community Feed
            </Link>
          </div>
        )}

        {/* Post View */}
        {!loading && !error && post && (
          <div className="space-y-4">
            <PostCard post={post} />
          </div>
        )}
      </main>
    </div>
  );
};
