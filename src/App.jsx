import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Common Components
import { QuickRoleBar } from './components/common/QuickRoleBar';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { MobileBottomNav } from './components/common/MobileBottomNav';

// Pages
import { CommunityFeed } from './pages/CommunityFeed';
import { LandingPage } from './pages/LandingPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { ExploreAlumni } from './pages/ExploreAlumni';
import { FindMentor } from './pages/FindMentor';
import { AlumniProfile } from './pages/AlumniProfile';
import { MentorshipRequestPage } from './pages/MentorshipRequestPage';
import { MyConnections } from './pages/MyConnections';
import { AlumniDashboard } from './pages/AlumniDashboard';
import { EventsPage } from './pages/EventsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AboutPage } from './pages/AboutPage';

// Scroll to top component on route changes
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export function App() {
  return (
    <AppProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-red-600 selection:text-white pb-16 md:pb-0">
          <QuickRoleBar />
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<CommunityFeed />} />
              <Route path="/feed" element={<CommunityFeed />} />
              <Route path="/welcome" element={<LandingPage />} />
              <Route path="/student-dashboard" element={<StudentDashboard />} />
              <Route path="/explore" element={<ExploreAlumni />} />
              <Route path="/find-mentor" element={<FindMentor />} />
              <Route path="/alumni/:id" element={<AlumniProfile />} />
              <Route path="/request-mentorship/:id" element={<MentorshipRequestPage />} />
              <Route path="/my-connections" element={<MyConnections />} />
              <Route path="/alumni-dashboard" element={<AlumniDashboard />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </main>
          <Footer />
          <MobileBottomNav />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;

