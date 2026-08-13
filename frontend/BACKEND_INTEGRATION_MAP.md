# JECRC Community — Backend Integration Map

This document maps all frontend modules, mock data structures, and state management hooks to expected REST API endpoints, request payloads, response formats, and role authorization requirements.

---

## 1. Authentication & Onboarding (Module 01)

| Feature / Action | Current Mock File | Expected REST Endpoint | Method | Role Permission | Request Payload / Params | Expected Response Schema |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **Login** | `authService.js` | `POST /api/v1/auth/login` | `POST` | Public | `{ email, password }` | `{ user: UserObj, token: string }` |
| **Register** | `authService.js` | `POST /api/v1/auth/register` | `POST` | Public | `{ name, email, password, role }` | `{ user: UserObj, verificationToken: string }` |
| **Verify Email** | `authService.js` | `POST /api/v1/auth/verify-email` | `POST` | Public | `{ email, code }` | `{ success: boolean, user: UserObj }` |
| **Request Password Reset** | `authService.js` | `POST /api/v1/auth/forgot-password` | `POST` | Public | `{ email }` | `{ message: string }` |
| **Reset Password** | `authService.js` | `POST /api/v1/auth/reset-password` | `POST` | Public | `{ token, newPassword }` | `{ success: boolean }` |
| **Onboarding Update** | `authService.js` | `PUT /api/v1/users/onboarding` | `PUT` | Student / Alumni | `{ branch, batch, skills, bio, ... }` | `{ user: UserObj }` |
| **Fetch Current User** | `authService.js` | `GET /api/v1/auth/me` | `GET` | Authenticated | `Header: Authorization Bearer` | `{ user: UserObj }` |

---

## 2. Community Feed (Module 03)

| Feature / Action | Current Mock File | Expected REST Endpoint | Method | Role Permission | Request Payload / Params | Expected Response Schema |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **Get Feed Posts** | `mockData.js` | `GET /api/v1/posts` | `GET` | Student / Alumni | `?category=all|alumni|student|jobs|achievements` | `{ posts: PostObj[], total: number }` |
| **Create Post** | `mockData.js` | `POST /api/v1/posts` | `POST` | Student / Alumni | `{ content, image, category }` | `{ post: PostObj }` |
| **Like / Unlike Post** | `mockData.js` | `POST /api/v1/posts/:id/like` | `POST` | Student / Alumni | None | `{ post: PostObj, isLiked: boolean, likesCount: number }` |
| **Add Comment** | `mockData.js` | `POST /api/v1/posts/:id/comments` | `POST` | Student / Alumni | `{ text }` | `{ comment: CommentObj, commentsCount: number }` |

---

## 3. Network & Discovery (Module 04)

| Feature / Action | Current Mock File | Expected REST Endpoint | Method | Role Permission | Request Payload / Params | Expected Response Schema |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **Search & Discover Users** | `mockData.js` | `GET /api/v1/users` | `GET` | Student / Alumni | `?query=string&branch=CSE&batch=2020&role=alumni` | `{ users: UserObj[], total: number }` |
| **Get User Connections** | `mockData.js` | `GET /api/v1/users/connections` | `GET` | Student / Alumni | None | `{ connections: UserObj[] }` |
| **Send Connection Request** | `mockData.js` | `POST /api/v1/connections/request` | `POST` | Student / Alumni | `{ targetUserId }` | `{ status: 'Requested' }` |
| **Accept Connection** | `mockData.js` | `POST /api/v1/connections/:id/accept` | `POST` | Student / Alumni | None | `{ status: 'Connected' }` |

---

## 4. Professional Profiles (Module 05)

| Feature / Action | Current Mock File | Expected REST Endpoint | Method | Role Permission | Request Payload / Params | Expected Response Schema |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **Get Profile Details** | `mockData.js` | `GET /api/v1/users/:id` | `GET` | Student / Alumni | None | `{ user: UserObj, posts: PostObj[] }` |
| **Update Own Profile** | `mockData.js` | `PUT /api/v1/users/profile` | `PUT` | Student / Alumni | `{ name, headline, bio, skills, experience, education }` | `{ user: UserObj }` |

---

## 5. Jobs & Placement Referrals (Module 06)

| Feature / Action | Current Mock File | Expected REST Endpoint | Method | Role Permission | Request Payload / Params | Expected Response Schema |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **List Jobs** | `jobsData.js` | `GET /api/v1/jobs` | `GET` | Student / Alumni | `?search=string&type=Full-time&location=Remote` | `{ jobs: JobObj[], total: number }` |
| **Post Job** | `jobsData.js` | `POST /api/v1/jobs` | `POST` | Alumni / Admin | `{ title, company, type, location, salary, description }` | `{ job: JobObj }` |
| **Save / Bookmark Job** | `jobsData.js` | `POST /api/v1/jobs/:id/bookmark` | `POST` | Student / Alumni | None | `{ isSaved: boolean }` |
| **Apply for Job / Referral**| `jobsData.js` | `POST /api/v1/jobs/:id/apply` | `POST` | Student / Alumni | `{ resumeUrl, coverNote }` | `{ status: 'Applied' }` |

