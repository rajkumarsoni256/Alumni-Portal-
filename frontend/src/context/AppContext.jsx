import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  MOCK_STUDENT,
  MOCK_ALUMNI,
  MOCK_REQUESTS,
  MOCK_EVENTS,
  MOCK_COMMUNITY_POSTS,
  MOCK_USERS,
  MOCK_SUGGESTED_PEOPLE,
  MOCK_NOTIFICATIONS,
  MOCK_CONNECTION_REQUESTS
} from '../data/mockData';
import { authService } from '../services/authService';
import { postService } from '../services/postService';
import { messageService } from '../services/messageService';
import { profileService } from '../services/profileService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Authentication State
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStatus, setAuthStatus] = useState('UNAUTHENTICATED'); // 'UNAUTHENTICATED' | 'REGISTERED' | 'EMAIL_UNVERIFIED' | 'ONBOARDING' | 'AUTHENTICATED'
  const [authUser, setAuthUser] = useState(null);
  const [pendingRegistration, setPendingRegistration] = useState({
    name: '',
    email: '',
    role: 'student',
    emailVerified: false,
    profileCompleted: false,
  });

  // Active demo role: 'student', 'alumni', or 'admin'
  const [activeRole, setActiveRole] = useState('student');

  // Student state
  const [student, setStudent] = useState(MOCK_STUDENT);

  // Alumni list state
  const [alumniList, setAlumniList] = useState(MOCK_ALUMNI);

  // Mentorship requests
  const [requests, setRequests] = useState(MOCK_REQUESTS);

  // Events list
  const [events, setEvents] = useState(MOCK_EVENTS);

  // Community Feed Posts
  const [posts, setPosts] = useState(MOCK_COMMUNITY_POSTS);

  // Users lookup map
  const [usersMap, setUsersMap] = useState(MOCK_USERS);

  // Incoming Connection Requests
  const [connectionRequests, setConnectionRequests] = useState(MOCK_CONNECTION_REQUESTS);

  // Suggested Connections
  const [suggestedPeople, setSuggestedPeople] = useState(MOCK_SUGGESTED_PEOPLE);

  // Notifications
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  // Unread Messages Count
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(() => messageService.getUnreadCount('st_101'));

  const refreshUnreadMessagesCount = (userId = 'st_101') => {
    setUnreadMessagesCount(messageService.getUnreadCount(userId));
  };

  // Saved Post IDs
  const [savedPostIds, setSavedPostIds] = useState(['post_1']);

  // Feed Filter Tab ('all' | 'alumni' | 'student' | 'jobs' | 'saved')
  const [feedFilter, setFeedFilter] = useState('all');

  // Search query (global community search)
  const [searchQuery, setSearchQuery] = useState('');

  // Saved Alumni IDs
  const [savedAlumniIds, setSavedAlumniIds] = useState(MOCK_STUDENT.savedAlumniIds || []);

  // Filter & Search state for Find Mentor wizard
  const [selectedInterests, setSelectedInterests] = useState(['AI & Machine Learning', 'Web Development']);
  const [careerGoal, setCareerGoal] = useState('Software Engineer / AI Product Specialist');
  const [experienceLevel, setExperienceLevel] = useState('0-2 years (Entry / Campus)');
  const [preferredIndustry, setPreferredIndustry] = useState('Technology & Software');

  // Toast notification system
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Restores auth session from backend using stored JWT on app startup
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
            if (user.role?.toUpperCase() === 'ADMIN' || isComplete) {
              setAuthStatus('AUTHENTICATED');
            } else {
              setAuthStatus('ONBOARDING');
            }
          } else {
            authService.clearToken();
            setIsAuthenticated(false);
            setAuthStatus('UNAUTHENTICATED');
          }
        } catch (err) {
          authService.clearToken();
          setIsAuthenticated(false);
          setAuthStatus('UNAUTHENTICATED');
        }
      } else {
        setIsAuthenticated(false);
        setAuthStatus('UNAUTHENTICATED');
      }
      setIsLoading(false);
    };

    initializeAuthSession();
  }, []);

  // Resolve current logged-in user profile according to activeRole and authUser
  const currentUser = activeRole === 'alumni'
    ? {
      ...MOCK_USERS.alm_1,
      id: authUser?.id || MOCK_USERS.alm_1.id,
      email: authUser?.email || MOCK_USERS.alm_1.email,
      connectionsCount: 1420,
      profileViewsCount: 890,
    }
    : activeRole === 'admin'
      ? {
        id: authUser?.id || 'admin_1',
        email: authUser?.email || 'admin@jecrc.ac.in',
        name: 'Dean of Alumni Relations',
        role: 'Admin',
        headline: 'JECRC University Alumni Administration',
        batch: 'Faculty & Admin',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300',
        verified: true,
        isAlumni: true,
        company: 'JECRC University',
        connectionsCount: 3400,
        profileViewsCount: 1950,
      }
      : {
        ...MOCK_USERS.st_101,
        ...student,
        id: authUser?.id || MOCK_USERS.st_101.id,
        email: authUser?.email || MOCK_USERS.st_101.email,
      };

  // ==========================================
  // AUTHENTICATION HANDLERS
  // ==========================================

  const loginUser = async ({ email, password }) => {
    try {
      const response = await authService.login({ email, password });
      const user = response.user || response;
      const normalizedRole = (user.role || 'STUDENT').toLowerCase();
      const isComplete = user.profileComplete !== false;

      setAuthUser(user);
      setActiveRole(normalizedRole);
      setIsAuthenticated(true);
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
      if (user.role?.toUpperCase() === 'ADMIN' || isComplete) {
        setAuthStatus('AUTHENTICATED');
      } else {
        setAuthStatus('ONBOARDING');
      }
      showNotification(`Signed in with Google as ${user.email}`);
      return user;
    } catch (err) {
      showNotification(err.message || 'Google authentication failed', 'error');
      throw err;
    }
  };

  const registerUser = async ({ name, email, password, role = 'student' }) => {
    try {
      const response = await authService.register({ name, email, password, role });
      const user = response.user || response;
      const normalizedRole = role.toLowerCase();

      setPendingRegistration({
        name,
        email,
        role: normalizedRole,
        emailVerified: false,
      });
      setActiveRole(normalizedRole);
      setAuthStatus('EMAIL_UNVERIFIED');
      showNotification('Account created! Please verify your email.');
      return user;
    } catch (err) {
      showNotification(err.message || 'Registration failed', 'error');
      throw err;
    }
  };

  const setRegistrationRole = (role) => {
    setPendingRegistration((prev) => ({
      ...prev,
      role,
    }));
    setActiveRole(role);
  };

  const verifyUserEmail = async (code) => {
    try {
      const targetEmail = pendingRegistration?.email;
      if (!targetEmail) {
        throw new Error('No email found to verify. Please try logging in or registering again.');
      }
      await authService.verifyEmail({ email: targetEmail, code });

      setPendingRegistration((prev) => ({
        ...prev,
        emailVerified: true,
      }));
      setAuthStatus('UNAUTHENTICATED');
      showNotification('Email verified successfully! Please sign in with your credentials.');
      return true;
    } catch (err) {
      showNotification(err.message || 'Email verification failed', 'error');
      throw err;
    }
  };

  const resendVerificationCode = async () => {
    try {
      if (pendingRegistration?.email) {
        await authService.forgotPassword(pendingRegistration.email);
        showNotification(`Verification request sent for ${pendingRegistration.email}`);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to resend code', 'error');
    }
  };

  const sendForgotPasswordLink = async (email) => {
    try {
      const response = await authService.forgotPassword(email);
      showNotification(response?.message || 'If an account exists, a reset link has been sent.');
      return true;
    } catch (err) {
      showNotification(err.message || 'Failed to process forgot password', 'error');
      throw err;
    }
  };

  const resetUserPassword = async ({ token, newPassword }) => {
    try {
      await authService.resetPassword({ token, newPassword });
      showNotification('Your password has been reset successfully! Please sign in.');
      return true;
    } catch (err) {
      showNotification(err.message || 'Failed to reset password', 'error');
      throw err;
    }
  };

  const completeUserOnboarding = async (onboardingData) => {
    try {
      await profileService.completeOnboarding(onboardingData);
      setAuthUser((prev) => (prev ? { ...prev, profileComplete: true } : prev));
      setIsAuthenticated(true);
      setAuthStatus('AUTHENTICATED');
      showNotification('Welcome to JECRC Community! Your profile is ready.');
      return true;
    } catch (err) {
      showNotification(err.message || 'Failed to complete onboarding', 'error');
      throw err;
    }
  };

  const logoutUser = () => {
    authService.logout();
    setAuthUser(null);
    setIsAuthenticated(false);
    setAuthStatus('UNAUTHENTICATED');
    showNotification('Signed out from JECRC Community.', 'info');
  };

// ==========================================
// COMMUNITY FEED & CORE HANDLERS
// ==========================================

const createPost = (postPayload) => {
  const newPost = {
    id: `post_${Date.now()}`,
    authorId: currentUser.id,
    createdAt: 'Just now',
    timestamp: Date.now(),
    content: postPayload.content,
    type: postPayload.type || 'TEXT',
    category: currentUser.isAlumni ? 'alumni' : 'student',
    image: postPayload.image || null,
    jobData: postPayload.jobData || null,
    achievementData: postPayload.achievementData || null,
    likes: 0,
    likedByCurrentUser: false,
    savedByCurrentUser: false,
    commentsCount: 0,
    sharesCount: 0,
    tags: postPayload.tags || ['#JECRCCommunity'],
    comments: [],
  };

  if (!usersMap[currentUser.id]) {
    setUsersMap((prev) => ({
      ...prev,
      [currentUser.id]: currentUser,
    }));
  }

  setPosts((prev) => [newPost, ...prev]);
  showNotification('Post created', 'success');
  return newPost;
};

const editPost = (postId, updatedFields) => {
  setPosts((prev) =>
    prev.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          content: updatedFields.content !== undefined ? updatedFields.content : p.content,
          tags: updatedFields.tags !== undefined ? updatedFields.tags : p.tags,
          image: updatedFields.image !== undefined ? updatedFields.image : p.image,
          type: updatedFields.type !== undefined ? updatedFields.type : p.type,
          jobData: updatedFields.jobData !== undefined ? updatedFields.jobData : p.jobData,
          achievementData: updatedFields.achievementData !== undefined ? updatedFields.achievementData : p.achievementData,
          updatedAt: 'Edited just now',
        };
      }
      return p;
    })
  );
  showNotification('Post updated', 'success');
};

