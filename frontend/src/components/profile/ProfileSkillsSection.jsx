import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const COMMON_SKILL_SUGGESTIONS = [
  "Java", "Python", "React", "TypeScript", "Spring Boot", 
  "AWS", "PyTorch", "Node.js", "Docker", "Kubernetes", 
  "PostgreSQL", "System Design", "FastAPI", "Figma", "C++"
];

export const ProfileSkillsSection = ({
  skills = [],
  isOwnProfile,
  onAddSkill,
  onRemoveSkill,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  if ((!skills || skills.length === 0) && !isOwnProfile) return null;

  const handleAdd = (skillToAdd) => {
    const val = (skillToAdd || skillInput).trim();
    if (!val) return;
    onAddSkill(val);
    setSkillInput('');
    setIsAdding(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const availableSuggestions = COMMON_SKILL_SUGGESTIONS.filter(
    (s) => !skills.some((existing) => existing.toLowerCase() === s.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Skills</h2>

        {isOwnProfile && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Skill</span>
          </button>
        )}
      </div>

      {/* Adding Input Form */}
      {isOwnProfile && isAdding && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter skill (e.g. React, PyTorch, Docker)..."
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
              autoFocus
            />
            <button
              type="button"
              onClick={() => handleAdd()}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer shrink-0"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {availableSuggestions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 font-medium">Suggestions:</span>
              {availableSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAdd(s)}
                  className="text-[10px] font-medium bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Skills Badges Grid */}
      {(!skills || skills.length === 0) ? (
        <p className="text-xs text-slate-400 italic">No skills listed yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-800 text-xs font-medium px-3 py-1 rounded-lg border border-slate-200/60"
            >
              <span>{skill}</span>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => onRemoveSkill(skill)}
                  className="text-slate-400 hover:text-red-700 cursor-pointer ml-0.5"
                  title={`Remove ${skill}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