---

## 6. Messaging (Module 07)

| Feature / Action | Current Mock File | Expected REST Endpoint | Method | Role Permission | Request Payload / Params | Expected Response Schema |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **List Conversations** | `messagesData.js` | `GET /api/v1/conversations` | `GET` | Student / Alumni | None | `{ conversations: ConversationObj[] }` |
| **Get Messages in Thread** | `messagesData.js` | `GET /api/v1/conversations/:id/messages` | `GET` | Student / Alumni | None | `{ messages: MessageObj[] }` |
| **Send Text Message** | `messagesData.js` | `POST /api/v1/conversations/:id/messages` | `POST` | Student / Alumni | `{ text }` | `{ message: MessageObj }` |

---

## 7. Notifications (Module 08)

| Feature / Action | Current Mock File | Expected REST Endpoint | Method | Role Permission | Request Payload / Params | Expected Response Schema |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **Get Notifications** | `mockData.js` | `GET /api/v1/notifications` | `GET` | Student / Alumni | None | `{ notifications: NotificationObj[], unreadCount: number }` |
| **Mark Notification Read** | `mockData.js` | `PATCH /api/v1/notifications/:id/read` | `PATCH` | Student / Alumni | None | `{ success: boolean }` |

---

## 8. Events & Mentorship (Module 09)

| Feature / Action | Current Mock File | Expected REST Endpoint | Method | Role Permission | Request Payload / Params | Expected Response Schema |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **List Events** | `mockData.js` | `GET /api/v1/events` | `GET` | Student / Alumni | None | `{ events: EventObj[] }` |
| **Register for Event** | `mockData.js` | `POST /api/v1/events/:id/register` | `POST` | Student / Alumni | None | `{ isRegistered: boolean }` |
| **Request Mentorship** | `mockData.js` | `POST /api/v1/mentorship/requests` | `POST` | Student | `{ mentorId, topic, message }` | `{ request: MentorshipRequestObj }` |
| **List Mentorship Requests**| `mockData.js` | `GET /api/v1/mentorship/requests` | `GET` | Alumni | None | `{ requests: MentorshipRequestObj[] }` |
| **Accept/Decline Mentorship**| `mockData.js` | `PATCH /api/v1/mentorship/requests/:id` | `PATCH` | Alumni | `{ status: 'Accepted' | 'Declined' }` | `{ request: MentorshipRequestObj }` |

---

## 9. Admin Portal (Module 10)

| Feature / Action | Current Mock File | Expected REST Endpoint | Method | Role Permission | Request Payload / Params | Expected Response Schema |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **Admin Dashboard Overview**| `adminUserService.js`| `GET /api/v1/admin/dashboard` | `GET` | Admin | None | `{ metrics: MetricsObj, dataQuality: QualityObj, recentUpdates: UpdateObj[] }` |
| **Admin Users Directory** | `adminUserService.js`| `GET /api/v1/admin/users` | `GET` | Admin | `?search=string&role=alumni&branch=CSE&batch=2020&page=1&limit=20` | `{ users: AdminUserObj[], total: number, page: number, pages: number }` |
| **Admin User Detail** | `adminUserService.js`| `GET /api/v1/admin/users/:id` | `GET` | Admin | None | `{ user: AdminUserDetailObj }` |
| **Admin Export CSV** | `adminUserService.js`| `POST /api/v1/admin/users/export` | `POST` | Admin | `{ columns: string[], filters: Object, userIds?: string[] }` | `CSV Blob (Content-Type: text/csv)` |

---

## 10. Centralized Entity Schemas

### User Entity Schema
```json
{
  "id": "usr_101",
  "email": "rahul.sharma@amazon.com",
  "name": "Rahul Sharma",
  "role": "alumni",
  "phone": "+91 98290 12345",
  "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
  "degree": "B.Tech",
  "branch": "CSE",
  "batch": "2020",
  "graduationYear": "2020",
  "company": "Amazon",
  "designation": "Software Development Engineer II",
  "location": "Bangalore, Karnataka",
  "bio": "Building distributed cloud systems at scale.",
  "skills": ["Distributed Systems", "Java", "AWS", "System Design"],
  "linkedin": "https://linkedin.com/in/rahulsharma",
  "github": "https://github.com/rahulsharma",
  "lastUpdated": "2026-08-11T10:00:00Z",
  "isDataComplete": true
}
```

### Post Entity Schema
```json
{
  "id": "post_201",
  "author": {
    "id": "alm_1",
    "name": "Priya Sharma",
    "role": "alumni",
    "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
    "headline": "Senior AI Engineer @ Google"
  },
  "content": "Excited to share that our team at Google AI just published our latest paper on LLM latency optimization!",
  "category": "Alumni Posts",
  "likesCount": 42,
  "commentsCount": 8,
  "isLiked": false,
  "createdAt": "2 hours ago"
}
```