const deletePost = (postId) => {
  setPosts((prev) => prev.filter((p) => p.id !== postId));
  showNotification('Post deleted', 'info');
};

const toggleLikePost = (postId) => {
  setPosts((prev) =>
    prev.map((p) => {
      if (p.id === postId) {
        const nextLiked = !p.likedByCurrentUser;
        return {
          ...p,
          likedByCurrentUser: nextLiked,
          likes: nextLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
        };
      }
      return p;
    })
  );
};

const toggleSavePost = (postId) => {
  setPosts((prev) =>
    prev.map((p) => {
      if (p.id === postId) {
        const nextSaved = !p.savedByCurrentUser;
        showNotification(
          nextSaved ? 'Post saved' : 'Post removed from saved',
          'info'
        );
        return {
          ...p,
          savedByCurrentUser: nextSaved,
        };
      }
      return p;
    })
  );

  setSavedPostIds((prev) =>
    prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
  );
};

const addComment = (postId, commentText) => {
  if (!commentText || !commentText.trim()) return;

  const newComment = {
    id: `c_${Date.now()}`,
    authorId: currentUser.id,
    content: commentText.trim(),
    createdAt: 'Just now',
    likes: 0,
    likedByCurrentUser: false,
    replies: [],
  };

  setPosts((prev) =>
    prev.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          commentsCount: (p.commentsCount || 0) + 1,
          comments: [...(p.comments || []), newComment],
        };
      }
      return p;
    })
  );
  showNotification('Comment added', 'success');
};

