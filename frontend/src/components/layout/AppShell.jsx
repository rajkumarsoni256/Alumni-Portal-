import React from 'react';
import { Navbar } from '../common/Navbar';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from '../common/MobileBottomNav';

/**
 * AppShell — Master Authenticated Layout Wrapper
 * 
 * Provides global authenticated top navbar, responsive sticky sidebar,
 * main content container, and mobile bottom navigation for all modules.
 */
export const AppShell = ({ children, hideSidebar = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100/75 text-slate-900 font-sans antialiased selection:bg-red-600 selection:text-white pb-16 md:pb-0">
      
      {/* Global Top Navbar */}
      <Navbar />

      {/* Main Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex items-start gap-6">
          
          {/* Left Navigation Sidebar (Desktop) */}
          {!hideSidebar && (
            <div className="hidden lg:block sticky top-20">
              <AppSidebar />
            </div>
          )}

          {/* Main Content Area */}
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
