import React from 'react';
import { FolderGit2, Plus, Edit2, Trash2, ExternalLink, Code2 } from 'lucide-react';

export const ProfileProjectsSection = ({
  projects = [],
  isOwnProfile,
  onAddClick,
  onEditClick,
  onDeleteClick,
}) => {
  if ((!projects || projects.length === 0) && !isOwnProfile) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Projects</h2>
        
        {isOwnProfile && (
          <button
            type="button"
            onClick={onAddClick}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        )}
      </div>

      {(!projects || projects.length === 0) ? (
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-1.5">
          <p className="text-xs text-slate-500 font-medium">Showcase your technical work and projects.</p>
          {isOwnProfile && (
            <button
              type="button"
              onClick={onAddClick}
              className="text-xs font-semibold text-red-700 hover:underline cursor-pointer"
            >
              + Add a project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {projects.map((proj, idx) => (
            <div
              key={proj.id || idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-colors flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shrink-0">
                      <FolderGit2 className="w-4 h-4 text-red-700" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-snug">
                      {proj.title}
                    </h3>
                  </div>

                  {isOwnProfile && (
                    <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditClick(proj)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                        title="Edit project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteClick(proj.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {proj.description}
                </p>

                {/* Tech Pills */}
                {proj.tech && proj.tech.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {proj.tech.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] font-medium bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center gap-3">
                {proj.link && (
                  <a
                    href={proj.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-red-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Project</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {proj.github && (
                  <a
                    href={proj.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Source</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
