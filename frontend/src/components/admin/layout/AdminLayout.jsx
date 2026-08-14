import React from 'react';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';
import { MobileBottomNav } from '../../common/MobileBottomNav';

/**
 * AdminLayout — Authenticated Institutional Admin Shell
 * Clean, modern, enterprise admin shell with global AdminHeader and AdminSidebar.
 */
export const AdminLayout = ({ children, onSearch }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] text-slate-900 font-sans antialiased selection:bg-red-700 selection:text-white pb-16 md:pb-0">
      
      {/* Global Admin Top Header */}
      <AdminHeader onSearch={onSearch} />

      {/* Main Layout Container */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-start gap-6">
          
          {/* Left Admin Navigation Sidebar (Desktop) */}
          <div className="hidden lg:block sticky top-24">
            <AdminSidebar />
          </div>

          {/* Main Admin Content Area */}
          <main className="flex-1 min-w-0 w-full">
            {children}
          </main>

        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

    </div>
  );
};
