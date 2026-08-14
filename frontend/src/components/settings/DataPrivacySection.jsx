import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { settingsService } from '../../services/settingsService';
import { Download, Trash2, Database, Shield, Loader2, FileJson } from 'lucide-react';

export const DataPrivacySection = () => {
  const { showNotification } = useApp();
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadData = async () => {
    setIsExporting(true);
    try {
      const dataUrl = settingsService.getExportDataUrl();
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `ju_connect_data_export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showNotification('Data export started', 'success');
    } catch (err) {
      showNotification('Failed to download data archive', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearSearchHistory = () => {
    try {
      localStorage.removeItem('ju_connect_recent_searches');
      showNotification('Search history cleared from local storage', 'info');
    } catch (err) {
      showNotification('Failed to clear search history', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="space-y-1 pb-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">Data & Privacy Governance</h2>
        <p className="text-xs text-slate-500">Download a full archive of your profile, posts, comments, and connection history.</p>
      </div>

      {/* Download Data Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <FileJson className="w-5 h-5 text-red-700" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-slate-900">Export Personal Data Archive</h3>
              <p className="text-[11px] text-slate-500 max-w-md">
                Download a complete structured JSON copy of your profile attributes, published posts, comments, and connections.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadData}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50 inline-flex items-center gap-1.5 shadow-2xs"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Download Data (.JSON)</span>
          </button>
        </div>
      </div>

      {/* Clear Search History Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-slate-600" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-slate-900">Clear Search History</h3>
              <p className="text-[11px] text-slate-500 max-w-md">
                Remove recent directory search queries and recent profile view history stored in your browser.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearSearchHistory}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Clear History
          </button>
        </div>
      </div>
    </div>
  );
};
