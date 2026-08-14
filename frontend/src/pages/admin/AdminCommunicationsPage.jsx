import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useApp } from '../../context/AppContext';
import { adminUserService } from '../../services/adminUserService';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Send,
  Edit,
  Trash2,
  XCircle,
  CheckCircle2,
  Clock,
  Users,
  Eye,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
  Building,
  GraduationCap,
  MapPin,
  FileText
} from 'lucide-react';

export const AdminCommunicationsPage = () => {
  const { showNotification } = useApp();

  // Listing state
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState({
    totalAnnouncements: 0,
    publishedCount: 0,
    draftCount: 0,
    cancelledCount: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  // Filter & search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  // Compose / Edit Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formType, setFormType] = useState('GENERAL');
  const [formAudienceType, setFormAudienceType] = useState('ALL');
  const [formBranch, setFormBranch] = useState('');
  const [formBatch, setFormBatch] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formSelectedUsers, setFormSelectedUsers] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [audienceCount, setAudienceCount] = useState(null);
  const [isEstimatingAudience, setIsEstimatingAudience] = useState(false);

  // Details Modal State
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Publish Confirmation Dialog State
  const [publishingId, setPublishingId] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Load announcements list
  const fetchNotifications = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    setErrorStatus(null);
    try {
      const res = await adminUserService.getNotifications({
        q: searchQuery.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        page,
        pageSize: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (res) {
        const list = Array.isArray(res)
          ? res
          : (Array.isArray(res.notifications) ? res.notifications : (Array.isArray(res.data) ? res.data : []));
        setNotifications(list);

        if (res.summary) {
          setSummary(res.summary);
        } else if (Array.isArray(list)) {
          setSummary({
            totalAnnouncements: list.length,
            publishedCount: list.filter((n) => n.status === 'PUBLISHED').length,
            draftCount: list.filter((n) => n.status === 'DRAFT').length,
            cancelledCount: list.filter((n) => n.status === 'CANCELLED').length,
          });
        }

        if (res.pagination) {
          setPagination(res.pagination);
        } else {
          setPagination((prev) => ({
            ...prev,
            page,
            totalCount: res.totalCount ?? list.length,
            totalPages: res.totalPages ?? (Math.ceil(list.length / 10) || 1),
            hasNext: res.hasNext ?? false,
            hasPrev: res.hasPrev ?? (page > 1),
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin notifications:', err);
      setError(err.message || 'Failed to fetch announcements from PostgreSQL database.');
      setErrorStatus(err.status || null);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  // Preview live audience count when targeting changes
  const updateAudienceEstimate = useCallback(async () => {
    setIsEstimatingAudience(true);
    try {
      const targetFilters = {};
      if (formAudienceType === 'CUSTOM') {
        if (formBranch.trim()) targetFilters.branch = formBranch.trim();
        if (formBatch.trim()) targetFilters.batch = formBatch.trim();
        if (formCity.trim()) targetFilters.city = formCity.trim();
        if (formCompany.trim()) targetFilters.company = formCompany.trim();
        if (formSelectedUsers.trim()) {
          targetFilters.selectedUserIds = formSelectedUsers.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }

      const res = await adminUserService.previewAudience({
        audienceType: formAudienceType,
        targetFilters,
      });

      if (res && res.data && typeof res.data.count === 'number') {
        setAudienceCount(res.data.count);
      } else if (typeof res.count === 'number') {
        setAudienceCount(res.count);
      }
    } catch (e) {
      console.warn('Failed to estimate audience:', e);
    } finally {
      setIsEstimatingAudience(false);
    }
  }, [formAudienceType, formBranch, formBatch, formCity, formCompany, formSelectedUsers]);

  useEffect(() => {
    if (isComposeOpen) {
      const timer = setTimeout(() => {
        updateAudienceEstimate();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isComposeOpen, updateAudienceEstimate]);

  const handleOpenCompose = (announcement = null) => {
    if (announcement) {
      setEditingId(announcement.id);
      setFormTitle(announcement.title || '');
      setFormMessage(announcement.message || '');
      setFormType(announcement.type || 'GENERAL');
      setFormAudienceType(announcement.audienceType || 'ALL');
      const tf = announcement.targetFilters || {};
      setFormBranch(tf.branch || '');
      setFormBatch(tf.batch || tf.graduationYear ? String(tf.batch || tf.graduationYear) : '');
      setFormCity(tf.city || tf.location || '');
      setFormCompany(tf.company || '');
      setFormSelectedUsers(Array.isArray(tf.selectedUserIds) ? tf.selectedUserIds.join(', ') : '');
    } else {
      setEditingId(null);
      setFormTitle('');
      setFormMessage('');
      setFormType('GENERAL');
      setFormAudienceType('ALL');
      setFormBranch('');
      setFormBatch('');
      setFormCity('');
      setFormCompany('');
      setFormSelectedUsers('');
    }
    setIsComposeOpen(true);
  };

  const handleCloseCompose = () => {
    setIsComposeOpen(false);
    setEditingId(null);
  };

  const handleSaveDraft = async (e) => {
    e?.preventDefault();
    if (!formTitle.trim()) {
      showNotification('Please enter a title for the announcement.', 'error');
      return;
    }
    if (!formMessage.trim()) {
      showNotification('Please enter the announcement message content.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const targetFilters = {};
      if (formAudienceType === 'CUSTOM') {
        if (formBranch.trim()) targetFilters.branch = formBranch.trim();
        if (formBatch.trim()) targetFilters.batch = formBatch.trim();
        if (formCity.trim()) targetFilters.city = formCity.trim();
        if (formCompany.trim()) targetFilters.company = formCompany.trim();
        if (formSelectedUsers.trim()) {
          targetFilters.selectedUserIds = formSelectedUsers.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }

      const payload = {
        title: formTitle.trim(),
        message: formMessage.trim(),
        type: formType,
        audienceType: formAudienceType,
        targetFilters,
      };

      if (editingId) {
        await adminUserService.updateNotification(editingId, payload);
        showNotification('Announcement draft updated successfully.', 'success');
        handleCloseCompose();
        fetchNotifications(pagination.page);
      } else {
        await adminUserService.createNotification(payload);
        showNotification('Announcement draft saved successfully.', 'success');
        handleCloseCompose();
        fetchNotifications(1);
      }
    } catch (err) {
      console.error('Failed to save announcement:', err);
      showNotification(err.message || 'Failed to save announcement draft.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishConfirm = async () => {
    if (!publishingId) return;
    setIsPublishing(true);
    try {
      const res = await adminUserService.publishNotification(publishingId);
      const recipientCount = res?.data?.statistics?.totalRecipients ?? res?.statistics?.totalRecipients ?? 0;
      showNotification(`Announcement published successfully to ${recipientCount} recipients!`, 'success');
      setPublishingId(null);
      fetchNotifications(pagination.page);
    } catch (err) {
      console.error('Failed to publish announcement:', err);
      showNotification(err.message || 'Failed to publish announcement.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCancelAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this announcement draft?')) return;
    try {
      await adminUserService.cancelNotification(id);
      showNotification('Announcement draft cancelled.', 'info');
      fetchNotifications(pagination.page);
    } catch (err) {
      console.error('Failed to cancel announcement:', err);
      showNotification(err.message || 'Failed to cancel announcement.', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement record?')) return;
    try {
      await adminUserService.deleteNotification(id);
      showNotification('Announcement deleted successfully.', 'success');
      fetchNotifications(pagination.page);
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      showNotification(err.message || 'Failed to delete announcement.', 'error');
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await adminUserService.getNotificationById(id);
      setSelectedAnnouncement(res.data || res);
      setIsDetailsOpen(true);
    } catch (err) {
      console.error('Failed to load announcement details:', err);
      showNotification(err.message || 'Failed to load announcement details.', 'error');
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">Urgent</span>;
      case 'EVENT':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">Event</span>;
      case 'OPPORTUNITY':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">Opportunity</span>;
      case 'MAINTENANCE':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">Maintenance</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">General</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Published</span>
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Draft</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-red-700" />
              <span>Communications & Announcements</span>
            </h1>
            <p className="text-xs text-slate-500">
              Compose, segment, publish, and track administrative announcements and platform alerts across the JECRC community.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenCompose()}
            className="px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Compose Announcement</span>
          </button>
        </div>

        {/* 1. Summary Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold">Total Created</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xl font-bold text-slate-900">{summary.totalAnnouncements}</p>
            <span className="text-[10px] text-slate-400">All announcements in PostgreSQL</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold">Active / Published</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-emerald-700">{summary.publishedCount}</p>
            <span className="text-[10px] text-emerald-600">Delivered to resolved audiences</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold">Pending Drafts</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xl font-bold text-amber-700">{summary.draftCount}</p>
            <span className="text-[10px] text-amber-600">Editable before transmission</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold">Cancelled</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-xl font-bold text-slate-700">{summary.cancelledCount}</p>
            <span className="text-[10px] text-slate-400">Archived drafts</span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-red-900">
                  {errorStatus === 401 ? 'Session Expired' : 'Failed to load communications'}
                </p>
                <p className="text-[11px] text-red-700">
                  {errorStatus === 401
                    ? 'Your administrator session has expired. Please log in again to continue.'
                    : error}
                </p>
              </div>
            </div>
            {errorStatus === 401 ? (
              <button
                type="button"
                onClick={() => window.location.href = '/login'}
                className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                Log In Again
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fetchNotifications(pagination.page)}
                className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* 2. Filter & Search Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search announcements by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="GENERAL">General</option>
                <option value="URGENT">Urgent</option>
                <option value="EVENT">Event</option>
                <option value="OPPORTUNITY">Opportunity</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>

              <button
                type="button"
                onClick={() => fetchNotifications(1)}
                title="Refresh Announcements"
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

          </div>
        </div>

        {/* 3. Announcements List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-red-700" />
              <p>Loading announcement records from PostgreSQL...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
              <div>
                <p className="text-xs font-bold text-slate-700">No announcements found</p>
                <p className="text-[11px] text-slate-400">
                  {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'No records match your active search and filter criteria.'
                    : 'Get started by composing your first administrative announcement.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCompose()}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Compose Announcement
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getTypeBadge(ann.type)}
                      {getStatusBadge(ann.status)}
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Audience: {ann.audienceType}
                      </span>
                    </div>

                    <h2 
                      onClick={() => handleViewDetails(ann.id)}
                      className="text-xs font-bold text-slate-900 truncate hover:text-red-700 cursor-pointer"
                    >
                      {ann.title}
                    </h2>

                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {ann.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 pt-0.5">
                      <span>Created: {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : 'N/A'}</span>
                      {ann.publishedAt && (
                        <span className="text-emerald-700 font-medium">
                          Published: {new Date(ann.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                      {ann.status === 'PUBLISHED' && (
                        <span className="text-slate-600 font-semibold inline-flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>{ann.statistics?.totalRecipients || 0} Recipients ({ann.statistics?.readPercentage || 0}% read)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleViewDetails(ann.id)}
                      className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {ann.status === 'DRAFT' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenCompose(ann)}
                          className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPublishingId(ann.id)}
                          className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Publish</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCancelAnnouncement(ann.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Cancel Draft"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {ann.status === 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>
                Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.totalCount} records)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={!pagination.hasPrev}
                  onClick={() => fetchNotifications(pagination.page - 1)}
                  className="px-2.5 py-1 rounded bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={!pagination.hasNext}
                  onClick={() => fetchNotifications(pagination.page + 1)}
                  className="px-2.5 py-1 rounded bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Compose / Edit Announcement Modal */}
        {isComposeOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-red-700" />
                  <h2 className="text-sm font-bold text-slate-900">
                    {editingId ? 'Edit Announcement Draft' : 'Compose Administrative Announcement'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleCloseCompose}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveDraft} className="space-y-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Announcement Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Alumni Meet 2026 Registration Open"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600"
                  />
                </div>

                {/* Category Type */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Notification Category
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {['GENERAL', 'URGENT', 'EVENT', 'OPPORTUNITY', 'MAINTENANCE'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormType(type)}
                        className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                          formType === type
                            ? 'bg-red-50 text-red-700 border-red-300 font-bold shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Audience */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Target Audience Segment
                    </label>
                    <span className="text-[11px] text-slate-500 inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                      <Users className="w-3 h-3 text-slate-500" />
                      <span>
                        {isEstimatingAudience
                          ? 'Calculating...'
                          : `Estimated reach: ${audienceCount !== null ? audienceCount : '—'} users`}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'ALL', label: 'All Users' },
                      { id: 'STUDENTS', label: 'Students' },
                      { id: 'ALUMNI', label: 'Alumni' },
                      { id: 'ADMINS', label: 'Admins' },
                      { id: 'CUSTOM', label: 'Custom' },
                    ].map((aud) => (
                      <button
                        key={aud.id}
                        type="button"
                        onClick={() => setFormAudienceType(aud.id)}
                        className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                          formAudienceType === aud.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {aud.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Filters Accordion */}
                {formAudienceType === 'CUSTOM' && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 space-y-3 animate-in fade-in-50">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Sliders className="w-3.5 h-3.5 text-red-700" />
                      <span>Custom Targeting Parameters</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 block">Department / Branch</label>
                        <input
                          type="text"
                          placeholder="e.g. Computer Science"
                          value={formBranch}
                          onChange={(e) => setFormBranch(e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-red-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 block">Graduation Batch / Year</label>
                        <input
                          type="number"
                          placeholder="e.g. 2024"
                          value={formBatch}
                          onChange={(e) => setFormBatch(e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-red-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 block">City / Metro Location</label>
                        <input
                          type="text"
                          placeholder="e.g. Jaipur, Bengaluru"
                          value={formCity}
                          onChange={(e) => setFormCity(e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-red-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 block">Company / Employer</label>
                        <input
                          type="text"
                          placeholder="e.g. Google, Infosys"
                          value={formCompany}
                          onChange={(e) => setFormCompany(e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-red-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        Selected Recipient UUIDs (Comma separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1a2b3c4d-..., 5e6f7g8h-..."
                        value={formSelectedUsers}
                        onChange={(e) => setFormSelectedUsers(e.target.value)}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>
                )}

                {/* Message Content */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Announcement Message <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Write your comprehensive administrative announcement message..."
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600"
                  />
                  <span className="text-[10px] text-slate-400 block text-right">
                    {formMessage.length} / 10000 characters
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseCompose}
                    className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save as Draft'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 5. Publish Confirmation Dialog */}
        {publishingId && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Publish Announcement</h3>
                  <p className="text-xs text-slate-500">
                    This will immediately broadcast the announcement to all users in the resolved target audience.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-800 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Once published, the announcement becomes immutable and recipient delivery rows will be generated in PostgreSQL.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPublishingId(null)}
                  disabled={isPublishing}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handlePublishConfirm}
                  disabled={isPublishing}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-2xs inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isPublishing ? 'Publishing...' : 'Confirm & Publish'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. Announcement Details & Stats Modal */}
        {isDetailsOpen && selectedAnnouncement && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  {getTypeBadge(selectedAnnouncement.type)}
                  {getStatusBadge(selectedAnnouncement.status)}
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">{selectedAnnouncement.title}</h2>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedAnnouncement.message}
                </div>
              </div>

              {/* Delivery Statistics */}
              {selectedAnnouncement.status === 'PUBLISHED' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <span>Live Recipient & Delivery Statistics</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-center">
                      <span className="text-[10px] font-semibold text-slate-500 block">Total Recipients</span>
                      <span className="text-base font-bold text-slate-900">
                        {selectedAnnouncement.statistics?.totalRecipients || 0}
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200/80 text-center">
                      <span className="text-[10px] font-semibold text-emerald-700 block">Read Count</span>
                      <span className="text-base font-bold text-emerald-800">
                        {selectedAnnouncement.statistics?.readCount || 0}
                      </span>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200/80 text-center">
                      <span className="text-[10px] font-semibold text-blue-700 block">Read Rate</span>
                      <span className="text-base font-bold text-blue-800">
                        {selectedAnnouncement.statistics?.readPercentage || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-500">Target Audience: </span>
                    <span className="font-bold text-slate-800">{selectedAnnouncement.audienceType}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Created By: </span>
                    <span>{selectedAnnouncement.createdBy?.name || 'Administrator'}</span>
                  </div>
                  {selectedAnnouncement.publishedAt && (
                    <div>
                      <span className="font-semibold text-slate-500">Published At: </span>
                      <span>{new Date(selectedAnnouncement.publishedAt).toLocaleString()}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-slate-500">Created At: </span>
                    <span>{new Date(selectedAnnouncement.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
