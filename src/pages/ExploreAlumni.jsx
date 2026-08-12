import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AlumniCard } from '../components/common/AlumniCard';
import { CAREER_DOMAINS, INDUSTRIES } from '../data/mockData';
import { Search, X, SlidersHorizontal, RotateCcw } from 'lucide-react';

export const ExploreAlumni = () => {
  const { alumniList } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [onlyAvailableMentors, setOnlyAvailableMentors] = useState(false);

  const companyOptions = useMemo(() => {
    const set = new Set(alumniList.map((a) => a.company));
    return ['All', ...Array.from(set)];
  }, [alumniList]);

  const locationOptions = useMemo(() => {
    const set = new Set(alumniList.map((a) => a.location.split(',')[0].trim()));
    return ['All', ...Array.from(set)];
  }, [alumniList]);

  const filteredAlumni = useMemo(() => {
    return alumniList.filter((a) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        a.name.toLowerCase().includes(query) ||
        a.company.toLowerCase().includes(query) ||
        a.currentRole.toLowerCase().includes(query) ||
        a.skills.some((s) => s.toLowerCase().includes(query));

      const matchesDomain = selectedDomain === 'All' || a.domain === selectedDomain;
      const matchesIndustry = selectedIndustry === 'All' || a.industry === selectedIndustry;
      const matchesCompany = selectedCompany === 'All' || a.company === selectedCompany;
      const matchesLocation =
        selectedLocation === 'All' || a.location.toLowerCase().includes(selectedLocation.toLowerCase());
      const matchesAvailability = !onlyAvailableMentors || a.isAvailableForMentorship;

      return (
        matchesQuery &&
        matchesDomain &&
        matchesIndustry &&
        matchesCompany &&
        matchesLocation &&
        matchesAvailability
      );
    });
  }, [
    alumniList,
    searchQuery,
    selectedDomain,
    selectedIndustry,
    selectedCompany,
    selectedLocation,
    onlyAvailableMentors,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDomain('All');
    setSelectedIndustry('All');
    setSelectedCompany('All');
    setSelectedLocation('All');
    setOnlyAvailableMentors(false);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedDomain !== 'All' ||
    selectedIndustry !== 'All' ||
    selectedCompany !== 'All' ||
    selectedLocation !== 'All' ||
    onlyAvailableMentors;

  return (
    <div className="min-h-screen bg-slate-100/75 py-5">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 space-y-4">
        
        {/* Header Title */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold text-slate-900">Alumni Directory</h1>
            <p className="text-xs text-slate-500">
              Discover and connect with {alumniList.length}+ verified JECRC University graduates.
            </p>
          </div>

          <div className="text-xs text-slate-600 font-semibold self-start sm:self-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            Showing <strong className="text-slate-900">{filteredAlumni.length}</strong> alumni
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, company, role, or skills..."
                className="w-full bg-slate-100 hover:bg-slate-100/80 focus:bg-white border border-transparent focus:border-slate-300 rounded-md pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Availability Toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-slate-50 border border-slate-200 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={onlyAvailableMentors}
                onChange={(e) => setOnlyAvailableMentors(e.target.checked)}
                className="rounded text-red-700 focus:ring-red-600"
              />
              <span>Available for Mentorship</span>
            </label>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Secondary Dropdown Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Domain</label>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="All">All Domains</option>
                {CAREER_DOMAINS.map((dom) => (
                  <option key={dom} value={dom}>{dom}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Industry</label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="All">All Industries</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Company</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                {companyOptions.map((comp) => (
                  <option key={comp} value={comp}>{comp === 'All' ? 'All Companies' : comp}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>{loc === 'All' ? 'All Locations' : loc}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Directory Grid */}
        {filteredAlumni.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAlumni.map((alumni) => (
              <AlumniCard key={alumni.id} alumni={alumni} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
            <h3 className="text-sm font-bold text-slate-900">No alumni matched your filters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search criteria or resetting filters to view all graduates.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
