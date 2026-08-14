import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { adminUserService } from '../../services/adminUserService';
import { ExportModal } from '../../components/admin/export/ExportModal';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Filter, 
  FileSpreadsheet, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  Eye, 
  CheckSquare,
  Square,
  AlertCircle,
  ChevronDown
} from 'lucide-react';

export const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showNotification } = useApp();

  // Search State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    role: searchParams.get('role') || 'all',
    status: searchParams.get('status') || 'all',
    branch: searchParams.get('branch') || 'all',
    batch: searchParams.get('batch') || 'all',
  });

  // Table State
  const [sortField, setSortField] = useState('lastUpdated');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Data & Summary Stats State
  const [dataResult, setDataResult] = useState({
    users: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  });
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    students: 0,
    alumni: 0,
    pendingApprovals: 0,
    administrators: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce search query
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch summary stats from backend
  const fetchStats = async () => {
    try {
      const stats = await adminUserService.getUserStats();
      if (stats) {
        setUserStats(stats);
      }
    } catch (err) {
      console.error('Failed to load user stats:', err);
    }
  };

  // Fetch users from real PostgreSQL backend API
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminUserService.getAdminUsers({
        searchQuery: debouncedQuery,
        filters: {
          role: filters.role,
          profileStatus: filters.status,
          branch: filters.branch,
          batch: filters.batch,
        },
        sortField,
        sortOrder,
        page,
        pageSize,
      });
      setDataResult(res || { users: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load admin users:', err);
      setError(err.message || 'Failed to fetch users from database. Please ensure backend is running.');
      setDataResult({ users: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 1 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [debouncedQuery, filters, sortField, sortOrder, page, pageSize]);

  // Sync state with URL search params
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== searchQuery) setSearchQuery(q);
  }, [searchParams]);

  // Select all handler
  const isAllCurrentPageSelected = 
    dataResult.users.length > 0 &&
    dataResult.users.every((u) => selectedUserIds.includes(u.id));

  const toggleSelectAllPage = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = dataResult.users.map((u) => u.id);
      setSelectedUserIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = dataResult.users.map((u) => u.id);
      const unique = Array.from(new Set([...selectedUserIds, ...pageIds]));
      setSelectedUserIds(unique);
    }
  };

  const toggleSelectUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({
      role: 'all',
      status: 'all',
      branch: 'all',
      batch: 'all',
    });
    setSearchParams({});
    setPage(1);
  };

  const selectedUsersList = useMemo(() => {
    return selectedUserIds.map((id) => {
      const found = dataResult.users.find((u) => u.id === id);
      return found || { id };
    });
  }, [dataResult.users, selectedUserIds]);

  // Computed display stats with fallbacks
  const displayTotal = userStats.totalUsers || dataResult.totalCount || 0;
  const displayStudents = userStats.students || dataResult.users.filter(u => u.role === 'Student').length || 0;
  const displayAlumni = userStats.alumni || dataResult.users.filter(u => u.role === 'Alumni').length || 0;
  const displayPending = userStats.pendingApprovals || 0;
  const displayAdmins = userStats.administrators || dataResult.users.filter(u => u.role === 'Admin').length || 0;

  return (
    <AdminLayout onSearch={(q) => setSearchQuery(q)}>
      <div className="space-y-5 selection:bg-red-700 selection:text-white">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Users
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage student, alumni and administrator accounts.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-2 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* User Summary Section */}
        <div className="bg-white rounded-md border border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 shadow-2xs">
          {/* ALL USERS */}
          <div className="p-2 sm:p-0 sm:px-3 first:px-0">
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">ALL USERS</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block tracking-tight">
              {displayTotal}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Total Registered</span>
          </div>

          {/* STUDENTS */}
          <div className="p-2 sm:p-0 sm:px-3 pt-3 sm:pt-0">
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">STUDENTS</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block tracking-tight">
              {displayStudents}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Enrolled Students</span>
          </div>

          {/* ALUMNI */}
          <div className="p-2 sm:p-0 sm:px-3 pt-3 sm:pt-0">
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">ALUMNI</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block tracking-tight">
              {displayAlumni}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Registered Alumni</span>
          </div>

          {/* PENDING APPROVAL */}
          <div className="p-2 sm:p-0 sm:px-3 pt-3 sm:pt-0">
            <span className="text-[10px] font-bold text-red-700 tracking-wider uppercase block">PENDING APPROVAL</span>
            <span className="text-2xl font-black text-red-700 mt-1 block tracking-tight">
              {displayPending}
            </span>
            <span className="text-[11px] text-red-700 font-bold block mt-0.5">Awaiting Review</span>
          </div>

          {/* ADMINISTRATORS */}
          <div className="p-2 sm:p-0 sm:px-3 pt-3 sm:pt-0">
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">ADMINISTRATORS</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block tracking-tight">
              {displayAdmins}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">System Administrators</span>
          </div>
        </div>

        {/* Search + Filter Toolbar */}
        <div className="bg-white rounded-md border border-slate-200 p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-2xs">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, roll number or company..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-700 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdowns Group */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Role Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Role</span>
              <select
                value={filters.role}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, role: e.target.value }));
                  setPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:bg-white focus:outline-none focus:border-red-700"
              >
                <option value="all">All Roles</option>
                <option value="Student">Student</option>
                <option value="Alumni">Alumni</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {/* Status Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Status</span>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, status: e.target.value }));
                  setPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:bg-white focus:outline-none focus:border-red-700"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="REJECTED">Rejected</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </div>

            {/* Branch Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Branch</span>
              <select
                value={filters.branch}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, branch: e.target.value }));
                  setPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:bg-white focus:outline-none focus:border-red-700"
              >
                <option value="all">All Branches</option>
                <option value="B.Tech CSE">B.Tech CSE</option>
                <option value="B.Tech ECE">B.Tech ECE</option>
                <option value="B.Tech ME">B.Tech ME</option>
                <option value="B.Tech EE">B.Tech EE</option>
                <option value="B.Tech Civil">B.Tech Civil</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="BBA">BBA</option>
                <option value="MBA">MBA</option>
              </select>
            </div>

            {/* Batch Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Batch</span>
              <select
                value={filters.batch}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, batch: e.target.value }));
                  setPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:bg-white focus:outline-none focus:border-red-700"
              >
                <option value="all">All Batches</option>
                <option value="2027">2027</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        {/* Primary Data Table */}
        <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAllPage}
                      className="cursor-pointer"
                      title="Select all on this page"
                    >
                      {isAllCurrentPageSelected ? (
                        <CheckSquare className="w-4 h-4 text-red-700" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>

                  <th className="p-3.5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1.5">
                      <span>USER</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th className="p-3.5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('role')}>
                    <div className="flex items-center gap-1.5">
                      <span>ROLE</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th className="p-3.5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('batch')}>
                    <div className="flex items-center gap-1.5">
                      <span>ACADEMIC</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th className="p-3.5">
                    <span>PROFESSIONAL</span>
                  </th>

                  <th className="p-3.5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1.5">
                      <span>STATUS</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th className="p-3.5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('lastUpdated')}>
                    <div className="flex items-center gap-1.5">
                      <span>LAST UPDATED</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th className="p-3.5 text-right">
                    <span>ACTIONS</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="p-3.5 text-center"><div className="w-4 h-4 bg-slate-200 rounded mx-auto" /></td>
                      <td className="p-3.5"><div className="w-36 h-4 bg-slate-200 rounded" /></td>
                      <td className="p-3.5"><div className="w-16 h-4 bg-slate-200 rounded" /></td>
                      <td className="p-3.5"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                      <td className="p-3.5"><div className="w-28 h-4 bg-slate-200 rounded" /></td>
                      <td className="p-3.5"><div className="w-20 h-4 bg-slate-200 rounded" /></td>
                      <td className="p-3.5"><div className="w-16 h-4 bg-slate-200 rounded" /></td>
                      <td className="p-3.5 text-right"><div className="w-14 h-4 bg-slate-200 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500 space-y-2">
                      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                      <p className="font-bold text-slate-800 text-xs">Unable to load users</p>
                      <p className="text-xs text-slate-500">{error}</p>
                      <button
                        type="button"
                        onClick={fetchUsers}
                        className="px-3.5 py-1.5 rounded bg-red-700 text-white text-xs font-semibold hover:bg-red-800 transition-colors cursor-pointer"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : dataResult.users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400 space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-700 text-xs">No users found</p>
                      <p className="text-xs text-slate-500">Try broadening your search query or clearing active filters.</p>
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="px-3.5 py-1.5 rounded border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  dataResult.users.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    const rawStatus = user.accountStatus || user.account_status || (user.missingFields ? 'ACTIVE' : 'ACTIVE');
                    const isPending = rawStatus === 'PENDING_APPROVAL' || user.status === 'PENDING';
                    const isRejected = rawStatus === 'REJECTED';
                    const isDisabled = rawStatus === 'DISABLED';

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-red-50/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectUser(user.id)}
                            className="cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-red-700" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                        </td>

                        {/* USER */}
                        <td className="p-3.5 font-semibold text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 overflow-hidden">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/admin/users/${user.id}`}
                                className="font-bold text-slate-900 hover:text-red-700 hover:underline block truncate"
                              >
                                {user.name}
                              </Link>
                              <span className="text-[11px] text-slate-500 font-normal block truncate">
                                {user.email || '—'}
                              </span>
                              {user.rollNumber || user.universityRollNumber ? (
                                <span className="text-[10px] text-slate-400 font-normal block truncate">
                                  Roll No: {user.rollNumber || user.universityRollNumber}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        {/* ROLE */}
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              user.role === 'Alumni'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : user.role === 'Student'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        {/* ACADEMIC */}
                        <td className="p-3.5">
                          <span className="font-bold text-slate-800 block">
                            {user.degree || 'B.Tech'} {user.branch ? `${user.branch}` : ''}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {user.batch || user.graduationYear || '—'}
                          </span>
                        </td>

                        {/* PROFESSIONAL */}
                        <td className="p-3.5">
                          {user.role === 'Alumni' && user.company ? (
                            <>
                              <span className="font-bold text-slate-800 block truncate max-w-[160px]">
                                {user.company}
                              </span>
                              <span className="text-[11px] text-slate-500 block truncate max-w-[160px]">
                                {user.designation || 'Alumni'}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="p-3.5">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <span>Pending Approval</span>
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-700">
                              <span className="w-2 h-2 rounded-full bg-red-600" />
                              <span>Rejected</span>
                            </span>
                          ) : isDisabled ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              <span>Disabled</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>Active</span>
                            </span>
                          )}
                        </td>

                        {/* LAST UPDATED */}
                        <td className="p-3.5">
                          <span className="text-xs text-slate-600 font-medium">
                            {user.lastUpdatedDaysAgo === 0
                              ? '0 days ago'
                              : user.lastUpdatedDaysAgo === 1
                              ? '1 day ago'
                              : `${user.lastUpdatedDaysAgo || 0} days ago`}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="p-3.5 text-right">
                          {isPending ? (
                            <Link
                              to="/admin/approvals"
                              className="px-3 py-1 rounded text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Review</span>
                              <ChevronDown className="w-3 h-3 text-red-700 opacity-60" />
                            </Link>
                          ) : (
                            <Link
                              to={`/admin/users/${user.id}`}
                              className="px-3 py-1 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>View</span>
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing{' '}
              <span className="font-bold text-slate-900">
                {dataResult.users.length > 0 ? (dataResult.page - 1) * pageSize + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-bold text-slate-900">
                {Math.min(dataResult.page * pageSize, dataResult.totalCount)}
              </span>{' '}
              of <span className="font-bold text-slate-900">{dataResult.totalCount}</span> users
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={dataResult.page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(dataResult.totalPages || 1, 5) }).map((_, idx) => {
                  const pNum = idx + 1;
                  const isActive = pNum === dataResult.page;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum)}
                      className={`w-7 h-7 rounded text-xs font-bold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-red-700 text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={dataResult.page >= dataResult.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CSV Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          onClose={() => setIsExportModalOpen(false)}
          usersToExport={selectedUserIds.length > 0 ? selectedUsersList : dataResult.users}
          exportCount={selectedUserIds.length > 0 ? selectedUserIds.length : dataResult.totalCount}
          isSelectionExport={selectedUserIds.length > 0}
        />
      )}
    </AdminLayout>
  );
};
