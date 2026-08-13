import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { useApp } from '../context/AppContext';
import { Search, Users, FileText, Calendar, ArrowRight } from 'lucide-react';
import { AlumniCard } from '../components/common/AlumniCard';

export const SearchPage = () => {
  const { searchQuery, setSearchQuery, alumniList, posts } = useApp();
  const [activeFilter, setActiveFilter] = useState('all');

  const queryLower = (searchQuery || '').toLowerCase().trim();

  const matchingAlumni = alumniList.filter((a) =>
    !queryLower ||
    a.name.toLowerCase().includes(queryLower) ||
    a.company.toLowerCase().includes(queryLower) ||
    a.currentRole.toLowerCase().includes(queryLower) ||
    a.skills.some((s) => s.toLowerCase().includes(queryLower))
  );

  return (
    <PageContainer
      title="Search JECRC Community"
      description="Find alumni, student peers, campus posts, and opportunities across the university network."
      badge="Module 11 Preview"
    >
      <div className="space-y-6">
        
        {/* Search Bar Input */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, skill, branch..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 pt-2.5">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Results
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('people')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeFilter === 'people' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              People ({matchingAlumni.length})
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {queryLower ? `Results for "${searchQuery}"` : 'Recommended Connections'}
            </h3>
            <span className="text-[11px] text-slate-400">{matchingAlumni.length} found</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {matchingAlumni.map((alum) => (
              <AlumniCard key={alum.id} alumni={alum} />
            ))}
          </div>
        </div>

      </div>
    </PageContainer>
  );
};
