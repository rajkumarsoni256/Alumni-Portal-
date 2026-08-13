import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { adminUserService } from '../../../services/adminUserService';
import { X, FileSpreadsheet, Download, CheckSquare, Square } from 'lucide-react';

export const ExportModal = ({ 
  onClose, 
  usersToExport = [], 
  exportCount = 0,
  isSelectionExport = false
}) => {
  const { showNotification } = useApp();

  const [selectedFields, setSelectedFields] = useState({
    name: true,
    email: true,
    phone: true,
    role: true,
    branch: true,
    batch: true,
    degree: true,
    company: true,
    designation: true,
    location: true,
    industry: false,
    skills: false,
    linkedin: false,
    updatedAt: false,
  });

  const fieldLabels = [
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone Number' },
    { id: 'role', label: 'Role (Student/Alumni)' },
    { id: 'branch', label: 'Branch' },
    { id: 'batch', label: 'Batch' },
    { id: 'degree', label: 'Degree' },
    { id: 'company', label: 'Company' },
    { id: 'designation', label: 'Designation' },
    { id: 'location', label: 'Location' },
    { id: 'industry', label: 'Industry' },
    { id: 'skills', label: 'Skills' },
    { id: 'linkedin', label: 'LinkedIn URL' },
    { id: 'updatedAt', label: 'Last Updated' },
  ];

  const toggleField = (id) => {
    setSelectedFields((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectAllFields = () => {
    const allTrue = {};
    fieldLabels.forEach((f) => {
      allTrue[f.id] = true;
    });
    setSelectedFields(allTrue);
  };

  const deselectAllFields = () => {
    const defaultMinimal = { name: true, email: true, role: true, batch: true };
    const reset = {};
    fieldLabels.forEach((f) => {
      reset[f.id] = !!defaultMinimal[f.id];
    });
    setSelectedFields(reset);
  };

  const handleExport = () => {
    // If no explicit list passed, fetch current default list
    let list = usersToExport;
    if (!list || list.length === 0) {
      const res = adminUserService.getAdminUsers({ pageSize: 1000 });
      list = res.users;
    }

    const success = adminUserService.downloadCSV(list, selectedFields);
    if (success) {
      const count = list.length;
      showNotification(`CSV exported successfully (${count} records).`);
      onClose();
    } else {
      showNotification('Please select at least one field to export.');
    }
  };

  const activeFieldCount = Object.values(selectedFields).filter(Boolean).length;
  const countToDisplay = isSelectionExport 
    ? usersToExport.length 
    : (exportCount || usersToExport.length || adminUserService.getAdminUsers().totalCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Export CSV Data</h3>
              <p className="text-xs text-slate-500">
                {isSelectionExport
                  ? `${countToDisplay} explicitly selected records`
                  : `${countToDisplay} records matching active filters`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Field Selection Checklist */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              Select CSV Columns ({activeFieldCount} of {fieldLabels.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllFields}
                className="text-[11px] font-semibold text-red-700 hover:underline cursor-pointer"
              >
                Select all
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={deselectAllFields}
                className="text-[11px] font-semibold text-slate-500 hover:underline cursor-pointer"
              >
                Reset default
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {fieldLabels.map((f) => {
              const isChecked = !!selectedFields[f.id];
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleField(f.id)}
                  className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                    isChecked
                      ? 'bg-red-50/50 border-red-200 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-red-700 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span className="text-xs font-medium truncate">{f.label}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={activeFieldCount === 0}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Generate & Download CSV</span>
          </button>
        </div>

      </div>

    </div>
  );
};
