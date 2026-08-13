/**
 * JECRC Community — Mock Messaging Dataset
 * 
 * Realistic 1-on-1 private conversations between JECRC students and alumni.
 * Designed with a clean, decoupled data model for future API readiness.
 */

export const INITIAL_CONVERSATIONS = [
  {
    id: "conv_1",
    participantIds: ["st_101", "alm_13"], // Tokir Khan & Rahul Sharma (Amazon)
    unreadCount: 0,
    updatedAt: "2026-08-13T10:35:00.000Z",
    lastMessageText: "I'm focusing on Java, Spring Boot, and AWS fundamentals.",
    lastMessageAt: "2026-08-13T10:35:00.000Z",
  },
  {
    id: "conv_2",
    participantIds: ["st_101", "alm_14"], // Tokir Khan & Priya Mehta (Microsoft)
    unreadCount: 2,
    updatedAt: "2026-08-13T09:15:00.000Z",
    lastMessageText: "Let's connect next week to review your product roadmap draft.",
    lastMessageAt: "2026-08-13T09:15:00.000Z",
  },
  {
    id: "conv_3",
    participantIds: ["st_101", "alm_1"], // Tokir Khan & Priya Sharma (Google)
    unreadCount: 0,
    updatedAt: "2026-08-12T18:45:00.000Z",
    lastMessageText: "Great progress on the distributed cache document! I'll look over it.",
    lastMessageAt: "2026-08-12T18:45:00.000Z",
  },
  {
    id: "conv_4",
    participantIds: ["st_101", "alm_2"], // Tokir Khan & Arjun Verma (Stripe)
    unreadCount: 1,
    updatedAt: "2026-08-12T15:20:00.000Z",
    lastMessageText: "Send me your updated resume PDF and I'll submit the referral for the frontend internship role.",
    lastMessageAt: "2026-08-12T15:20:00.000Z",
  },
  {
    id: "conv_5",
    participantIds: ["st_101", "alm_8"], // Tokir Khan & Nidhi Agarwal (Zomato)
    unreadCount: 0,
    updatedAt: "2026-08-11T14:10:00.000Z",
    lastMessageText: "Focus on indexing strategies and Kafka consumer group scaling.",
    lastMessageAt: "2026-08-11T14:10:00.000Z",
  },
  {
    id: "conv_6",
    participantIds: ["st_101", "alm_7"], // Tokir Khan & Aman Gupta (Amazon)
    unreadCount: 0,
    updatedAt: "2026-08-10T11:00:00.000Z",
    lastMessageText: "Happy to help! Let me know when you schedule the mock interview.",
    lastMessageAt: "2026-08-10T11:00:00.000Z",
  },
  {
    id: "conv_7",
    participantIds: ["st_101", "st_102"], // Tokir Khan & Meera Nair (Cisco)
    unreadCount: 0,
    updatedAt: "2026-08-09T16:30:00.000Z",
    lastMessageText: "Are we meeting in the AI lab at 4 PM for the final project review?",
    lastMessageAt: "2026-08-09T16:30:00.000Z",
  },
  {
    id: "conv_8",
    participantIds: ["st_101", "alm_15"], // Tokir Khan & Siddharth Jain (Tesla)
    unreadCount: 0,
    updatedAt: "2026-08-08T08:50:00.000Z",
    lastMessageText: "The ROS navigation stack simulation repo is linked on my GitHub.",
    lastMessageAt: "2026-08-08T08:50:00.000Z",
  },
  {
    id: "conv_9",
    participantIds: ["st_101", "alm_9"], // Tokir Khan & Harsh Vardhan (Razorpay)
    unreadCount: 0,
    updatedAt: "2026-08-07T12:00:00.000Z",
    lastMessageText: "Make sure you understand idempotency keys and webhook retry policies.",
    lastMessageAt: "2026-08-07T12:00:00.000Z",
  },
  {
    id: "conv_10",
    participantIds: ["st_101", "st_103"], // Tokir Khan & Aditya Roy (Coding Club)
    unreadCount: 0,
    updatedAt: "2026-08-06T17:40:00.000Z",
    lastMessageText: "JU Hackathon registration forms are live! Team registration is open.",
    lastMessageAt: "2026-08-06T17:40:00.000Z",
  },
  {
    id: "conv_11",
    participantIds: ["st_101", "alm_12"], // Tokir Khan & Tanvi Mathur (Uber)
    unreadCount: 0,
    updatedAt: "2026-08-05T19:20:00.000Z",
    lastMessageText: "Your Figma component hierarchy looks super clean and structured.",
    lastMessageAt: "2026-08-05T19:20:00.000Z",
  },
];