const addReply = (postId, commentId, replyText) => {
  if (!replyText || !replyText.trim()) return;

  const newReply = {
    id: `r_${Date.now()}`,
    authorId: currentUser.id,
    content: replyText.trim(),
    createdAt: 'Just now',
  };

  setPosts((prev) =>
    prev.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          commentsCount: (p.commentsCount || 0) + 1,
          comments: (p.comments || []).map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newReply],
              };
            }
            return c;
          }),
        };
      }
      return p;
    })
  );
  showNotification('Comment added', 'success');
};

const toggleLikeComment = (postId, commentId) => {
  setPosts((prev) =>
    prev.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: (p.comments || []).map((c) => {
            if (c.id === commentId) {
              const nextLiked = !c.likedByCurrentUser;
              return {
                ...c,
                likedByCurrentUser: nextLiked,
                likes: nextLiked ? (c.likes || 0) + 1 : Math.max(0, (c.likes || 0) - 1),
              };
            }
            return c;
          }),
        };
      }
      return p;
    })
  );
};

const toggleConnectUser = (targetUserId) => {
  let nextStatus = 'pending';

  // 1. Sync usersMap
  setUsersMap((prev) => {
    const existing = prev[targetUserId];
    if (!existing) return prev;
    const currentStatus = existing.connectionStatus || 'none';
    nextStatus = currentStatus === 'pending' ? 'none' : 'pending';
    return {
      ...prev,
      [targetUserId]: {
        ...existing,
        connectionStatus: nextStatus,
      },
    };
  });

  // 2. Sync suggestedPeople
  setSuggestedPeople((prev) =>
    prev.map((person) => {
      if (person.id === targetUserId) {
        const currentStatus = person.connectionStatus || 'none';
        const calculatedStatus = currentStatus === 'pending' ? 'none' : 'pending';
        return {
          ...person,
          connectionStatus: calculatedStatus,
        };
      }
      return person;
    })
  );

  showNotification(
    nextStatus === 'pending'
      ? `Connection request sent`
      : `Connection request withdrawn`,
    'info'
  );
};

