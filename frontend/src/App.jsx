import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Layout & Protected Route
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminRoute } from './components/layout/AdminRoute';
import { Navbar } from './components/common/Navbar';

// Eager Essential Authentication & Landing Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { RoleSelectionPage } from './pages/auth/RoleSelectionPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { OnboardingPage } from './pages/auth/OnboardingPage';

// Authenticated Core Feature Pages (Lazy Loaded for Fast Initial Bundle Delivery)
const CommunityFeed = lazy(() => import('./pages/CommunityFeed').then((m) => ({ default: m.CommunityFeed })));
const NetworkPage = lazy(() => import('./pages/NetworkPage').then((m) => ({ default: m.NetworkPage })));
const ExploreAlumni = lazy(() => import('./pages/ExploreAlumni').then((m) => ({ default: m.ExploreAlumni })));
const FindMentor = lazy(() => import('./pages/FindMentor').then((m) => ({ default: m.FindMentor })));
const JobsPage = lazy(() => import('./pages/JobsPage').then((m) => ({ default: m.JobsPage })));
const EventsPage = lazy(() => import('./pages/EventsPage').then((m) => ({ default: m.EventsPage })));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then((m) => ({ default: m.MessagesPage })));
const MyConnections = lazy(() => import('./pages/MyConnections').then((m) => ({ default: m.MyConnections })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const MentorshipRequestPage = lazy(() => import('./pages/MentorshipRequestPage').then((m) => ({ default: m.MentorshipRequestPage })));
const AlumniDashboard = lazy(() => import('./pages/AlumniDashboard').then((m) => ({ default: m.AlumniDashboard })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage').then((m) => ({ default: m.PostDetailPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Dedicated Admin Portal Pages (Lazy Loaded)
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminUserDetailsPage = lazy(() => import('./pages/admin/AdminUserDetailsPage').then((m) => ({ default: m.AdminUserDetailsPage })));
const AdminDataManagementPage = lazy(() => import('./pages/admin/AdminDataManagementPage').then((m) => ({ default: m.AdminDataManagementPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })));
const AdminCommunicationsPage = lazy(() => import('./pages/admin/AdminCommunicationsPage').then((m) => ({ default: m.AdminCommunicationsPage })));
const AdminNotificationsPage = lazy(() => import('./pages/admin/AdminNotificationsPage').then((m) => ({ default: m.AdminNotificationsPage })));
const AdminContentManagementPage = lazy(() => import('./pages/admin/AdminContentManagementPage').then((m) => ({ default: m.AdminContentManagementPage })));
const AdminProfilePage = lazy(() => import('./pages/admin/AdminProfilePage').then((m) => ({ default: m.AdminProfilePage })));
const AdminVerificationPage = lazy(() => import('./pages/admin/AdminVerificationPage').then((m) => ({ default: m.AdminVerificationPage })));

// Loading spinner fallback during lazy chunk resolution
const PageFallback = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-500">
    <div className="w-8 h-8 border-3 border-red-700 border-t-transparent rounded-full animate-spin mb-3"></div>
    <span className="text-xs font-semibold text-slate-500">Loading view...</span>
  </div>
);

// Scroll to top component on route changes
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Layout for public unauthenticated pages (Navbar + Content)
const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100/75 text-slate-900 font-sans antialiased">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
};

// Smart root route component: Landing Page for guests, Community Feed for logged-in users, Admin Dashboard for Admins
const RootIndex = () => {
  const { isAuthenticated, isLoading, activeRole, authUser } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-400">Loading JECRC Connect...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    const isAdmin = authUser?.role?.toUpperCase() === 'ADMIN' || activeRole === 'admin';
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return (
      <ProtectedRoute>
        <CommunityFeed />
      </ProtectedRoute>
    );
  }

  return (
    <PublicLayout>
      <LandingPage />
    </PublicLayout>
  );
};

export function App() {
  return (
    <Router>
      <AppProvider>
        <ScrollToTop />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* ======================================================= */}
            {/* 1. PUBLIC & AUTHENTICATION ROUTES                        */}
            {/* ======================================================= */}
            <Route
              path="/welcome"
              element={
                <PublicLayout>
                  <LandingPage />
                </PublicLayout>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/select-role" element={<RoleSelectionPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/onboarding/student" element={<OnboardingPage defaultRole="student" />} />
            <Route path="/onboarding/alumni" element={<OnboardingPage defaultRole="alumni" />} />

            {/* Module 10 Admin Login */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* ======================================================= */}
            {/* 2. ROOT & CORE DISCOVERY ROUTES                         */}
            {/* ======================================================= */}
            <Route path="/" element={<RootIndex />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <CommunityFeed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <CommunityFeed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/network"
              element={
                <ProtectedRoute>
                  <NetworkPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <ExploreAlumni />
                </ProtectedRoute>
              }
            />
            <Route
              path="/find-mentor"
              element={
                <ProtectedRoute>
                  <FindMentor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs"
              element={
                <ProtectedRoute>
                  <JobsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-connections"
              element={
                <ProtectedRoute>
                  <MyConnections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/me"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni/:id"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/:id"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/request-mentorship/:id"
              element={
                <ProtectedRoute>
                  <MentorshipRequestPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni-dashboard"
              element={
                <ProtectedRoute>
                  <AlumniDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-dashboard"
              element={
                <ProtectedRoute>
                  <NetworkPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/posts/:id"
              element={
                <ProtectedRoute>
                  <PostDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/about"
              element={
                <PublicLayout>
                  <AboutPage />
                </PublicLayout>
              }
            />

            {/* ======================================================= */}
            {/* 3. MODULE 10 — DEDICATED ADMIN PORTAL ROUTES            */}
            {/* ======================================================= */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users/:userId"
              element={
                <AdminRoute>
                  <AdminUserDetailsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/approvals"
              element={
                <AdminRoute>
                  <AdminVerificationPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/data"
              element={
                <AdminRoute>
                  <AdminDataManagementPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRoute>
                  <AdminSettingsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/communications"
              element={
                <AdminRoute>
                  <AdminCommunicationsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <AdminRoute>
                  <AdminNotificationsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/content"
              element={
                <AdminRoute>
                  <AdminContentManagementPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <AdminRoute>
                  <AdminProfilePage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/jobs"
              element={
                <AdminRoute>
                  <AdminContentManagementPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/events"
              element={
                <AdminRoute>
                  <AdminContentManagementPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/mentorship"
              element={
                <AdminRoute>
                  <AdminContentManagementPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />

            {/* 404 Catch-All */}
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <NotFoundPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </AppProvider>
    </Router>
  );
}

export default App;
