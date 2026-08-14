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
  Building2, 
  MapPin, 
  GraduationCap, 
  UserCheck, 
  Clock, 
  AlertCircle,
  CheckSquare,
  Square
} from 'lucide-react';

export const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showNotification } = useApp();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    role: searchParams.get('role') || 'all',
    branch: searchParams.get('branch') || 'all',
    batch: searchParams.get('batch') || 'all',
    batchFrom: '',
    batchTo: '',
    city: searchParams.get('city') || 'all',
    company: searchParams.get('company') || '',
    profileStatus: searchParams.get('status') || 'all',
    missingFields: searchParams.get('missing') ? [searchParams.get('missing')] : [],
    lastUpdated: searchParams.get('lastUpdated') || 'all',
  });

  // Table State
  const [sortField, setSortField] = useState('lastUpdated');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Data State
  const [dataResult, setDataResult] = useState({
    users: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  // Debounce search query
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Users from real API
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    setErrorStatus(null);
    try {
      const res = await adminUserService.getAdminUsers({
        searchQuery: debouncedQuery,
        filters,
        sortField,
        sortOrder,
        page,
        pageSize,
      });
      setDataResult(res || { users: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load admin users:', err);
      setError(err.message || 'Failed to fetch users from database. Please check your backend connection.');
      setErrorStatus(err.status || null);
      setDataResult({ users: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 1 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [debouncedQuery, filters, sortField, sortOrder, page, pageSize]);

  // Handle URL query sync
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== searchQuery) setSearchQuery(q);

    const statusParam = searchParams.get('status');
    const updatedParam = searchParams.get('lastUpdated');
    const missingParam = searchParams.get('missing');

    if (statusParam || updatedParam || missingParam) {
      setFilters((prev) => ({
        ...prev,
        profileStatus: statusParam || prev.profileStatus,
        lastUpdated: updatedParam || prev.lastUpdated,
        missingFields: missingParam ? [missingParam] : prev.missingFields,
      }));
    }
  }, [searchParams]);

  // Handle Select All on current page
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

  const activeFilterPills = useMemo(() => {
    const pills = [];
    if (filters.role !== 'all') pills.push({ key: 'role', label: `Role: ${filters.role}` });
    if (filters.branch !== 'all') pills.push({ key: 'branch', label: `Branch: ${filters.branch}` });
    if (filters.batch !== 'all') pills.push({ key: 'batch', label: `Batch: ${filters.batch}` });
    if (filters.city !== 'all') pills.push({ key: 'city', label: `City: ${filters.city}` });
    if (filters.company) pills.push({ key: 'company', label: `Company: ${filters.company}` });
    if (filters.profileStatus !== 'all') pills.push({ key: 'profileStatus', label: `Status: ${filters.profileStatus}` });
    if (filters.lastUpdated !== 'all') pills.push({ key: 'lastUpdated', label: `Updated: ${filters.lastUpdated}` });
    if (filters.missingFields.length > 0) pills.push({ key: 'missingFields', label: `Missing: ${filters.missingFields.join(', ')}` });
    return pills;
  }, [filters]);

  const removeFilterPill = (key) => {
    if (key === 'missingFields') {
      setFilters((prev) => ({ ...prev, missingFields: [] }));
    } else if (key === 'company') {
      setFilters((prev) => ({ ...prev, company: '' }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: 'all' }));
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({
      role: 'all',
      branch: 'all',
      batch: 'all',
      batchFrom: '',
      batchTo: '',
      city: 'all',
      company: '',
      profileStatus: 'all',
      missingFields: [],
      lastUpdated: 'all',
    });
    setSearchParams({});
  };

  const selectedUsersList = useMemo(() => {
    return selectedUserIds.map((id) => {
      const found = dataResult.users.find((u) => u.id === id);
      return found || { id };
    });
  }, [dataResult.users, selectedUserIds]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Users Management
            </h1>
            <p className="text-xs text-slate-500">
              Complete student and alumni database records directory.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                isFilterPanelOpen || activeFilterPills.length > 0
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterPills.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-700 text-white text-[10px] font-bold inline-flex items-center justify-center">
                  {activeFilterPills.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, phone, company, designation..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
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

        {/* Filter Panel (Collapsible Drawer) */}
        {isFilterPanelOpen && (
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-4 animate-in fade-in duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Filter User Records
              </h3>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-red-700 hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Role */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-red-600"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Student</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>

              {/* Branch */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Branch</label>
                <select
                  value={filters.branch}
                  onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-red-600"
                >
                  <option value="all">All Branches</option>
                  <option value="CSE">CSE</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                </select>
              </div>

              {/* Batch */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Batch</label>
                <select
                  value={filters.batch}
                  onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-red-600"
                >
                  <option value="all">All Batches</option>
                  {[2027, 2026, 2025, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014].map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* City / Location */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">City</label>
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-red-600"
                >
                  <option value="all">All Locations</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Jaipur">Jaipur</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="San Francisco">San Francisco</option>
                  <option value="Austin">Austin</option>
                </select>
              </div>

              {/* Company Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Company</label>
                <input
                  type="text"
                  value={filters.company}
                  onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                  placeholder="e.g. Amazon, Google"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Profile Status */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Profile Status</label>
                <select
                  value={filters.profileStatus}
                  onChange={(e) => setFilters({ ...filters, profileStatus: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-red-600"
                >
                  <option value="all">All Statuses</option>
                  <option value="complete">Complete</option>
                  <option value="incomplete">Incomplete</option>
                  <option value="needs update">Needs Update</option>
                </select>
              </div>

              {/* Last Updated */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Last Updated</label>
                <select
                  value={filters.lastUpdated}
                  onChange={(e) => setFilters({ ...filters, lastUpdated: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-red-600"
                >
                  <option value="all">Any time</option>
                  <option value="30days">Last 30 days</option>
                  <option value="3months">Last 3 months</option>
                  <option value="6months">Last 6 months</option>
                  <option value="1year">Last 1 year</option>
                  <option value="more1year">More than 1 year ago</option>
                </select>
              </div>

              {/* Missing Data Flags */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block">Missing Data</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['email', 'phone', 'company', 'location'].map((f) => {
                    const isChecked = filters.missingFields.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          const updated = isChecked
                            ? filters.missingFields.filter((i) => i !== f)
                            : [...filters.missingFields, f];
                          setFilters({ ...filters, missingFields: updated });
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer capitalize ${
                          isChecked
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Missing {f}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Active Filter Pills Bar */}
        {activeFilterPills.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Active filters:</span>
            {activeFilterPills.map((pill) => (
              <span
                key={pill.key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-200/80 text-slate-800 text-xs font-semibold"
              >
                <span>{pill.label}</span>
                <button
                  type="button"
                  onClick={() => removeFilterPill(pill.key)}
                  className="hover:text-red-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-semibold text-red-700 hover:underline ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Selection Action Banner */}
        {selectedUserIds.length > 0 && (
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow-md">
            <span className="text-xs font-bold">
              {selectedUserIds.length} record{selectedUserIds.length > 1 ? 's' : ''} explicitly selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedUserIds([])}
                className="text-xs text-slate-300 hover:text-white underline cursor-pointer"
              >
                Deselect all
              </button>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Selected</span>
              </button>
            </div>
          </div>
        )}

        {/* Result Counter & Controls Header */}
        <div className="flex items-center justify-between text-xs text-slate-600 font-medium pt-1">
          <div>
            Showing <span className="font-bold text-slate-900">{dataResult.users.length}</span> of{' '}
            <span className="font-bold text-slate-900">{dataResult.totalCount.toLocaleString()}</span> records
          </div>

          <div className="flex items-center gap-2">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Main Users Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <tr>
                  <th className="p-3 w-10 text-center">
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

                  <th className="p-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      <span>Name & Email</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th className="p-3">Role</th>

                  <th className="p-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('batch')}>
                    <div className="flex items-center gap-1">
                      <span>Batch & Branch</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th className="p-3">Company & Role</th>

                  <th className="p-3">Location</th>

                  <th className="p-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('lastUpdated')}>
                    <div className="flex items-center gap-1">
                      <span>Last Updated</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {error ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-red-600 space-y-2 bg-red-50/40">
                      <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
                      <p className="font-bold text-slate-800">
                        {errorStatus === 401 ? 'Session Expired' : 'Failed to Load Users'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        {errorStatus === 401
                          ? 'Your administrator session has expired. Please log in again.'
                          : error}
                      </p>
                      {errorStatus === 401 ? (
                        <button
                          type="button"
                          onClick={() => navigate('/login')}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold cursor-pointer"
                        >
                          Log In Again
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={fetchUsers}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold cursor-pointer"
                        >
                          Retry Loading
                        </button>
                      )}
                    </td>
                  </tr>
                ) : isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-semibold text-slate-500">Loading records from PostgreSQL...</p>
                      </div>
                    </td>
                  </tr>
                ) : dataResult.users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                      <Search className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-700">No user records found</p>
                      <p className="text-xs text-slate-500">Try clearing filters or search query.</p>
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="mt-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  dataResult.users.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    const isOutdated = user.lastUpdatedDaysAgo > 365;

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-red-50/30' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
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

                        {/* Name & Email */}
                        <td className="p-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                              {user.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/admin/users/${user.id}`}
                                className="font-bold text-slate-900 hover:text-red-700 hover:underline block truncate"
                              >
                                {user.name}
                              </Link>
                              <span className="text-[11px] text-slate-400 font-normal block truncate">
                                {user.email || '— (No Email)'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="p-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              user.role === 'Alumni'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        {/* Batch & Branch */}
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block">
                            {user.branch}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Batch of {user.batch}
                          </span>
                        </td>

                        {/* Company & Designation */}
                        <td className="p-3">
                          <span className="font-semibold text-slate-800 block truncate max-w-[160px]">
                            {user.company || '—'}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                            {user.designation || '—'}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="p-3">
                          <span className="text-slate-700 font-medium truncate block max-w-[120px]">
                            {user.city || '—'}
                          </span>
                        </td>

                        {/* Last Updated */}
                        <td className="p-3">
                          <div className="space-y-0.5">
                            <span
                              className={`text-xs font-semibold block ${
                                isOutdated ? 'text-amber-700 font-bold' : 'text-slate-600'
                              }`}
                            >
                              {user.lastUpdatedDaysAgo === 1
                                ? 'Yesterday'
                                : `${user.lastUpdatedDaysAgo} days ago`}
                            </span>
                            {isOutdated && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-bold">
                                <AlertCircle className="w-3 h-3" />
                                <span>Needs Update</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <Link
                            to={`/admin/users/${user.id}`}
                            className="px-2.5 py-1 rounded text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Link>
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
              Page <span className="font-bold text-slate-900">{dataResult.page}</span> of{' '}
              <span className="font-bold text-slate-900">{dataResult.totalPages}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={dataResult.page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="px-2 font-semibold text-slate-700">
                {dataResult.page} / {dataResult.totalPages}
              </div>

              <button
                type="button"
                disabled={dataResult.page >= dataResult.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
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
