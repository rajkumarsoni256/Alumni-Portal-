import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AlumniCard } from '../components/common/AlumniCard';
import { CAREER_DOMAINS, INDUSTRIES } from '../data/mockData';
import { Search, Filter, SlidersHorizontal, RefreshCw, Sparkles, UserCheck, Briefcase } from 'lucide-react';

export const ExploreAlumni = () => {
  const { alumniList } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedExperience, setSelectedExperience] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [onlyAvailableMentors, setOnlyAvailableMentors] = useState(false);

  // Extract unique companies & locations for filter dropdowns
  const companyOptions = useMemo(() => {
    const set = new Set(alumniList.map((a) => a.company));
    return ['All', ...Array.from(set)];
  }, [alumniList]);

  const locationOptions = useMemo(() => {
    const set = new Set(alumniList.map((a) => a.location.split(' ')[0]));
    return ['All', ...Array.from(set)];
  }, [alumniList]);

  // Filtered Alumni logic
  const filteredAlumni = useMemo(() => {
    return alumniList.filter((a) => {
      // Search term match
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        a.name.toLowerCase().includes(query) ||
        a.company.toLowerCase().includes(query) ||
        a.currentRole.toLowerCase().includes(query) ||
        a.skills.some((s) => s.toLowerCase().includes(query));

      // Domain match
      const matchesDomain = selectedDomain === 'All' || a.domain === selectedDomain;

      // Industry match
      const matchesIndustry = selectedIndustry === 'All' || a.industry === selectedIndustry;

      // Company match
      const matchesCompany = selectedCompany === 'All' || a.company === selectedCompany;

      // Location match
      const matchesLocation =
        selectedLocation === 'All' || a.location.toLowerCase().includes(selectedLocation.toLowerCase());

      // Experience match
      let matchesExp = true;
      if (selectedExperience === '1-3') matchesExp = a.experienceYears >= 1 && a.experienceYears <= 3;
      if (selectedExperience === '4-7') matchesExp = a.experienceYears >= 4 && a.experienceYears <= 7;
      if (selectedExperience === '8+') matchesExp = a.experienceYears >= 8;

      // Availability match
      const matchesAvail = !onlyAvailableMentors || a.isAvailableForMentorship;

      return (
        matchesQuery &&
        matchesDomain &&
        matchesIndustry &&
        matchesCompany &&
        matchesLocation &&
        matchesExp &&
        matchesAvail
      );
    });
  }, [
    alumniList,
    searchQuery,
    selectedDomain,
    selectedIndustry,
    selectedCompany,
    selectedExperience,
    selectedLocation,
    onlyAvailableMentors,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDomain('All');
    setSelectedIndustry('All');
    setSelectedCompany('All');
    setSelectedExperience('All');
    setSelectedLocation('All');
    setOnlyAvailableMentors(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
          <UserCheck className="w-3.5 h-3.5" />
          <span>Alumni Directory</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Explore University Alumni
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          Search and connect with over 1,800+ verified graduates working across global technology, finance, product, and consulting firms.
        </p>
      </div>

      {/* Main Search & Filter Control Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, skill or role (e.g. Google, PyTorch, Priya)..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Domain Filter */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Career Domain
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Domains</option>
              {CAREER_DOMAINS.map((domain, idx) => (
                <option key={idx} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>

          {/* Industry Filter */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Industry
            </label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Industries</option>
              {INDUSTRIES.map((ind, idx) => (
                <option key={idx} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Company Filter */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Company
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Companies</option>
              {companyOptions.filter(c => c !== 'All').map((comp, idx) => (
                <option key={idx} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>

          {/* Experience Filter */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Experience
            </label>
            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">Any Experience</option>
              <option value="1-3">1 - 3 Years</option>
              <option value="4-7">4 - 7 Years</option>
              <option value="8+">8+ Years Senior</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Locations</option>
              {locationOptions.filter(l => l !== 'All').map((loc, idx) => (
                <option key={idx} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Toggle & Reset Row */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-semibold">
            <input
              type="checkbox"
              checked={onlyAvailableMentors}
              onChange={(e) => setOnlyAvailableMentors(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
            />
            <span>Show only mentors currently available for 1-on-1 sessions</span>
          </label>

          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>

      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-sm text-slate-600">
        <p className="font-semibold">
          Showing <span className="font-bold text-slate-900">{filteredAlumni.length}</span> alumni profiles
        </p>
      </div>

      {/* Grid of Alumni Cards */}
      {filteredAlumni.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAlumni.map((alumni) => (
            <AlumniCard key={alumni.id} alumni={alumni} showMatchReasons={true} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Alumni Matched Your Filters</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Try adjusting your search criteria or resetting filters to explore our full alumni database.
          </p>
          <button
            onClick={resetFilters}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
