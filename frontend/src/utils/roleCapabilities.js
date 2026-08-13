import { 
  Home, 
  Users, 
  Briefcase, 
  Calendar, 
  GraduationCap, 
  Inbox, 
  MessageSquare, 
  Bell, 
  Compass, 
  Settings, 
  ShieldCheck, 
  LayoutDashboard,
  Sparkles,
  PlusCircle
} from 'lucide-react';

/**
 * Role Capabilities Definition
 * Centralizes what each role (Student, Alumni, Admin) can do and see across JECRC Community.
 */
export const getRoleCapabilities = (role = 'student') => {
  const isStudent = role === 'student';
  const isAlumni = role === 'alumni';
  const isAdmin = role === 'admin';

  return {
    isStudent,
    isAlumni,
    isAdmin,

    // Mentorship Capabilities
    canFindMentors: isStudent,
    canRequestMentorship: isStudent,
    canReceiveMentorshipRequests: isAlumni,
    canManageMentorshipSessions: isStudent || isAlumni,
    mentorshipNavTitle: isStudent ? 'Find Mentor' : isAlumni ? 'Mentorship Requests' : 'Mentorship Hub',
    mentorshipNavPath: isStudent ? '/find-mentor' : isAlumni ? '/alumni-dashboard' : '/find-mentor',

    // Jobs Capabilities
    canApplyJobs: isStudent || isAlumni,
    canRequestJobReferral: isStudent,
    canPostJobs: isAlumni || isAdmin,
    canManageJobPostings: isAlumni || isAdmin,

    // Profile & Discovery
    canExploreAlumni: true,
    canConnectPeople: true,
    canMessageMembers: true,
    canRegisterEvents: true,

    // Administrative
    canAccessAdminHub: isAdmin,
  };
};

/**
 * Get dynamic navigation links tailored for the active role
 */
export const getNavLinksForRole = (
  role = 'student',
  { unreadNotifsCount = 0, unreadMessagesCount = 0, pendingRequestsCount = 0 } = {}
) => {
  const caps = getRoleCapabilities(role);

  if (caps.isStudent) {
    return [
      { name: 'Home', path: '/', icon: Home, matchExact: true },
      { name: 'Network', path: '/network', icon: Users },
      { name: 'Explore Alumni', path: '/explore', icon: Compass },
      { name: 'Find Mentor', path: '/find-mentor', icon: GraduationCap },
      { name: 'Jobs & Internships', path: '/jobs', icon: Briefcase },
      { name: 'Events', path: '/events', icon: Calendar },
      { 
        name: 'Messages', 
        path: '/messages', 
        icon: MessageSquare, 
        badge: unreadMessagesCount > 0 ? unreadMessagesCount : null 
      },
      { 
        name: 'Notifications', 
        path: '/notifications', 
        icon: Bell, 
        badge: unreadNotifsCount > 0 ? unreadNotifsCount : null 
      },
      { name: 'Settings', path: '/settings', icon: Settings },
    ];
  }

  if (caps.isAlumni) {
    return [
      { name: 'Home', path: '/', icon: Home, matchExact: true },
      { name: 'Network', path: '/network', icon: Users },
      { name: 'Alumni Directory', path: '/explore', icon: Compass },
      { 
        name: 'Mentorship Requests', 
        path: '/alumni-dashboard', 
        icon: Inbox, 
        badge: pendingRequestsCount > 0 ? pendingRequestsCount : null 
      },
      { name: 'Post / Manage Jobs', path: '/jobs', icon: Briefcase },
      { name: 'Events', path: '/events', icon: Calendar },
      { 
        name: 'Messages', 
        path: '/messages', 
        icon: MessageSquare, 
        badge: unreadMessagesCount > 0 ? unreadMessagesCount : null 
      },
      { 
        name: 'Notifications', 
        path: '/notifications', 
        icon: Bell, 
        badge: unreadNotifsCount > 0 ? unreadNotifsCount : null 
      },
      { name: 'Settings', path: '/settings', icon: Settings },
    ];
  }

  // Admin Navigation
  return [
    { name: 'Administration', path: '/admin', icon: LayoutDashboard },
    { name: 'Community Feed', path: '/', icon: Home, matchExact: true },
    { name: 'Network & Users', path: '/network', icon: Users },
    { name: 'Alumni Directory', path: '/explore', icon: Compass },
    { name: 'Jobs Board', path: '/jobs', icon: Briefcase },
    { name: 'Campus Events', path: '/events', icon: Calendar },
    { 
      name: 'Messages', 
      path: '/messages', 
      icon: MessageSquare, 
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null 
    },
    { 
      name: 'Notifications', 
      path: '/notifications', 
      icon: Bell, 
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : null 
    },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];
};
