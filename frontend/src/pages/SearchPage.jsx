import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { useApp } from '../context/AppContext';
import { userService } from '../services/userService';
import { Search, Loader2 } from 'lucide-react';
import { AlumniCard } from '../components/common/AlumniCard';

export const SearchPage = () => {
  const { searchQuery, setSearchQuery, showNotification } = useApp();
  const [activeFilter, setActiveFilter] = useState('all');
  const [matchingAlumni, setMatchingAlumni] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setIsLoading(true);
      try {
        const res = await userService.getUsers({
          query: searchQuery.trim(),
          limit: 30,
        });
        const mappedUsers = (res.users || []).map((u) => ({
          id: u.userId || u.id,
          userId: u.userId || u.id,
          name: u.fullName || (u.email ? u.email.split('@')[0] : 'Community Member'),
          email: u.email,
          currentRole: u.designation || (u.role === 'ALUMNI' ? 'Alumni' : 'Student'),
          company: u.company || (u.role === 'ALUMNI' ? 'Industry Professional' : 'JECRC University'),
          graduationYear: u.graduationYear || 2026,
          degree: u.degree || 'B.Tech',
          branch: u.branch || 'CSE',
          location: u.location || 'Jaipur, India',
          avatar: u.avatarUrl || null,
          skills: u.skills ? u.skills.split(',').map((s) => s.trim()) : [],
        }));
        setMatchingAlumni(mappedUsers);
      } catch (err) {
        showNotification('Failed to perform search', 'error');
        setMatchingAlumni([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <PageContainer
      title="Search JECRC Community"
      description="Find alumni, student peers, campus posts, and opportunities across the university network."
      badge="Global Search"
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
              {searchQuery.trim() ? `Results for "${searchQuery}"` : 'Recommended Connections'}
            </h3>
            <span className="text-[11px] text-slate-400">{matchingAlumni.length} found</span>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs space-y-3">
              <Loader2 className="w-7 h-7 text-red-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Searching JECRC community members...</p>
            </div>
          ) : matchingAlumni.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matchingAlumni.map((alum) => (
                <AlumniCard key={alum.id} alumni={alum} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-2">
              <p className="text-xs text-slate-500 font-medium">No members found matching your search criteria.</p>
            </div>
          )}
        </div>

      </div>
    </PageContainer>
  );
};
