import React, { useState } from 'react';
import { Edit3 } from 'lucide-react';

export const ProfileAboutSection = ({ about, isOwnProfile, onSaveAbout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [aboutText, setAboutText] = useState(about || '');

  if (!about && !isOwnProfile) return null;

  const handleSave = () => {
    onSaveAbout(aboutText.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setAboutText(about || '');
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">About</h2>
        
        {isOwnProfile && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Edit about summary"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            rows={4}
            placeholder="Write a brief introduction about yourself, your background, and your interests..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-500 leading-relaxed transition-colors"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer shadow-2xs"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line font-normal">
          {about || (
            <span className="text-slate-400 italic">
              Add a brief summary to let students and alumni know what you do and what you're interested in.
            </span>
          )}
        </p>
      )}
    </div>
  );
};
