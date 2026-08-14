import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  MOCK_STUDENT,
  MOCK_USERS,
} from '../data/mockData';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import { messageService } from '../services/messageService';
import { profileService } from '../services/profileService';
import { connectionService } from '../services/connectionService';
import { notificationService } from '../services/notificationService';
import { eventService } from '../services/eventService';
import { mentorshipService } from '../services/mentorshipService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Authentication State
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStatus, setAuthStatus] = useState('UNAUTHENTICATED');
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [pendingRegistration, setPendingRegistration] = useState({
    name: '',
    email: '',
    role: 'student',
    emailVerified: false,
    profileCompleted: false,
  });

  const [activeRole, setActiveRole] = useState('student');
  const [student, setStudent] = useState(MOCK_STUDENT);

  // Real data arrays from PostgreSQL backend
  const [alumniList, setAlumniList] = useState([]);
  const [requests, setRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [usersMap, setUsersMap] = useState(MOCK_USERS);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [suggestedPeople, setSuggestedPeople] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(() => messageService.getUnreadCount('st_101'));

  const refreshUnreadMessagesCount = (userId = 'st_101') => {
    setUnreadMessagesCount(messageService.getUnreadCount(userId));
  };

  const [savedPostIds, setSavedPostIds] = useState([]);
  const [feedFilter, setFeedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedAlumniIds, setSavedAlumniIds] = useState(MOCK_STUDENT.savedAlumniIds || []);

  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchUserProfile = async () => {
    try {
      const profile = await profileService.getCurrentProfile();
      if (profile) {
        setUserProfile(profile);
      }
      return profile;
    } catch (err) {
      console.warn('Failed to load user profile:', err);
      return null;
    }
  };

  const fetchAlumniList = async () => {
    try {
      const res = await userService.getUsers({ role: 'ALUMNI', limit: 50 });
      const currentId = authUser?.id;
      const filtered = (res.users || []).filter((u) => (u.userId || u.id) !== currentId);
      setAlumniList(filtered);
    } catch (err) {
      console.warn('Failed to load alumni directory:', err);
      setAlumniList([]);
    }
  };

  const fetchSuggestedPeople = async () => {
    try {
      const res = await userService.getUsers({ limit: 4 });
      const currentId = authUser?.id;
      const mapped = (res.users || [])
        .filter((u) => (u.userId || u.id) !== currentId)
        .map((u) => ({
          id: u.userId || u.id,
          name: u.fullName || (u.email ? u.email.split('@')[0] : 'Community Member'),
          role: u.designation || (u.role === 'ALUMNI' ? 'Alumni' : 'Student'),
          company: u.company || 'JECRC Network',
          batch: u.graduationYear ? `Class of ${u.graduationYear}` : 'JECRC',
          avatar: u.avatarUrl || u.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
          connectionStatus: u.connectionStatus || 'none',
        }));
      setSuggestedPeople(mapped);
    } catch (err) {
      console.warn('Failed to load suggested people:', err);
      setSuggestedPeople([]);
    }
  };

  const fetchIncomingConnectionRequests = async () => {
    try {
      const reqs = await connectionService.getIncomingRequests();
      setConnectionRequests(reqs || []);
    } catch (err) {
      console.warn('Failed to load connection requests:', err);
      setConnectionRequests([]);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications({ page: 1, limit: 20 });
      setNotifications(res.notifications || []);
      setUnreadNotifsCount(res.unreadCount || 0);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
      setNotifications([]);
      setUnreadNotifsCount(0);
    }
  };

  const fetchEvents = async (params = {}) => {
    try {
      const res = await eventService.getEvents(params);
      setEvents(res.events || []);
    } catch (err) {
      console.warn('Failed to load events:', err);
      setEvents([]);
    }
  };

  const fetchMentorshipRequests = async () => {
    try {
      const res = await mentorshipService.getMentorshipRequests();
      setRequests(res.requests || []);
    } catch (err) {
      console.warn('Failed to load mentorship requests:', err);
      setRequests([]);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, unread: false } : n))
      );
      setUnreadNotifsCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, unread: false }))
      );
      setUnreadNotifsCount(0);
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  };

  const toggleEventRegistration = async (eventId) => {
    const targetEvt = events.find((e) => e.id === eventId);
    if (!targetEvt) return;

    try {
      if (targetEvt.isRegistered) {
        const res = await eventService.cancelRegistration(eventId);
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  isRegistered: false,
                  registeredCount: res.registeredCount,
                  seatsLeft: e.capacity ? Math.max(0, e.capacity - res.registeredCount) : 'Unlimited',
                }
              : e
          )
        );
        showNotification(`Unregistered from ${targetEvt.title}`, 'info');
      } else {
        const res = await eventService.registerForEvent(eventId);
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  isRegistered: true,
                  registeredCount: res.registeredCount,
                  seatsLeft: res.seatsLeft,
                }
              : e
          )
        );
        showNotification(`Registered for ${targetEvt.title}!`, 'success');
        await fetchNotifications();
      }
    } catch (err) {
      showNotification(err.message || 'Event registration failed', 'error');
    }
  };

  useEffect(() => {
    const initializeAuthSession = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          const user = await authService.getCurrentUser();
          if (user) {
            const normalizedRole = (user.role || 'STUDENT').toLowerCase();
            const isComplete = user.profileComplete !== false;
            setAuthUser(user);
            setActiveRole(normalizedRole);
            setIsAuthenticated(true);

            await fetchUserProfile();
            await fetchAlumniList();
            await fetchSuggestedPeople();
            await fetchIncomingConnectionRequests();
            await fetchNotifications();
            await fetchEvents();
            await fetchMentorshipRequests();

            if (user.role?.toUpperCase() === 'ADMIN' || isComplete) {
              setAuthStatus('AUTHENTICATED');
            } else {
              setAuthStatus('ONBOARDING');
            }
          } else {
            authService.clearToken();
            setIsAuthenticated(false);
            setAuthStatus('UNAUTHENTICATED');
            setUserProfile(null);
          }
        } catch (err) {
          console.warn('Failed to restore authentication session:', err);
          authService.clearToken();
          setIsAuthenticated(false);
          setAuthStatus('UNAUTHENTICATED');
          setUserProfile(null);
        }
      } else {
        setIsAuthenticated(false);
        setAuthStatus('UNAUTHENTICATED');
        setUserProfile(null);
      }
      setIsLoading(false);
    };

    initializeAuthSession();
  }, []);

  const defaultAvatar = (activeRole === 'alumni')
    ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300'
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';

  const currentUser = authUser?.role?.toUpperCase() === 'ADMIN'
    ? {
        id: authUser.id,
        name: 'Dean of Alumni Relations',
        email: authUser.email,
        role: 'admin',
        roleUpper: 'ADMIN',
        avatar: defaultAvatar,
      }
    : {
        id: authUser?.id || (activeRole === 'alumni' ? 'alm_1' : 'st_101'),
        name: userProfile?.fullName || authUser?.email?.split('@')[0] || (activeRole === 'alumni' ? 'Alumni User' : 'Student User'),
        fullName: userProfile?.fullName || '',
        email: authUser?.email || (activeRole === 'alumni' ? 'alumni@jecrc.ac.in' : 'student@jecrc.ac.in'),
        role: activeRole,
        roleUpper: activeRole.toUpperCase(),
        degree: userProfile?.degree || null,
        branch: userProfile?.branch || null,
        company: userProfile?.company || null,
        designation: userProfile?.designation || null,
        location: userProfile?.location || null,
        phone: userProfile?.phone || null,
        linkedinUrl: userProfile?.linkedinUrl || null,
        githubUrl: userProfile?.githubUrl || null,
        bio: userProfile?.bio || null,
        skills: userProfile?.skills || [],
        interests: userProfile?.interests || [],
        avatar: userProfile?.avatarUrl || authUser?.avatarUrl || defaultAvatar,
        verified: true,
      };

  const loginUser = async ({ email, password }) => {
    try {
      const response = await authService.login({ email, password });
      const user = response.user || response;
      const normalizedRole = (user.role || 'STUDENT').toLowerCase();
      const isComplete = user.profileComplete !== false;

      setAuthUser(user);
      setActiveRole(normalizedRole);
      setIsAuthenticated(true);

      await fetchUserProfile();
      await fetchAlumniList();
      await fetchSuggestedPeople();
      await fetchIncomingConnectionRequests();
      await fetchNotifications();
      await fetchEvents();
      await fetchMentorshipRequests();

      if (user.role?.toUpperCase() === 'ADMIN' || isComplete) {
        setAuthStatus('AUTHENTICATED');
      } else {
        setAuthStatus('ONBOARDING');
      }
      showNotification(`Welcome back, ${user.email}!`);
      return user;
    } catch (err) {
      if (err.errorCode === 'EMAIL_NOT_VERIFIED') {
        setPendingRegistration({ email });
        setAuthStatus('EMAIL_UNVERIFIED');
      }
      showNotification(err.message || 'Failed to sign in', 'error');
      throw err;
    }
  };

  const loginWithGoogle = async (idToken) => {
    try {
      const response = await authService.loginWithGoogle(idToken);
      const user = response.user || response;
      const normalizedRole = (user.role || 'STUDENT').toLowerCase();
      const isComplete = user.profileComplete !== false;

      setAuthUser(user);
      setActiveRole(normalizedRole);
      setIsAuthenticated(true);

      await fetchUserProfile();
      await fetchAlumniList();
      await fetchSuggestedPeople();
      await fetchIncomingConnectionRequests();
      await fetchNotifications();
      await fetchEvents();
      await fetchMentorshipRequests();

      if (user.role?.toUpperCase() === 'ADMIN' || isComplete) {
        setAuthStatus('AUTHENTICATED');
      } else {
        setAuthStatus('ONBOARDING');
      }
      showNotification(`Signed in with Google as ${user.email}!`);
      return user;
    } catch (err) {
      showNotification(err.message || 'Google sign in failed', 'error');
      throw err;
    }
  };

  const registerUser = async ({ name, email, password, role }) => {
    try {
      const response = await authService.register({ name, email, password, role });
      setPendingRegistration({
        name,
        email,
        role: role.toLowerCase(),
        emailVerified: false,
        profileCompleted: false,
      });
      setAuthStatus('EMAIL_UNVERIFIED');
      showNotification(response.message || 'Registration successful! Verification code sent to email.');
      return response;
    } catch (err) {
      showNotification(err.message || 'Registration failed', 'error');
      throw err;
    }
  };

  const setRegistrationRole = (role) => {
    setPendingRegistration((prev) => ({ ...prev, role: role.toLowerCase() }));
  };

  const verifyUserEmail = async (code) => {
    try {
      await authService.verifyEmail({ email: pendingRegistration.email, code });
      setPendingRegistration((prev) => ({ ...prev, emailVerified: true }));
      showNotification('Email verified successfully! Please log in.');
      setAuthStatus('UNAUTHENTICATED');
    } catch (err) {
      showNotification(err.message || 'Invalid verification code', 'error');
      throw err;
    }
  };

  const resendVerificationCode = async () => {
    try {
      const res = await authService.resendVerificationCode(pendingRegistration.email);
      showNotification(res.message || 'New verification code sent');
    } catch (err) {
      showNotification(err.message || 'Failed to resend code', 'error');
    }
  };

  const sendForgotPasswordLink = async (email) => {
    try {
      const res = await authService.forgotPassword(email);
      showNotification(res.message || 'Password reset link sent to your email');
    } catch (err) {
      showNotification(err.message || 'Failed to request password reset', 'error');
      throw err;
    }
  };

  const resetUserPassword = async ({ email, token, newPassword }) => {
    try {
      const res = await authService.resetPassword({ email, token, newPassword });
      showNotification(res.message || 'Password reset successfully! Please log in with your new password.');
      return res;
    } catch (err) {
      showNotification(err.message || 'Failed to reset password', 'error');
      throw err;
    }
  };

  const completeUserOnboarding = async (onboardingData) => {
    try {
      const profile = await profileService.createOrUpdateProfile(onboardingData);
      setUserProfile(profile);

      if (authUser) {
        setAuthUser((prev) => ({ ...prev, profileComplete: true }));
      }

      setAuthStatus('AUTHENTICATED');
      showNotification('Profile completed successfully! Welcome to JECRC Alumni Network.');
    } catch (err) {
      showNotification(err.message || 'Failed to save profile onboarding details', 'error');
      throw err;
    }
  };

  const logoutUser = () => {
    authService.logout();
    setAuthUser(null);
    setUserProfile(null);
    setIsAuthenticated(false);
    setAuthStatus('UNAUTHENTICATED');
    setActiveRole('student');
    setNotifications([]);
    setUnreadNotifsCount(0);
    setEvents([]);
    setRequests([]);
    setAlumniList([]);
    setSuggestedPeople([]);
    showNotification('Logged out successfully');
  };

  const toggleSaveAlumni = (alumniId) => {
    setSavedAlumniIds((prev) => {
      const exists = prev.includes(alumniId);
      if (exists) {
        showNotification('Removed alumni from saved list', 'info');
        return prev.filter((id) => id !== alumniId);
      } else {
        showNotification('Saved alumni profile!', 'success');
        return [...prev, alumniId];
      }
    });
  };

  const createPost = async (postData) => {
    try {
      const newPost = await postService.createPost(postData);
      setPosts((prev) => [newPost, ...prev]);
      showNotification('Post created successfully!');
      return newPost;
    } catch (err) {
      showNotification(err.message || 'Failed to create post', 'error');
      throw err;
    }
  };

  const editPost = async (postId, content, tags) => {
    try {
      const updatedPost = await postService.updatePost(postId, { content, tags });
      setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
      showNotification('Post updated successfully!');
      return updatedPost;
    } catch (err) {
      showNotification(err.message || 'Failed to edit post', 'error');
      throw err;
    }
  };

  const deletePost = async (postId) => {
    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      showNotification('Post deleted', 'info');
    } catch (err) {
      showNotification(err.message || 'Failed to delete post', 'error');
      throw err;
    }
  };

  const toggleLikePost = async (postId) => {
    try {
      const res = await postService.toggleLikePost(postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              likes: res.likesCount,
              likesCount: res.likesCount,
              likedByCurrentUser: res.likedByCurrentUser,
              isLiked: res.likedByCurrentUser,
            };
          }
          return p;
        })
      );
    } catch (err) {
      showNotification(err.message || 'Failed to like post', 'error');
    }
  };

  const toggleSavePost = (postId) => {
    setSavedPostIds((prev) => {
      const exists = prev.includes(postId);
      if (exists) {
        showNotification('Post removed from saved bookmarks', 'info');
        return prev.filter((id) => id !== postId);
      } else {
        showNotification('Post saved!', 'success');
        return [...prev, postId];
      }
    });
  };

  const addComment = async (postId, text) => {
    try {
      const res = await postService.addComment(postId, { text });
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              commentsCount: res.commentsCount,
            };
          }
          return p;
        })
      );
      showNotification('Comment added!');
      return res.comment;
    } catch (err) {
      showNotification(err.message || 'Failed to add comment', 'error');
      throw err;
    }
  };

  const addReply = async (postId, parentCommentId, text) => {
    try {
      const res = await postService.addComment(postId, { text, parentCommentId });
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              commentsCount: res.commentsCount,
            };
          }
          return p;
        })
      );
      showNotification('Reply added!');
      return res.comment;
    } catch (err) {
      showNotification(err.message || 'Failed to add reply', 'error');
      throw err;
    }
  };

  const toggleLikeComment = (postId, commentId) => {};

  const toggleConnectUser = async (userId) => {
    try {
      const res = await connectionService.sendRequest(userId);
      showNotification('Connection request sent!', 'success');
      return res;
    } catch (err) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('already pending') || msg.toLowerCase().includes('already connected')) {
        showNotification(msg, 'info');
        return { status: 'PENDING_OUTGOING' };
      }
      showNotification(msg || 'Failed to send connection request', 'error');
      return null;
    }
  };

  const acceptConnectionRequest = async (requestId) => {
    try {
      await connectionService.acceptRequest(requestId);
      setConnectionRequests((prev) => prev.filter((r) => r.id !== requestId && r.requestId !== requestId));
      showNotification('Connection request accepted!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to accept connection request', 'error');
    }
  };

  const ignoreConnectionRequest = async (requestId) => {
    try {
      await connectionService.declineRequest(requestId);
      setConnectionRequests((prev) => prev.filter((r) => r.id !== requestId && r.requestId !== requestId));
      showNotification('Connection request declined', 'info');
    } catch (err) {
      showNotification(err.message || 'Failed to decline connection request', 'error');
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      const updated = await profileService.createOrUpdateProfile(profileData);
      setUserProfile(updated);
      showNotification('Profile updated successfully!');
      return updated;
    } catch (err) {
      showNotification(err.message || 'Failed to update profile', 'error');
      throw err;
    }
  };

  const submitMentorshipRequest = async (requestData) => {
    try {
      const res = await mentorshipService.createMentorshipRequest(requestData);
      setRequests((prev) => [res.request, ...prev]);
      showNotification('Mentorship request sent successfully!');
      return res.request;
    } catch (err) {
      showNotification(err.message || 'Failed to send mentorship request', 'error');
      throw err;
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const res = await mentorshipService.updateMentorshipRequestStatus(requestId, newStatus);
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? res.request : r))
      );
      const msg = newStatus === 'ACCEPTED' ? 'Mentorship request accepted!' : 'Request status updated';
      showNotification(msg, newStatus === 'ACCEPTED' ? 'success' : 'info');
      await fetchNotifications();
      return res.request;
    } catch (err) {
      showNotification(err.message || 'Failed to update request status', 'error');
      throw err;
    }
  };

  const handleSetActiveRole = (newRole) => {
    setActiveRole(newRole);
    const userId = newRole === 'alumni' ? 'alm_1' : 'st_101';
    setUnreadMessagesCount(messageService.getUnreadCount(userId));
  };

  return (
    <AppContext.Provider
      value={{
        isLoading,
        authUser,
        userProfile,
        currentUser,
        isAuthenticated,
        authStatus,
        activeRole,
        setActiveRole: handleSetActiveRole,
        loginUser,
        loginWithGoogle,
        registerUser,
        setRegistrationRole,
        verifyUserEmail,
        resendVerificationCode,
        sendForgotPasswordLink,
        resetUserPassword,
        completeUserOnboarding,
        logoutUser,
        pendingRegistration,
        student,
        alumniList,
        fetchAlumniList,
        requests,
        fetchMentorshipRequests,
        events,
        fetchEvents,
        posts,
        setPosts,
        usersMap,
        connectionRequests,
        fetchIncomingConnectionRequests,
        suggestedPeople,
        fetchSuggestedPeople,
        notifications,
        unreadNotifsCount,
        fetchNotifications,
        unreadMessagesCount,
        refreshUnreadMessagesCount,
        savedPostIds,
        feedFilter,
        setFeedFilter,
        searchQuery,
        setSearchQuery,
        savedAlumniIds,
        toggleSaveAlumni,
        toast,
        showNotification,
        createPost,
        editPost,
        deletePost,
        toggleLikePost,
        toggleSavePost,
        addComment,
        addReply,
        toggleLikeComment,
        toggleConnectUser,
        acceptConnectionRequest,
        ignoreConnectionRequest,
        markNotificationRead,
        markAllNotificationsRead,
        toggleEventRegistration,
        updateUserProfile,
        submitMentorshipRequest,
        updateRequestStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
