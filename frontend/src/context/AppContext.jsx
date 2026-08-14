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
import { settingsService } from '../services/settingsService';

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
  const [myConnections, setMyConnections] = useState([]);
  const [userSettings, setUserSettings] = useState(null);

  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme === 'DARK') {
      root.classList.add('dark');
    } else if (theme === 'LIGHT') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const fetchUserSettings = async () => {
    try {
      const settings = await settingsService.getSettings();
      setUserSettings(settings);
      if (settings?.appearance?.theme) {
        applyTheme(settings.appearance.theme);
      }
      return settings;
    } catch (err) {
      console.warn('Failed to load user settings:', err);
      return null;
    }
  };

  const updateUserSettings = async (patch) => {
    setUserSettings((prev) => (prev ? { ...prev, ...patch } : patch));
    try {
      const updated = await settingsService.updateSettings(patch);
      setUserSettings(updated);
      if (patch.theme || updated?.appearance?.theme) {
        applyTheme(patch.theme || updated.appearance.theme);
      }
      return updated;
    } catch (err) {
      showNotification(err.message || 'Failed to update settings', 'error');
      fetchUserSettings();
      throw err;
    }
  };

  const blockUser = async (targetUserId) => {
    try {
      const res = await settingsService.blockUser(targetUserId);
      showNotification('User blocked', 'info');
      await fetchSuggestedPeople();
      await fetchAlumniList();
      return res;
    } catch (err) {
      showNotification(err.message || 'Failed to block user', 'error');
      throw err;
    }
  };

  const unblockUser = async (targetUserId) => {
    try {
      const res = await settingsService.unblockUser(targetUserId);
      showNotification('User unblocked', 'info');
      return res;
    } catch (err) {
      showNotification(err.message || 'Failed to unblock user', 'error');
      throw err;
    }
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

  const fetchMyConnections = async () => {
    try {
      const res = await connectionService.getMyConnections();
      const list = Array.isArray(res) ? res : (res?.connections || []);
      setMyConnections(list);
      return list;
    } catch (err) {
      console.warn('Failed to load accepted connections:', err);
      setMyConnections([]);
      return [];
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
            await fetchUserSettings();
            await fetchAlumniList();
            await fetchSuggestedPeople();
            await fetchIncomingConnectionRequests();
            await fetchMyConnections();
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

  const defaultAvatar = null;

  const currentUser = authUser?.role?.toUpperCase() === 'ADMIN'
    ? {
        id: authUser.id,
        name: 'Dean of Alumni Relations',
        email: authUser.email,
        role: 'admin',
        roleUpper: 'ADMIN',
        avatar: userProfile?.avatarUrl || authUser?.avatarUrl || null,
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
        avatar: userProfile?.avatarUrl || authUser?.avatarUrl || null,
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
    // Optimistic UI toggle
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const currentlyLiked = p.isLiked || p.likedByCurrentUser;
          const newCount = currentlyLiked ? Math.max(0, (p.likesCount || p.likes || 0) - 1) : (p.likesCount || p.likes || 0) + 1;
          return {
            ...p,
            isLiked: !currentlyLiked,
            likedByCurrentUser: !currentlyLiked,
            likesCount: newCount,
            likes: newCount,
          };
        }
        return p;
      })
    );

    try {
      const res = await postService.toggleLike(postId);
      if (res) {
        const isLiked = res.isLiked ?? res.liked ?? res.likedByCurrentUser;
        const likesCount = res.likesCount ?? res.likeCount ?? res.likes;
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                isLiked: isLiked,
                likedByCurrentUser: isLiked,
                likesCount: likesCount,
                likes: likesCount,
              };
            }
            return p;
          })
        );
      }
    } catch (err) {
      console.warn('Failed to update like status:', err);
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

  const addComment = async (postId, contentOrPayload) => {
    const payload = typeof contentOrPayload === 'string'
      ? { content: contentOrPayload.trim() }
      : { ...contentOrPayload, content: (contentOrPayload.content || contentOrPayload.text || '').trim() };

    if (!payload.content) return;

    try {
      const res = await postService.addComment(postId, payload);
      const newComment = res?.comment || res;

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const existingComments = p.comments || [];
            return {
              ...p,
              comments: [...existingComments, newComment],
              commentsCount: res?.commentsCount !== undefined ? res.commentsCount : (p.commentsCount || 0) + 1,
            };
          }
          return p;
        })
      );
      showNotification(payload.parentCommentId ? 'Reply posted successfully!' : 'Comment posted successfully!', 'success');
      return newComment;
    } catch (err) {
      showNotification(err.message || 'Failed to post comment', 'error');
      throw err;
    }
  };

  const addReply = async (postId, parentCommentId, text) => {
    return addComment(postId, { content: text, parentCommentId });
  };

  const toggleLikeComment = async (postId, commentId) => {
    const targetCommentId = commentId || postId;
    try {
      const res = await postService.toggleLikeComment(targetCommentId);
      return res;
    } catch (err) {
      showNotification(err.message || 'Failed to update comment like', 'error');
      throw err;
    }
  };

  const togglePinComment = async (commentId) => {
    try {
      const res = await postService.togglePinComment(commentId);
      showNotification(res.message || 'Comment pin status updated', 'info');
      return res;
    } catch (err) {
      showNotification(err.message || 'Failed to pin/unpin comment', 'error');
      throw err;
    }
  };

  const editComment = async (commentId, content) => {
    try {
      const res = await postService.editComment(commentId, { content });
      showNotification('Comment updated', 'info');
      return res;
    } catch (err) {
      showNotification(err.message || 'Failed to edit comment', 'error');
      throw err;
    }
  };

  const deleteComment = async (postId, commentId) => {
    const targetCommentId = commentId || postId;
    try {
      const res = await postService.deleteComment(postId, targetCommentId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              commentsCount: Math.max(0, (p.commentsCount || 1) - 1),
            };
          }
          return p;
        })
      );
      showNotification('Comment deleted', 'info');
      return res;
    } catch (err) {
      showNotification(err.message || 'Failed to delete comment', 'error');
      throw err;
    }
  };

  const toggleConnectUser = async (target) => {
    const targetUserId = typeof target === 'object' ? (target?.id || target?.userId || target?.user_id) : target;
    if (!targetUserId) {
      showNotification('Target user ID is required', 'error');
      return null;
    }
    try {
      const res = await connectionService.sendRequest(targetUserId);
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
      const updated = await profileService.updateProfile(profileData);
      const merged = { ...(userProfile || {}), ...(updated || profileData) };
      setUserProfile(merged);

      const avatarVal = profileData.avatarUrl || profileData.avatar || updated?.avatarUrl || updated?.avatar;
      const bannerVal = profileData.bannerUrl || profileData.banner || profileData.coverImage || updated?.bannerUrl || updated?.banner;

      setAuthUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...merged,
          ...(avatarVal ? { avatar: avatarVal, avatarUrl: avatarVal } : {}),
          ...(bannerVal ? { bannerUrl: bannerVal, banner: bannerVal, coverImage: bannerVal } : {}),
        };
      });

      if (merged.id || merged.userId) {
        const uid = merged.id || merged.userId;
        setUsersMap((prev) => ({
          ...prev,
          [uid]: {
            ...prev[uid],
            ...merged,
            ...(avatarVal ? { avatar: avatarVal, avatarUrl: avatarVal } : {}),
            ...(bannerVal ? { bannerUrl: bannerVal, banner: bannerVal, coverImage: bannerVal } : {}),
          },
        }));
      }

      showNotification('Profile updated successfully!', 'success');
      return merged;
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
        myConnections,
        fetchMyConnections,
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
        editComment,
        deleteComment,
        toggleLikeComment,
        togglePinComment,
        toggleConnectUser,
        acceptConnectionRequest,
        ignoreConnectionRequest,
        markNotificationRead,
        markAllNotificationsRead,
        toggleEventRegistration,
        updateUserProfile,
        submitMentorshipRequest,
        updateRequestStatus,
        userSettings,
        fetchUserSettings,
        updateUserSettings,
        blockUser,
        unblockUser,
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
