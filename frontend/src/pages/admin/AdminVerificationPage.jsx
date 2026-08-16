import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { adminUserService } from '../../services/adminUserService';
import { useApp } from '../../context/AppContext';
import { 
  UserCheck, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  AlertCircle, 
  X, 
  Building2, 
  GraduationCap, 
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const AdminVerificationPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useApp();

  const [verifications, setVerifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce Search Query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Pending Verifications from Real PostgreSQL API
  const fetchQueue = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminUserService.getVerifications({
        status: 'PENDING',
        q: debouncedQuery,
        page,
        pageSize,
      });

      if (res) {
        setVerifications(res.verifications || []);
        setTotalCount(res.totalCount || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch verification queue:', err);
      setError(err.message || 'Failed to load verification queue from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [debouncedQuery, page, pageSize]);

  // Direct Approve Handler
  const handleApprove = async (record) => {
    if (!record) return;
    setIsSubmitting(true);
    try {
      await adminUserService.updateVerificationStatus(record.id || record.userId, {
        status: 'APPROVED',
      });
      showNotification(`Alumni account approved for ${record.name}.`, 'success');
      setSelectedRecord(null);
      fetchQueue();
    } catch (err) {
      console.error('Failed to approve candidate:', err);
      showNotification(err.message || 'Failed to approve alumni registration.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Reject Handler
  const handleReject = async () => {
    if (!selectedRecord) return;
    if (!rejectionReason.trim()) {
      showNotification('Please provide a rejection reason.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await adminUserService.updateVerificationStatus(selectedRecord.id || selectedRecord.userId, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      });
      showNotification(`Alumni registration rejected for ${selectedRecord.name}.`, 'success');
      setSelectedRecord(null);
      setShowRejectModal(false);
      setRejectionReason('');
      fetchQueue();
    } catch (err) {
      console.error('Failed to reject candidate:', err);
      showNotification(err.message || 'Failed to reject alumni registration.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3.5">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Alumni Verification Queue</span>
              {totalCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {totalCount} Pending
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500">
              Review institutional records and grant platform access to registered alumni.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchQueue}
              className="px-3 py-1.5 rounded text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="bg-white p-3 rounded-md border border-slate-200 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search candidate name, email, roll number, company, branch..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={fetchQueue} className="font-bold underline cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Verification Queue (Desktop Table + Mobile Cards) */}
        <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
          {/* Mobile Cards View (< md) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500 font-semibold">
                <div className="w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p>Loading verification queue from database...</p>
              </div>
            ) : verifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-900 text-xs">No Pending Requests</p>
                <p className="text-[11px] text-slate-500">All alumni registrations are up to date.</p>
              </div>
            ) : (
              verifications.map((item) => (
                <div key={item.id || item.userId} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-red-50 border border-red-200 text-red-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {item.name ? item.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{item.email}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                      Pending
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Roll Number</span>
                      <span className="font-semibold text-slate-800">{item.universityRollNumber || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Course & Batch</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {item.degree || item.course || 'B.Tech'} {item.graduationYear ? `'${String(item.graduationYear).slice(-2)}` : ''}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Branch / Organization</span>
                      <span className="text-slate-700 font-medium truncate block">
                        {item.branch || 'CSE'} {item.company ? `• ${item.company}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecord(item);
                        setShowRejectModal(false);
                      }}
                      className="flex-1 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors text-center"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecord(item);
                        setShowRejectModal(true);
                        setRejectionReason('');
                      }}
                      className="px-3 py-1.5 bg-white border border-red-300 text-red-700 rounded text-xs font-semibold hover:bg-red-50 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleApprove(item)}
                      className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <tr>
                  <th className="p-3">Applicant Name &amp; Email</th>
                  <th className="p-3">Academic Record (Roll / Degree)</th>
                  <th className="p-3">Branch &amp; Graduation</th>
                  <th className="p-3">Current Company &amp; Designation</th>
                  <th className="p-3">Verification Status</th>
                  <th className="p-3 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500 font-semibold">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs text-slate-500">Fetching pending verification requests from PostgreSQL...</p>
                      </div>
                    </td>
                  </tr>
                ) : verifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                      <p className="font-bold text-slate-900 text-sm">No Pending Verification Requests</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        All alumni registration requests have been reviewed and activated in PostgreSQL.
                      </p>
                    </td>
                  </tr>
                ) : (
                  verifications.map((item) => (
                    <tr key={item.id || item.userId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 text-red-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {item.name ? item.name.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{item.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{item.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <p className="font-bold text-slate-800">{item.universityRollNumber || '—'}</p>
                        <p className="text-[11px] text-slate-500">{item.degree || item.course || 'B.Tech'}</p>
                      </td>

                      <td className="p-3">
                        <p className="font-bold text-slate-800">{item.branch || 'CSE'}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.graduationYear ? `Class of ${item.graduationYear}` : 'Alumni Candidate'}
                        </p>
                      </td>

                      <td className="p-3">
                        <p className="font-semibold text-slate-800">{item.company || '—'}</p>
                        <p className="text-[11px] text-slate-500">{item.designation || '—'}</p>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>Pending Review</span>
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecord(item);
                              setShowRejectModal(false);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecord(item);
                              setShowRejectModal(true);
                              setRejectionReason('');
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-red-50 border border-red-300 text-red-700 rounded text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>

                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleApprove(item)}
                            className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing Page <span className="font-bold text-slate-900">{page}</span> of{' '}
              <span className="font-bold text-slate-900">{totalPages}</span> ({totalCount} total requests)
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="px-2 font-semibold text-slate-700">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Review / Details Modal */}
      {selectedRecord && !showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Candidate Identity Verification</h3>
                <p className="text-[11px] text-slate-500">Review institutional credentials before approving platform access</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 text-sm">{selectedRecord.name}</p>
                <p className="text-slate-600">{selectedRecord.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">University Roll No</span>
                  <span className="font-bold text-slate-900">{selectedRecord.universityRollNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Degree / Course</span>
                  <span className="font-bold text-slate-900">{selectedRecord.degree || selectedRecord.course || 'B.Tech'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Branch</span>
                  <span className="font-bold text-slate-900">{selectedRecord.branch || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Graduation Year</span>
                  <span className="font-bold text-slate-900">{selectedRecord.graduationYear || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Company</span>
                  <span className="font-bold text-slate-900">{selectedRecord.company || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Designation</span>
                  <span className="font-bold text-slate-900">{selectedRecord.designation || '—'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="px-3 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold cursor-pointer"
              >
                Reject Application
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleApprove(selectedRecord)}
                  className="px-3.5 py-1.5 rounded bg-red-700 hover:bg-red-800 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Approving...' : 'Approve Candidate'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {selectedRecord && showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Reject Alumni Registration</h3>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-700">
                Rejecting application for <strong className="text-slate-900">{selectedRecord.name}</strong> ({selectedRecord.email}).
              </p>
              <label className="text-xs font-semibold text-slate-700 block">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejecting this candidate (e.g. Invalid roll number or unverified graduation record)..."
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-red-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleReject}
                className="px-3.5 py-1.5 rounded bg-red-700 hover:bg-red-800 text-white text-xs font-semibold cursor-pointer"
              >
                {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