export const INITIAL_MESSAGES = [
  // --- conv_1: Tokir Khan & Rahul Sharma (alm_13) ---
  {
    id: "msg_101",
    conversationId: "conv_1",
    senderId: "st_101",
    text: "Hi Rahul bhaiya! I saw your post regarding backend systems at Amazon. I'm currently preparing for SDE placements.",
    createdAt: "2026-08-13T10:28:00.000Z",
  },
  {
    id: "msg_102",
    conversationId: "conv_1",
    senderId: "alm_13",
    text: "Hey Tokir! Always happy to help a fellow JECRCian.",
    createdAt: "2026-08-13T10:30:00.000Z",
  },
  {
    id: "msg_103",
    conversationId: "conv_1",
    senderId: "alm_13",
    text: "Which tech stack and core areas are you currently focusing on?",
    createdAt: "2026-08-13T10:31:00.000Z",
  },
  {
    id: "msg_104",
    conversationId: "conv_1",
    senderId: "st_101",
    text: "I'm focusing on Java, Spring Boot, and AWS fundamentals.",
    createdAt: "2026-08-13T10:35:00.000Z",
  },

  // --- conv_2: Tokir Khan & Priya Mehta (alm_14) ---
  {
    id: "msg_201",
    conversationId: "conv_2",
    senderId: "st_101",
    text: "Hello Priya ma'am! I wanted to ask about transition opportunities into Associate Product Manager roles.",
    createdAt: "2026-08-13T09:00:00.000Z",
  },
  {
    id: "msg_202",
    conversationId: "conv_2",
    senderId: "alm_14",
    text: "Hi Tokir! Having a technical background from JECRC is a huge plus for technical PM roles.",
    createdAt: "2026-08-13T09:10:00.000Z",
  },
  {
    id: "msg_203",
    conversationId: "conv_2",
    senderId: "alm_14",
    text: "Let's connect next week to review your product roadmap draft.",
    createdAt: "2026-08-13T09:15:00.000Z",
  },

  // --- conv_3: Tokir Khan & Priya Sharma (alm_1) ---
  {
    id: "msg_301",
    conversationId: "conv_3",
    senderId: "alm_1",
    text: "Hi Tokir! Looking forward to our mock system design session this weekend.",
    createdAt: "2026-08-12T18:30:00.000Z",
  },
  {
    id: "msg_302",
    conversationId: "conv_3",
    senderId: "st_101",
    text: "Thank you Priya ma'am! I have prepared the distributed cache design doc covering write-through and cache-aside patterns.",
    createdAt: "2026-08-12T18:40:00.000Z",
  },
  {
    id: "msg_303",
    conversationId: "conv_3",
    senderId: "alm_1",
    text: "Great progress on the distributed cache document! I'll look over it.",
    createdAt: "2026-08-12T18:45:00.000Z",
  },

  // --- conv_4: Tokir Khan & Arjun Verma (alm_2) ---
  {
    id: "msg_401",
    conversationId: "conv_4",
    senderId: "alm_2",
    text: "Hey Tokir, checked your GitHub repo. Great work on the real-time profiler tool!",
    createdAt: "2026-08-12T15:00:00.000Z",
  },
  {
    id: "msg_402",
    conversationId: "conv_4",
    senderId: "st_101",
    text: "Thanks Arjun sir! Really appreciate the feedback on reducing React component re-renders.",
    createdAt: "2026-08-12T15:10:00.000Z",
  },
  {
    id: "msg_403",
    conversationId: "conv_4",
    senderId: "alm_2",
    text: "Send me your updated resume PDF and I'll submit the referral for the frontend internship role.",
    createdAt: "2026-08-12T15:20:00.000Z",
  },

  // --- conv_5: Tokir Khan & Nidhi Agarwal (alm_8) ---
  {
    id: "msg_501",
    conversationId: "conv_5",
    senderId: "st_101",
    text: "Hi Nidhi ma'am! Read your post on microservices communication at Zomato. Very insightful!",
    createdAt: "2026-08-11T13:50:00.000Z",
  },
  {
    id: "msg_502",
    conversationId: "conv_5",
    senderId: "alm_8",
    text: "Glad it was helpful! When designing for high concurrency, always think about backpressure.",
    createdAt: "2026-08-11T14:05:00.000Z",
  },
  {
    id: "msg_503",
    conversationId: "conv_5",
    senderId: "alm_8",
    text: "Focus on indexing strategies and Kafka consumer group scaling.",
    createdAt: "2026-08-11T14:10:00.000Z",
  },

  // --- conv_6: Tokir Khan & Aman Gupta (alm_7) ---
  {
    id: "msg_601",
    conversationId: "conv_6",
    senderId: "st_101",
    text: "Hi Aman bhaiya! Wanted to know how you approached dynamic programming questions during campus drives.",
    createdAt: "2026-08-10T10:45:00.000Z",
  },
  {
    id: "msg_602",
    conversationId: "conv_6",
    senderId: "alm_7",
    text: "Start with recursive formulation, memoize state, and only then optimize to tabulation.",
    createdAt: "2026-08-10T10:55:00.000Z",
  },
  {
    id: "msg_603",
    conversationId: "conv_6",
    senderId: "alm_7",
    text: "Happy to help! Let me know when you schedule the mock interview.",
    createdAt: "2026-08-10T11:00:00.000Z",
  },

  // --- conv_7: Tokir Khan & Meera Nair (st_102) ---
  {
    id: "msg_701",
    conversationId: "conv_7",
    senderId: "st_102",
    text: "Hey Tokir, have you finalized the edge inference benchmarking slides?",
    createdAt: "2026-08-09T16:15:00.000Z",
  },
  {
    id: "msg_702",
    conversationId: "conv_7",
    senderId: "st_101",
    text: "Yes, I added the latency comparison charts for INT8 vs FP32 precision.",
    createdAt: "2026-08-09T16:25:00.000Z",
  },
  {
    id: "msg_703",
    conversationId: "conv_7",
    senderId: "st_102",
    text: "Are we meeting in the AI lab at 4 PM for the final project review?",
    createdAt: "2026-08-09T16:30:00.000Z",
  },

  // --- conv_8: Tokir Khan & Siddharth Jain (alm_15) ---
  {
    id: "msg_801",
    conversationId: "conv_8",
    senderId: "st_101",
    text: "Hi Siddharth sir! Saw your work on autonomous robotics at Tesla. Any advice for getting started with ROS2?",
    createdAt: "2026-08-08T08:40:00.000Z",
  },
  {
    id: "msg_802",
    conversationId: "conv_8",
    senderId: "alm_15",
    text: "The ROS navigation stack simulation repo is linked on my GitHub.",
    createdAt: "2026-08-08T08:50:00.000Z",
  },

  // --- conv_9: Tokir Khan & Harsh Vardhan (alm_9) ---
  {
    id: "msg_901",
    conversationId: "conv_9",
    senderId: "st_101",
    text: "Hello Harsh sir! I'm studying API design for financial services and payment gateways.",
    createdAt: "2026-08-07T11:45:00.000Z",
  },
  {
    id: "msg_902",
    conversationId: "conv_9",
    senderId: "alm_9",
    text: "Make sure you understand idempotency keys and webhook retry policies.",
    createdAt: "2026-08-07T12:00:00.000Z",
  },

  // --- conv_10: Tokir Khan & Aditya Roy (st_103) ---
  {
    id: "msg_1001",
    conversationId: "conv_10",
    senderId: "st_103",
    text: "JU Hackathon registration forms are live! Team registration is open.",
    createdAt: "2026-08-06T17:40:00.000Z",
  },

  // --- conv_11: Tokir Khan & Tanvi Mathur (alm_12) ---
  {
    id: "msg_1101",
    conversationId: "conv_11",
    senderId: "st_101",
    text: "Hi Tanvi ma'am, thanks for reviewing the JECRC community portal UI design.",
    createdAt: "2026-08-05T19:10:00.000Z",
  },
  {
    id: "msg_1102",
    conversationId: "conv_11",
    senderId: "alm_12",
    text: "Your Figma component hierarchy looks super clean and structured.",
    createdAt: "2026-08-05T19:20:00.000Z",
  },
];