const acceptConnectionRequest = (requestId, fromUserId) => {
  setConnectionRequests((prev) => prev.filter((r) => r.id !== requestId));
  setUsersMap((prev) => {
    const existing = prev[fromUserId];
    if (!existing) return prev;
    return {
      ...prev,
      [fromUserId]: {
        ...existing,
        connectionStatus: 'connected',
        connectionsCount: (existing.connectionsCount || 0) + 1,
      },
    };
  });
  setSuggestedPeople((prev) =>
    prev.map((person) =>
      person.id === fromUserId ? { ...person, connectionStatus: 'connected' } : person
    )
  );
  showNotification('Connection request accepted', 'success');
};

const ignoreConnectionRequest = (requestId) => {
  setConnectionRequests((prev) => prev.filter((r) => r.id !== requestId));
  showNotification('Request ignored', 'info');
};

const markNotificationRead = (notifId) => {
  setNotifications((prev) =>
    prev.map((n) => (n.id === notifId ? { ...n, unread: false } : n))
  );
};

const toggleSaveAlumni = (alumniId) => {
  setSavedAlumniIds((prev) => {
    const exists = prev.includes(alumniId);
    const next = exists ? prev.filter((id) => id !== alumniId) : [...prev, alumniId];
    showNotification(
      exists ? 'Removed alumni from saved list' : 'Saved alumni to your bookmarks'
    );
    return next;
  });
};

const updateUserProfile = (userId, updatedFields) => {
  setUsersMap((prev) => {
    const existing = prev[userId] || {};
    return {
      ...prev,
      [userId]: {
        ...existing,
        ...updatedFields,
      },
    };
  });

  if (userId === student.id || userId === 'st_101') {
    setStudent((prev) => ({
      ...prev,
      ...updatedFields,
    }));
  }

  showNotification('Profile updated', 'success');
};

const addUserSkill = (userId, skillName) => {
  setUsersMap((prev) => {
    const existing = prev[userId];
    if (!existing) return prev;
    const skills = existing.skills || [];
    if (skills.includes(skillName)) return prev;
    return {
      ...prev,
      [userId]: {
        ...existing,
        skills: [...skills, skillName],
      },
    };
  });

  if (userId === student.id || userId === 'st_101') {
    setStudent((prev) => {
      const skills = prev.interests || prev.skills || [];
      if (skills.includes(skillName)) return prev;
      return {
        ...prev,
        skills: [...skills, skillName],
        interests: [...skills, skillName],
      };
    });
  }

  showNotification(`Added skill: ${skillName}`, 'success');
};

