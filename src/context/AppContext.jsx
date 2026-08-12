import React, { createContext, useContext, useState } from 'react';
import { MOCK_STUDENT, MOCK_ALUMNI, MOCK_REQUESTS, MOCK_EVENTS } from '../data/mockData';

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
        student,
        setStudent,
        alumniList,
        requests,
        events,
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
