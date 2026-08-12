import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Video, 
  MessageSquare, 
  Calendar, 
  Send,
  UserCheck,
  Check
} from 'lucide-react';

export const MyConnections = () => {
  const { requests, student, usersMap, showNotification } = useApp();
  const [mainView, setMainView] = useState('sessions'); // 'sessions' | 'messages'
  const [activeTab, setActiveTab] = useState('accepted');

  // Interactive message state
  const [selectedChatUser, setSelectedChatUser] = useState('alm_1');
  const [messageInput, setMessageInput] = useState('');
  const [chatThreads, setChatThreads] = useState({
    alm_1: [
      { id: 1, sender: 'alm_1', text: 'Hi Tokir! Looking forward to our mock system design session this weekend.', time: '10:30 AM' },
      { id: 2, sender: 'stu_1', text: 'Thank you Priya ma\'am! I have prepared the distributed cache design doc.', time: '10:32 AM' },
    ],
    alm_2: [
      { id: 1, sender: 'alm_2', text: 'Hey Tokir, checked your GitHub repo. Great work on the drone navigation model!', time: 'Yesterday' },
    ],
    alm_3: [
      { id: 1, sender: 'alm_3', text: 'Hi Tokir, let me know if you need any UX feedback on the portal project.', time: '2 days ago' },
    ],
  });

  const myRequests = requests.filter((r) => r.studentId === student.id);
  const acceptedMentors = myRequests.filter((r) => r.status === 'Accepted');
  const pendingRequests = myRequests.filter((r) => r.status === 'Pending');
  const completedMentorships = myRequests.filter((r) => r.status === 'Completed');

  const getDisplayedList = () => {
    if (activeTab === 'accepted') return acceptedMentors;
    if (activeTab === 'pending') return pendingRequests;
    return completedMentorships;
  };

  const displayed = getDisplayedList();

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'stu_1',
      text: messageInput.trim(),
      time: 'Just now',
    };

    setChatThreads((prev) => ({
      ...prev,
      [selectedChatUser]: [...(prev[selectedChatUser] || []), newMsg],
    }));

    setMessageInput('');
    showNotification('Message sent');
  };

  const activeChatPartner = usersMap[selectedChatUser] || {
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    headline: 'Senior AI Engineer @ Google',
    company: 'Google',
  };

  return (
    <div className="min-h-screen bg-slate-100/75 py-5">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 space-y-4">
        
        {/* Header Title with View Switcher */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold text-slate-900">Connections & Mentorship</h1>
            <p className="text-xs text-slate-500">
              Manage your confirmed 1-on-1 mentorship sessions, requests, and direct alumni chats.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setMainView('sessions')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                mainView === 'sessions' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mentorship Sessions
            </button>
            <button
              onClick={() => setMainView('messages')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                mainView === 'messages' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Direct Messages
            </button>
          </div>
        </div>

        {/* View 1: Mentorship Sessions */}
        {mainView === 'sessions' && (
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex items-center gap-1 shadow-2xs">
              <button
                onClick={() => setActiveTab('accepted')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'accepted' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Active & Scheduled ({acceptedMentors.length})
              </button>

              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'pending' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Pending Requests ({pendingRequests.length})
              </button>

              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'completed' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Past Sessions ({completedMentorships.length})
              </button>
            </div>

            {/* List */}
            {displayed.length > 0 ? (
              <div className="space-y-3">
                {displayed.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/alumni/${req.alumniId}`}
                          className="text-xs font-bold text-slate-900 hover:text-red-700 hover:underline truncate"
                        >
                          {req.alumniName}
                        </Link>
                        <span className="text-[11px] text-slate-400 font-normal">
                          ({req.alumniCompany})
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.2 rounded ${
                            req.status === 'Accepted'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : req.status === 'Pending'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-medium">{req.topic}</p>
                      <p className="text-xs text-slate-500 max-w-xl">"{req.message}"</p>

                      {req.scheduledTime && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Scheduled: {req.scheduledTime}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.meetingLink && (
                        <a
                          href={req.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Launch Meeting</span>
                        </a>
                      )}

                      <button
                        onClick={() => {
                          setSelectedChatUser(req.alumniId);
                          setMainView('messages');
                        }}
                        className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>Chat</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
                <p className="text-xs font-medium text-slate-700">No sessions in this category</p>
                <Link
                  to="/find-mentor"
                  className="inline-block text-xs font-semibold text-red-700 hover:underline"
                >
                  Explore mentors and schedule a 1-on-1 session →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* View 2: Direct Messages Split View */}
        {mainView === 'messages' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
            {/* Conversation List (4 Cols) */}
            <div className="md:col-span-4 border-r border-slate-200 p-3 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 px-2">Conversations</h3>
              
              <div className="space-y-1">
                {[
                  { id: 'alm_1', name: 'Priya Sharma', role: 'Senior AI Engineer @ Google', lastMsg: 'Looking forward to our session...' },
                  { id: 'alm_2', name: 'Aman Gupta', role: 'Staff SDE @ Amazon', lastMsg: 'Checked your repo. Great work!' },
                  { id: 'alm_3', name: 'Ananya Iyer', role: 'Lead UX Architect @ Microsoft', lastMsg: 'Let me know if you need feedback...' },
                ].map((c) => {
                  const active = selectedChatUser === c.id;
                  const alum = usersMap[c.id] || {};
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChatUser(c.id)}
                      className={`w-full p-2.5 rounded-lg text-left transition-colors flex items-start gap-2.5 cursor-pointer ${
                        active ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <img
                        src={alum.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300'}
                        alt={c.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="text-xs font-bold text-slate-900 block truncate">{c.name}</span>
                        <p className="text-[11px] text-slate-500 truncate">{c.role}</p>
                        <p className="text-[10px] text-slate-400 truncate">{c.lastMsg}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Chat Thread (8 Cols) */}
            <div className="md:col-span-8 flex flex-col justify-between">
              {/* Chat Header */}
              <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={activeChatPartner.avatar}
                    alt={activeChatPartner.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <Link
                      to={`/alumni/${selectedChatUser}`}
                      className="text-xs font-bold text-slate-900 hover:text-red-700 hover:underline block"
                    >
                      {activeChatPartner.name}
                    </Link>
                    <span className="text-[11px] text-slate-500 block -mt-0.5">
                      {activeChatPartner.headline}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/alumni/${selectedChatUser}`}
                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-900"
                >
                  View Profile
                </Link>
              </div>

              {/* Chat Messages Body */}
              <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[360px]">
                {(chatThreads[selectedChatUser] || []).map((msg) => {
                  const isMe = msg.sender === 'stu_1';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-sm px-3.5 py-2 rounded-xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-slate-900 text-white rounded-br-none'
                            : 'bg-slate-100 text-slate-800 rounded-bl-none'
                        }`}
                      >
                        <p>{msg.text}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 px-1 pt-0.5">{msg.time}</span>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message ${activeChatPartner.name.split(' ')[0]}...`}
                  className="flex-1 bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="px-3.5 py-2 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-40 transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
