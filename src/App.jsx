import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Common Components
import { QuickRoleBar } from './components/common/QuickRoleBar';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';

// Pages
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
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
          <QuickRoleBar />
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
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
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