const removeUserSkill = (userId, skillToRemove) => {
  setUsersMap((prev) => {
    const existing = prev[userId];
    if (!existing) return prev;
    return {
      ...prev,
      [userId]: {
        ...existing,
        skills: (existing.skills || []).filter((s) => s !== skillToRemove),
      },
    };
  });

  if (userId === student.id || userId === 'st_101') {
    setStudent((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((s) => s !== skillToRemove),
      interests: (prev.interests || []).filter((s) => s !== skillToRemove),
    }));
  }

  showNotification(`Removed skill: ${skillToRemove}`, 'info');
};

const submitMentorshipRequest = (newReq) => {
  const created = {
    id: `req_${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    studentAvatar: student.avatar,
    requestedAt: 'Just now',
    status: 'Pending',
    scheduledTime: null,
    meetingLink: null,
    ...newReq,
  };
  setRequests((prev) => [created, ...prev]);
  showNotification('Mentorship request sent successfully! You can track it in My Connections.');
  return created;
};

const updateRequestStatus = (requestId, newStatus, scheduledTime = null) => {
  setRequests((prev) =>
    prev.map((req) => {
      if (req.id === requestId) {
        return {
          ...req,
          status: newStatus,
          scheduledTime: scheduledTime || req.scheduledTime || 'Upcoming Saturday 3:00 PM',
          meetingLink: newStatus === 'Accepted' ? 'https://meet.google.com/alum-mentorship' : req.meetingLink,
        };
      }
      return req;
    })
  );
  showNotification(`Mentorship request marked as ${newStatus}`);
};

const toggleEventRegistration = (eventId) => {
  setEvents((prev) =>
    prev.map((evt) => {
      if (evt.id === eventId) {
        const nextState = !evt.isRegistered;
        showNotification(
          nextState
            ? `Successfully registered for "${evt.title}"!`
            : `Cancelled registration for "${evt.title}"`,
          nextState ? 'success' : 'info'
        );
        return {
          ...evt,
          isRegistered: nextState,
          registeredCount: nextState ? evt.registeredCount + 1 : evt.registeredCount - 1,
          seatsLeft: nextState ? evt.seatsLeft - 1 : evt.seatsLeft + 1,
        };
      }
      return evt;
    })
  );
};

const handleSetActiveRole = (newRole) => {
  setActiveRole(newRole);
  const userId = newRole === 'alumni' ? 'alm_1' : 'st_101';
  setUnreadMessagesCount(messageService.getUnreadCount(userId));
};

const roleNotifications = notifications.filter((n) => !n.role || n.role === activeRole);

return (
  <AppContext.Provider
    value={{
      isLoading,
      authUser,
      isAuthenticated,
      setIsAuthenticated,
      authStatus,
      setAuthStatus,
      pendingRegistration,
      setPendingRegistration,
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
      activeRole,
      setActiveRole: handleSetActiveRole,
      currentUser,
      student,
      setStudent,
      alumniList,
      requests,
      events,
      posts,
      setPosts,
      usersMap,
      connectionRequests,
      suggestedPeople,
      notifications: roleNotifications,
      savedPostIds,
      feedFilter,
      setFeedFilter,
      searchQuery,
      setSearchQuery,
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
      updateUserProfile,
      addUserSkill,
      removeUserSkill,
      markNotificationRead,
      savedAlumniIds,
      toggleSaveAlumni,
      submitMentorshipRequest,
      updateRequestStatus,
      toggleEventRegistration,
      selectedInterests,
      setSelectedInterests,
      careerGoal,
      setCareerGoal,
      experienceLevel,
      setExperienceLevel,
      preferredIndustry,
      setPreferredIndustry,
      unreadMessagesCount,
      refreshUnreadMessagesCount,
      toast,
      showNotification,
    }}
  >
    {children}
    {toast && (
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white rounded-lg shadow-lg border border-slate-800 text-xs font-medium">
        <span className={`w-2 h-2 rounded-full shrink-0 ${toast.type === 'info' ? 'bg-blue-400' : toast.type === 'error' ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
        <p>{toast.message}</p>
      </div>
    )}
  </AppContext.Provider>
);
};
export const useApp = () => useContext(AppContext);
