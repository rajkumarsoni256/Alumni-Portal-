import React from 'react';
import { Navbar } from '../../common/Navbar';
import { AdminSidebar } from './AdminSidebar';
import { MobileBottomNav } from '../../common/MobileBottomNav';
import { QuickRoleBar } from '../../common/QuickRoleBar';

/**
 * AdminLayout — Authenticated Admin Shell
 * Uses the exact same shell layout, navbar, background theme, font typography,
 * and responsive grid as Student and Alumni experiences.
 */
export const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100/75 text-slate-900 font-sans antialiased selection:bg-red-700 selection:text-white pb-16 md:pb-0">
      
      {/* Dev Prototype Role Switcher */}
      <QuickRoleBar />

      {/* Global Top Navbar */}
      <Navbar />

      {/* Main Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex items-start gap-6">
          
          {/* Left Admin Navigation Sidebar (Desktop) */}
          <div className="hidden lg:block sticky top-20">
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
