import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useApp } from '../../context/AppContext';
import { adminContentService } from '../../services/adminContentService';
import {
  ShieldAlert,
  Briefcase,
  Calendar,
  MessageSquare,
  Search,
  Plus,
  FileSpreadsheet,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  User,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Tag
} from 'lucide-react';

export const AdminContentManagementPage = () => {
  const { showNotification } = useApp();
  const [activeTab, setActiveTab] = useState('jobs'); // 'moderation' | 'jobs' | 'events' | 'mentorship'

  // Common Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --------------------------------------------------------------------------
  // Tab 1: Feed Moderation State
  // --------------------------------------------------------------------------
  const [posts, setPosts] = useState([]);
  const [deletingPostId, setDeletingPostId] = useState(null);

  // --------------------------------------------------------------------------
  // Tab 2: Jobs & Opportunities State
  // --------------------------------------------------------------------------
  const [jobs, setJobs] = useState([]);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    company: 'JECRC University',
    type: 'Full-time',
    location: 'Jaipur, Rajasthan',
    salary: 'Disclosed on application',
    description: '',
    requirements: '',
    skills: '',
    applicationUrl: '',
    status: 'OPEN',
  });
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);
  const [isApplicantsModalOpen, setIsApplicantsModalOpen] = useState(false);

  // --------------------------------------------------------------------------
  // Tab 3: Events State
  // --------------------------------------------------------------------------
  const [events, setEvents] = useState([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'Workshops',
    eventType: 'ALUMNI_MEETUP',
    speaker: 'JECRC Leadership & Board',
    location: 'JECRC Campus, Jaipur',
    isOnline: false,
    meetingUrl: '',
    startAt: '',
    endAt: '',
    registrationDeadline: '',
    capacity: 100,
    status: 'PUBLISHED',
    imageUrl: '',
  });
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);

  // --------------------------------------------------------------------------
  // Tab 4: Mentorship State
  // --------------------------------------------------------------------------
  const [mentorships, setMentorships] = useState([]);

  // Load Data by Active Tab
  const loadTabData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'moderation') {
        const res = await adminContentService.getAdminPosts({ search: searchQuery.trim() || undefined });
        setPosts(res.posts || []);
      } else if (activeTab === 'jobs') {
        const res = await adminContentService.getAdminJobs({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery.trim() || undefined,
        });
        setJobs(res.jobs || []);
      } else if (activeTab === 'events') {
        const res = await adminContentService.getAdminEvents({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery.trim() || undefined,
        });
        setEvents(res.events || []);
      } else if (activeTab === 'mentorship') {
        const res = await adminContentService.getAdminMentorship({
          status: statusFilter !== 'all' ? statusFilter : undefined,
        });
        setMentorships(res.mentorships || []);
      }
    } catch (err) {
      console.error(`Failed to load ${activeTab} content:`, err);
      setError(err.message || 'Failed to fetch content from database.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery, statusFilter]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  // --------------------------------------------------------------------------
  // Handlers: Feed Moderation
  // --------------------------------------------------------------------------
  const handleDeletePost = async (id) => {
    try {
      await adminContentService.deleteAdminPost(id);
      showNotification('Post moderated and removed successfully', 'success');
      setDeletingPostId(null);
      loadTabData();
    } catch (err) {
      showNotification(err.message || 'Failed to delete post', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Jobs
  // --------------------------------------------------------------------------
  const handleSaveJob = async (e) => {
    e.preventDefault();
    try {
      if (editingJobId) {
        await adminContentService.updateAdminJob(editingJobId, jobForm);
        showNotification('Job posting updated successfully', 'success');
      } else {
        await adminContentService.createAdminJob(jobForm);
        showNotification('Official JECRC Opportunity published successfully', 'success');
      }
      setIsJobModalOpen(false);
      setEditingJobId(null);
      setJobForm({
        title: '',
        company: 'JECRC University',
        type: 'Full-time',
        location: 'Jaipur, Rajasthan',
        salary: 'Disclosed on application',
        description: '',
        requirements: '',
        skills: '',
        applicationUrl: '',
        status: 'OPEN',
      });
      loadTabData();
    } catch (err) {
      showNotification(err.message || 'Failed to save job posting', 'error');
    }
  };

  const handleUpdateJobStatus = async (id, newStatus) => {
    try {
      await adminContentService.updateAdminJobStatus(id, newStatus);
      showNotification(`Job status updated to ${newStatus}`, 'success');
      loadTabData();
    } catch (err) {
      showNotification(err.message || 'Failed to update job status', 'error');
    }
  };

  const handleViewApplicants = async (jobId) => {
    try {
      const details = await adminContentService.getAdminJobById(jobId);
      setSelectedJobDetails(details);
      setIsApplicantsModalOpen(true);
    } catch (err) {
      showNotification(err.message || 'Failed to fetch job applicants', 'error');
    }
  };

  const handleExportApplicants = async (jobId) => {
    try {
      await adminContentService.exportJobApplicantsCSV(jobId);
      showNotification('Applicants CSV downloaded successfully', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to export applicants', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Events
  // --------------------------------------------------------------------------
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      await adminContentService.createAdminEvent(eventForm);
      showNotification('Official JECRC Event published successfully', 'success');
      setIsEventModalOpen(false);
      setEventForm({
        title: '',
        description: '',
        category: 'Workshops',
        eventType: 'ALUMNI_MEETUP',
        speaker: 'JECRC Leadership & Board',
        location: 'JECRC Campus, Jaipur',
        isOnline: false,
        meetingUrl: '',
        startAt: '',
        endAt: '',
        registrationDeadline: '',
        capacity: 100,
        status: 'PUBLISHED',
        imageUrl: '',
      });
      loadTabData();
    } catch (err) {
      showNotification(err.message || 'Failed to save event', 'error');
    }
  };

  const handleUpdateEventStatus = async (id, newStatus) => {
    try {
      await adminContentService.updateAdminEventStatus(id, newStatus);
      showNotification(`Event status updated to ${newStatus}`, 'success');
      loadTabData();
    } catch (err) {
      showNotification(err.message || 'Failed to update event status', 'error');
    }
  };

  const handleViewAttendees = async (eventId) => {
    try {
      const details = await adminContentService.getAdminEventById(eventId);
      setSelectedEventDetails(details);
      setIsAttendeesModalOpen(true);
    } catch (err) {
      showNotification(err.message || 'Failed to fetch event attendees', 'error');
    }
  };

  const handleExportAttendees = async (eventId) => {
    try {
      await adminContentService.exportEventAttendeesCSV(eventId);
      showNotification('Attendees CSV downloaded successfully', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to export attendees', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Content &amp; Opportunity Management
            </h1>
            <p className="text-xs text-slate-500">
              Manage official University jobs, events, feed moderation, and mentorship oversight.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'jobs' && (
              <button
                type="button"
                onClick={() => {
                  setEditingJobId(null);
                  setIsJobModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Official Job</span>
              </button>
            )}

            {activeTab === 'events' && (
              <button
                type="button"
                onClick={() => setIsEventModalOpen(true)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Official Event</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('jobs'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2 ${
              activeTab === 'jobs' ? 'border-red-700 text-red-700 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Jobs &amp; Opportunities</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('events'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2 ${
              activeTab === 'events' ? 'border-red-700 text-red-700 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Events Management</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('moderation'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2 ${
              activeTab === 'moderation' ? 'border-red-700 text-red-700 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Feed Moderation</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('mentorship'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2 ${
              activeTab === 'mentorship' ? 'border-red-700 text-red-700 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Mentorship Oversight</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
            />
          </div>

          {(activeTab === 'jobs' || activeTab === 'events' || activeTab === 'mentorship') && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-600 bg-white"
              >
                <option value="all">All Statuses</option>
                {activeTab === 'jobs' && (
                  <>
                    <option value="OPEN">Open / Active</option>
                    <option value="DRAFT">Draft</option>
                    <option value="CLOSED">Closed</option>
                    <option value="EXPIRED">Expired</option>
                  </>
                )}
                {activeTab === 'events' && (
                  <>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="COMPLETED">Completed</option>
                  </>
                )}
                {activeTab === 'mentorship' && (
                  <>
                    <option value="PENDING">Pending</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="DECLINED">Declined</option>
                  </>
                )}
              </select>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={loadTabData} className="font-bold underline cursor-pointer">Retry</button>
          </div>
        )}

        {/* TAB 1: JOBS & OPPORTUNITIES */}
        {activeTab === 'jobs' && (
          <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500 font-semibold">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Job Postings Found</p>
                <p className="text-xs text-slate-500">There are no jobs matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="p-3">Job Title &amp; Company</th>
                      <th className="p-3">Posted By</th>
                      <th className="p-3">Type / Location</th>
                      <th className="p-3 text-center">Applicants</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {jobs.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{j.title}</p>
                          <p className="text-[11px] text-slate-500">{j.company}</p>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">{j.postedBy?.name}</span>
                            {j.postedBy?.isOfficial && (
                              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                                Official JECRC
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-slate-700">{j.type}</p>
                          <p className="text-[11px] text-slate-500">{j.location}</p>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-900">
                          {j.applicantsCount}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              j.status === 'OPEN'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : j.status === 'DRAFT'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {j.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewApplicants(j.id)}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Applicants
                            </button>

                            {j.status === 'OPEN' ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateJobStatus(j.id, 'CLOSED')}
                                className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Close
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUpdateJobStatus(j.id, 'OPEN')}
                                className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Open
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EVENTS MANAGEMENT */}
        {activeTab === 'events' && (
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500 font-semibold">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Events Found</p>
                <p className="text-xs text-slate-500">There are no events matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="p-3">Event Title &amp; Category</th>
                      <th className="p-3">Speaker / Host</th>
                      <th className="p-3">Location / Type</th>
                      <th className="p-3 text-center">Registered / Capacity</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {events.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{ev.title}</p>
                          <p className="text-[11px] text-slate-500">{ev.category}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-800">{ev.speaker}</p>
                          <p className="text-[11px] text-slate-500">By {ev.createdBy?.name}</p>
                        </td>
                        <td className="p-3">
                          <p className="text-slate-700">{ev.location}</p>
                          <p className="text-[11px] text-slate-500">{ev.isOnline ? 'Online Meeting' : 'In-Person'}</p>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-900">
                          {ev.registeredCount} / {ev.capacity || '∞'}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ev.status === 'PUBLISHED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ev.status === 'DRAFT'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {ev.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewAttendees(ev.id)}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Attendees
                            </button>

                            {ev.status === 'PUBLISHED' ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateEventStatus(ev.id, 'CANCELLED')}
                                className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUpdateEventStatus(ev.id, 'PUBLISHED')}
                                className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Publish
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FEED MODERATION */}
        {activeTab === 'moderation' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-8 bg-white rounded-xl border text-center text-xs text-slate-500 font-semibold">Loading feed posts...</div>
            ) : posts.length === 0 ? (
              <div className="p-12 bg-white rounded-xl border text-center space-y-3">
                <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Posts Found</p>
                <p className="text-xs text-slate-500">There are no community posts matching your search query.</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                        alt={post.author?.name}
                        className="w-8 h-8 rounded-full object-cover border"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{post.author?.name}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {post.author?.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{post.author?.email}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeletingPostId(post.id)}
                      className="px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Moderate / Delete</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">{post.content}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                    <span>Likes: <strong>{post.likesCount}</strong></span>
                    <span>Comments: <strong>{post.commentsCount}</strong></span>
                    <span>Posted: {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: MENTORSHIP OVERSIGHT */}
        {activeTab === 'mentorship' && (
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500 font-semibold">Loading mentorship requests...</div>
            ) : mentorships.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Mentorship Requests Found</p>
                <p className="text-xs text-slate-500">No mentorship interactions recorded.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="p-3">Student</th>
                      <th className="p-3">Mentor</th>
                      <th className="p-3">Topic &amp; Message</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Requested At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {mentorships.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{m.student?.name}</p>
                          <p className="text-[11px] text-slate-500">{m.student?.email}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{m.mentor?.name}</p>
                          <p className="text-[11px] text-slate-500">{m.mentor?.email}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-800">{m.topic}</p>
                          {m.message && <p className="text-[11px] text-slate-500 truncate max-w-xs">{m.message}</p>}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.status === 'ACCEPTED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : m.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="p-3 text-right text-slate-500">
                          {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* CREATE / EDIT JOB MODAL */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              {editingJobId ? 'Edit Job Posting' : 'Publish Official JECRC Opportunity'}
            </h2>

            <form onSubmit={handleSaveJob} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="e.g. Software Development Engineer - I"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company *</label>
                  <input
                    type="text"
                    required
                    value={jobForm.company}
                    onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Job Type</label>
                  <select
                    value={jobForm.type}
                    onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-600 focus:outline-none bg-white"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Salary / Stipend</label>
                  <input
                    type="text"
                    value={jobForm.salary}
                    onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Provide role description and key expectations..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={jobForm.skills}
                  onChange={(e) => setJobForm({ ...jobForm, skills: e.target.value })}
                  placeholder="Java, Python, SQL, React"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Application URL</label>
                <input
                  type="url"
                  value={jobForm.applicationUrl}
                  onChange={(e) => setJobForm({ ...jobForm, applicationUrl: e.target.value })}
                  placeholder="https://careers.company.com/job/123"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsJobModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold cursor-pointer"
                >
                  Publish Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW JOB APPLICANTS MODAL */}
      {isApplicantsModalOpen && selectedJobDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Applicants: {selectedJobDetails.title}
                </h2>
                <p className="text-xs text-slate-500">{selectedJobDetails.company} • Total Applicants: {selectedJobDetails.applicantsCount}</p>
              </div>
              <button
                type="button"
                onClick={() => handleExportApplicants(selectedJobDetails.id)}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            {selectedJobDetails.applicants.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-semibold">No applications submitted yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="p-2.5">Applicant Name</th>
                      <th className="p-2.5">Roll Number</th>
                      <th className="p-2.5">Academic Details</th>
                      <th className="p-2.5">Applied Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {selectedJobDetails.applicants.map((app) => (
                      <tr key={app.id}>
                        <td className="p-2.5">
                          <p className="font-bold text-slate-900">{app.name}</p>
                          <p className="text-[11px] text-slate-500">{app.email}</p>
                        </td>
                        <td className="p-2.5 font-bold text-slate-700">{app.rollNumber}</td>
                        <td className="p-2.5 text-slate-600">{app.course} ({app.branch}) - Batch {app.graduationYear}</td>
                        <td className="p-2.5 text-slate-500">{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recently'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setIsApplicantsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Create Official JECRC Event
            </h2>

            <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. Annual Alumni Meet 2026"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-600 focus:outline-none bg-white"
                  >
                    <option value="Workshops">Workshops</option>
                    <option value="Reunions">Reunions</option>
                    <option value="Webinars">Webinars</option>
                    <option value="Networking">Networking</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Speaker / Guest</label>
                  <input
                    type="text"
                    value={eventForm.speaker}
                    onChange={(e) => setEventForm({ ...eventForm, speaker: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Provide event details, schedule, and guest speakers..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold cursor-pointer"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW EVENT ATTENDEES MODAL */}
      {isAttendeesModalOpen && selectedEventDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Attendees: {selectedEventDetails.title}
                </h2>
                <p className="text-xs text-slate-500">Registered: {selectedEventDetails.registeredCount} / {selectedEventDetails.capacity || 'Unlimited'}</p>
              </div>
              <button
                type="button"
                onClick={() => handleExportAttendees(selectedEventDetails.id)}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            {selectedEventDetails.attendees.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-semibold">No registrations yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="p-2.5">Attendee Name</th>
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5">Roll Number</th>
                      <th className="p-2.5">Academic Info</th>
                      <th className="p-2.5">Registered Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {selectedEventDetails.attendees.map((att) => (
                      <tr key={att.id}>
                        <td className="p-2.5">
                          <p className="font-bold text-slate-900">{att.name}</p>
                          <p className="text-[11px] text-slate-500">{att.email}</p>
                        </td>
                        <td className="p-2.5 font-bold text-slate-700">{att.role}</td>
                        <td className="p-2.5 font-semibold text-slate-700">{att.rollNumber}</td>
                        <td className="p-2.5 text-slate-600">{att.course} - Batch {att.graduationYear}</td>
                        <td className="p-2.5 text-slate-500">{att.registeredAt ? new Date(att.registeredAt).toLocaleDateString() : 'Recently'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setIsAttendeesModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE POST MODAL */}
      {deletingPostId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Moderate Post</h3>
            <p className="text-xs text-slate-600">Are you sure you want to delete this community post? This action is immutable and will be recorded in audit logs.</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPostId(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeletePost(deletingPostId)}
                className="px-3 py-1.5 rounded-lg bg-red-700 text-white text-xs font-semibold hover:bg-red-800 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
