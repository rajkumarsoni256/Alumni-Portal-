import React, { createContext, useContext, useState } from 'react';
import { 
  MOCK_STUDENT, 
  MOCK_ALUMNI, 
  MOCK_REQUESTS, 
  MOCK_EVENTS, 
  MOCK_COMMUNITY_POSTS, 
  MOCK_USERS, 
  MOCK_SUGGESTED_PEOPLE,
  MOCK_NOTIFICATIONS
} from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
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

  // Suggested Connections
  const [suggestedPeople, setSuggestedPeople] = useState(MOCK_SUGGESTED_PEOPLE);

  // Notifications
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

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

  // Resolve current logged-in user profile according to activeRole
  const currentUser = activeRole === 'alumni' 
    ? {
        ...MOCK_USERS.alm_1,
        connectionsCount: 1420,
        profileViewsCount: 890,
      }
    : activeRole === 'admin' 
      ? {
          id: 'admin_1',
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
        };

  // Community Feed Actions
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

    // Also register user into usersMap if needed
    if (!usersMap[currentUser.id]) {
      setUsersMap((prev) => ({
        ...prev,
        [currentUser.id]: currentUser,
      }));
    }

    setPosts((prev) => [newPost, ...prev]);
    showNotification('Post published to JECRC Community Feed!', 'success');
    return newPost;
  };

  const deletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    showNotification('Post removed successfully.', 'info');
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
          showNotification(nextSaved ? 'Saved post to bookmarks' : 'Removed post from bookmarks', 'info');
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

  const addComment = (postId, content) => {
    if (!content || !content.trim()) return;
    const newComment = {
      id: `c_${Date.now()}`,
      authorId: currentUser.id,
      createdAt: 'Just now',
      content: content.trim(),
      likes: 0,
      likedByCurrentUser: false,
      replies: [],
    };

    // Ensure currentUser is in usersMap
    setUsersMap((prev) => ({
      ...prev,
      [currentUser.id]: currentUser,
    }));

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...(p.comments || []), newComment],
          };
        }
        return p;
      })
    );
    showNotification('Comment added to conversation!', 'success');
  };

  const addReply = (postId, commentId, content) => {
    if (!content || !content.trim()) return;
    const newReply = {
      id: `r_${Date.now()}`,
      authorId: currentUser.id,
      createdAt: 'Just now',
      content: content.trim(),
      likes: 0,
      likedByCurrentUser: false,
    };

    setUsersMap((prev) => ({
      ...prev,
      [currentUser.id]: currentUser,
    }));

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
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
    showNotification('Reply added!', 'success');
  };

  const toggleLikeComment = (postId, commentId, replyId = null) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: (p.comments || []).map((c) => {
              if (c.id === commentId) {
                if (replyId) {
                  return {
                    ...c,
                    replies: (c.replies || []).map((r) => {
                      if (r.id === replyId) {
                        const next = !r.likedByCurrentUser;
                        return {
                          ...r,
                          likedByCurrentUser: next,
                          likes: next ? r.likes + 1 : Math.max(0, r.likes - 1),
                        };
                      }
                      return r;
                    }),
                  };
                }
                const next = !c.likedByCurrentUser;
                return {
                  ...c,
                  likedByCurrentUser: next,
                  likes: next ? c.likes + 1 : Math.max(0, c.likes - 1),
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

  const toggleConnectUser = (userId) => {
    setSuggestedPeople((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.connectionStatus === 'none' ? 'pending' : u.connectionStatus === 'pending' ? 'none' : 'connected';
          showNotification(
            nextStatus === 'pending'
              ? `Connection invitation sent to ${u.name}`
              : `Connection request withdrawn`,
            'info'
          );
          return { ...u, connectionStatus: nextStatus };
        }
        return u;
      })
    );
  };

  const markNotificationRead = (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, unread: false } : n))
    );
  };

  const toggleSaveAlumni = (alumniId) => {
    setSavedAlumniIds((prev) => {
      const exists = prev.includes(alumniId);
      const updated = exists ? prev.filter((id) => id !== alumniId) : [...prev, alumniId];
      showNotification(
        exists ? 'Removed from saved alumni' : 'Saved alumni to your bookmarks!',
        'info'
      );
      return updated;
    });
  };

  const submitMentorshipRequest = (newReq) => {
    const created = {
      id: `req_${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      studentAvatar: student.avatar,
      studentDegree: student.degree,
      status: 'Pending',
      requestedDate: new Date().toISOString().split('T')[0],
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

  return (
    <AppContext.Provider
      value={{
        activeRole,
        setActiveRole,
        currentUser,
        student,
        setStudent,
        alumniList,
        requests,
        events,
        posts,
        setPosts,
        usersMap,
        suggestedPeople,
        notifications,
        savedPostIds,
        feedFilter,
        setFeedFilter,
        searchQuery,
        setSearchQuery,
        createPost,
        deletePost,
        toggleLikePost,
        toggleSavePost,
        addComment,
        addReply,
        toggleLikeComment,
        toggleConnectUser,
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
        toast,
        showNotification,
      }}
    >
      {children}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white rounded-lg shadow-lg border border-slate-800 text-xs font-medium">
          <span className={`w-2 h-2 rounded-full shrink-0 ${toast.type === 'info' ? 'bg-blue-400' : 'bg-emerald-400'}`}></span>
          <p>{toast.message}</p>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

