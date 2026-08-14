import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sun, Moon, Laptop, Check } from 'lucide-react';

const THEME_OPTIONS = [
  {
    id: 'LIGHT',
    name: 'Light Theme',
    desc: 'Clean white cards with navy typography and red accents',
    icon: Sun,
  },
  {
    id: 'DARK',
    name: 'Dark Theme',
    desc: 'Sleek dark mode optimized for low-light environments',
    icon: Moon,
  },
  {
    id: 'SYSTEM',
    name: 'System Default',
    desc: 'Automatically sync theme with operating system settings',
    icon: Laptop,
  },
];

export const AppearanceSection = () => {
  const { userSettings, updateUserSettings, showNotification } = useApp();
  const currentTheme = userSettings?.appearance?.theme || 'SYSTEM';

  const handleSelectTheme = async (themeId) => {
    try {
      await updateUserSettings({ theme: themeId });
      showNotification(`Theme set to ${themeId.toLowerCase()}`, 'info');
    } catch (err) {
      showNotification(err.message || 'Failed to update theme', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="space-y-1 pb-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">Appearance & Theme</h2>
        <p className="text-xs text-slate-500">Customize the visual theme of JU Connect across desktop and mobile views.</p>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = currentTheme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectTheme(opt.id)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-red-50/70 border-red-300 ring-2 ring-red-700/30'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-red-700 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900">{opt.name}</h3>
                <p className="text-[11px] text-slate-500 leading-snug">{opt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
