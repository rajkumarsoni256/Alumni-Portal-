import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  ExternalLink, 
  Sparkles, 
  Plus, 
  Search, 
  X, 
  Users, 
  Check, 
  MessageSquare,
  Bookmark,
  Trash2,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getRoleCapabilities } from '../utils/roleCapabilities';
import { jobService } from '../services/jobService';
import { Link } from 'react-router-dom';

export const JobsPage = () => {
  const { activeRole, currentUser, showNotification } = useApp();
  const caps = getRoleCapabilities(activeRole);

  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'my_posts'
  const [filterType, setFilterType] = useState('All'); // 'All' | 'Internship' | 'Full-time' | 'Remote'
  const [searchQuery, setSearchQuery] = useState('');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for posting a job
  const [newJob, setNewJob] = useState({
    title: '',
    company: currentUser?.company || '',
    location: 'Bengaluru, India',
    type: 'Full-time',
    stipend: '₹18 - ₹24 LPA',
    description: 'We are looking for talented JECRC graduates to join our team.',
    tags: 'Java, Spring Boot, AWS',
  });

  const fetchJobs = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await jobService.getJobs({
        page: 1,
        limit: 30,
        search: searchQuery,
        type: filterType,
        myPosts: activeTab === 'my_posts',
      });

      setJobs(result.jobs || []);
      setTotalJobs(result.total || (result.jobs || []).length);
    } catch (err) {
      console.warn('Failed to load jobs:', err);
      setHasError(true);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [activeTab, filterType, searchQuery]);

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!newJob.title.trim() || !newJob.company.trim()) return;

    setIsSubmitting(true);
    try {
      const createdJob = await jobService.createJob({
        title: newJob.title.trim(),
        company: newJob.company.trim(),
        location: newJob.location.trim(),
        type: newJob.type,
        salary: newJob.stipend.trim(),
        stipend: newJob.stipend.trim(),
        description: newJob.description.trim(),
        skills: newJob.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });

      if (createdJob) {
        setJobs((prev) => [createdJob, ...prev]);
        setTotalJobs((prev) => prev + 1);
        setIsPostModalOpen(false);
        setNewJob({
          title: '',
          company: currentUser?.company || '',
          location: 'Bengaluru, India',
          type: 'Full-time',
          stipend: '₹18 - ₹24 LPA',
          description: 'We are looking for talented JECRC graduates to join our team.',
          tags: 'Java, Spring Boot, AWS',
        });
        showNotification('Job opportunity posted successfully to JECRC community!');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to post job opportunity', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookmarkToggle = async (jobId) => {
    try {
      const res = await jobService.toggleBookmark(jobId);
      const isSaved = res.isBookmarked !== undefined ? res.isBookmarked : res.isSaved;

      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, isBookmarked: isSaved, isSaved: isSaved } : j))
      );
      showNotification(isSaved ? 'Job bookmarked' : 'Bookmark removed', 'info');
    } catch (err) {
      showNotification(err.message || 'Failed to bookmark job', 'error');
    }
  };

  const handleApplyJob = async (job) => {
    try {
      const res = await jobService.applyForJob(job.id, {
        coverNote: 'Requesting referral via JECRC Alumni Community Portal',
      });

      setJobs((prev) =>
        prev.map((j) => {
          if (j.id === job.id) {
            return {
              ...j,
              hasApplied: true,
              applicationStatus: 'APPLIED',
              applicantsCount: res.applicantsCount !== undefined ? res.applicantsCount : j.applicantsCount + 1,
            };
          }
          return j;
        })
      );
      showNotification(`Referral application submitted to ${job.company}!`, 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to apply for job', 'error');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job opportunity?')) return;
    try {
      await jobService.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setTotalJobs((prev) => Math.max(0, prev - 1));
      showNotification('Job posting deleted successfully', 'info');
    } catch (err) {
      showNotification(err.message || 'Failed to delete job posting', 'error');
    }
  };

  return (
    <PageContainer>
      <div className="space-y-4">
        
        {/* Header Banner with Role Actions */}
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                {caps.isAlumni ? 'Alumni Recruitment & Referral Portal' : 'Direct Alumni Referrals'}
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              {caps.isAlumni
                ? 'Help JECRC peers start their careers by sharing openings at your company.'
                : 'Alumni review candidate profiles directly before referring resumes to internal portals.'}
            </p>
          </div>

          {caps.canPostJobs && (
            <button
              type="button"
              onClick={() => setIsPostModalOpen(true)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Post a Job / Referral</span>
            </button>
          )}
        </div>

        {/* Filter Bar & Tabs */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by job title, company, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 hover:bg-slate-200/50 focus:bg-white text-slate-900 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-transparent focus:border-slate-300 focus:outline-none transition-colors"
              />
            </div>

            {/* Role-specific Tab Switcher (Alumni only) */}
            {caps.isAlumni && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    activeTab === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Openings
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('my_posts')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    activeTab === 'my_posts' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Your Postings
                </button>
              </div>
            )}
          </div>

          {/* Pill Filters */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0 mr-1">Type:</span>
            {['All', 'Internship', 'Full-time', 'Remote'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  filterType === type
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Job Cards */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-red-700 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Loading verified job openings from database...</p>
            </div>
          ) : hasError ? (
            <div className="bg-white rounded-xl border border-rose-200 p-10 text-center space-y-3">
              <Briefcase className="w-8 h-8 mx-auto text-rose-500" />
              <h4 className="text-xs font-bold text-slate-900">Failed to load jobs</h4>
              <p className="text-xs text-slate-500">Please check your network connection and try again.</p>
              <button
                type="button"
                onClick={fetchJobs}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-2">
              <Briefcase className="w-8 h-8 mx-auto text-slate-400" />
              <h4 className="text-xs font-bold text-slate-900">No job openings found</h4>
              <p className="text-xs text-slate-500">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            jobs.map((job) => {
              const isMyPosting = job.isMyPosting;
              const hasApplied = job.hasApplied || job.applicationStatus !== null;

              return (
                <div
                  key={job.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">{job.title}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified Referral
                        </span>
                        {isMyPosting && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                            Your Posting
                          </span>
                        )}
                        {hasApplied && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                            <Check className="w-3 h-3 text-blue-600" />
                            Applied
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {job.location}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-medium text-slate-700">{job.type}</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{job.salary || job.stipend}</span>
                        <span className="text-[10px] text-slate-400 block">Posted by {job.postedBy}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleBookmarkToggle(job.id)}
                          className={`p-1.5 rounded-lg border text-slate-400 hover:text-slate-700 transition-colors cursor-pointer ${
                            job.isBookmarked ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200'
                          }`}
                          title={job.isBookmarked ? 'Remove Bookmark' : 'Bookmark Job'}
                        >
                          <Bookmark className="w-4 h-4" fill={job.isBookmarked ? 'currentColor' : 'none'} />
                        </button>

                        {isMyPosting && (
                          <button
                            type="button"
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Delete Job Posting"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {job.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {(job.skills || job.tags || []).map((tag) => (
                        <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {isMyPosting ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{job.applicantsCount} applicants</span>
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="font-semibold text-emerald-600">Active</span>
                          <span className="text-slate-400">•</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteJob(job.id)}
                            className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          {job.postedById && (
                            <Link
                              to={`/messages?userId=${job.postedById}`}
                              className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                              <span>Ask Question</span>
                            </Link>
                          )}

                          <button
                            type="button"
                            disabled={hasApplied}
                            onClick={() => handleApplyJob(job)}
                            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1 shadow-2xs ${
                              hasApplied
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : 'text-white bg-red-700 hover:bg-red-800 cursor-pointer'
                            }`}
                          >
                            <span>{hasApplied ? 'Applied' : 'Request Referral'}</span>
                            {!hasApplied && <ExternalLink className="w-3 h-3" />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Post a Job Modal (Alumni only) */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">Post a Job / Campus Referral</h3>
                <p className="text-[11px] text-slate-500">Share hiring opportunities with JECRC students</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPostModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostJob} className="p-4 space-y-3 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Associate Backend Engineer"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">Company</label>
                  <input
                    type="text"
                    required
                    value={newJob.company}
                    onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">Location</label>
                  <input
                    type="text"
                    required
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">Type</label>
                  <select
                    value={newJob.type}
                    onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  >
                    <option value="Internship">Internship</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">Stipend / CTC</label>
                  <input
                    type="text"
                    required
                    value={newJob.stipend}
                    onChange={(e) => setNewJob({ ...newJob, stipend: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Description</label>
                <textarea
                  rows={3}
                  required
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Skills / Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="Java, Spring Boot, AWS, Python"
                  value={newJob.tags}
                  onChange={(e) => setNewJob({ ...newJob, tags: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Post Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
