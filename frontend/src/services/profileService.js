/**
 * Profile Service Layer
 * 
 * Provides an abstraction for retrieving and editing student and alumni profiles.
 * Communicates with backend REST API under /api/v1/profiles.
 */

import { apiClient } from './apiClient';
import { MOCK_USERS, MOCK_STUDENT } from '../data/mockData';

// In-memory profile storage initialized with mock data
const memoryProfiles = {
  st_101: {
    ...MOCK_STUDENT,
    ...MOCK_USERS.st_101,
    about: "Pre-final year Computer Science student at JECRC University specializing in AI & Machine Learning. Passionate about building distributed systems, foundation model fine-tuning, and scalable web applications. Actively looking for SDE and AI internships for Summer 2026.",
    experience: [
      {
        id: "exp_st_1",
        role: "Full Stack Developer Intern",
        company: "JECRC Incubation & Innovation Cell",
        period: "May 2025 – July 2025",
        location: "Jaipur, India",
        description: "Built the campus startup showcase portal using React, Tailwind CSS, and Node.js. Optimized database query latencies by 35%.",
      },
      {
        id: "exp_st_2",
        role: "Open Source Contributor & Club Lead",
        company: "JECRC Developer Student Club",
        period: "Aug 2024 – Present",
        location: "Jaipur, India",
        description: "Organized 8+ technical hackathons and workshops on PyTorch, Git, and Web Development for 450+ engineering students.",
      }
    ],
    education: [
      {
        id: "edu_st_1",
        institution: "JECRC University",
        degree: "Bachelor of Technology (B.Tech)",
        fieldOfStudy: "Computer Science & Engineering (AI & Machine Learning)",
        startYear: "2022",
        endYear: "2026",
      }
    ],
    projects: [
      {
        id: "proj_st_1",
        title: "JECRC Community Portal",
        description: "A professional networking and mentorship platform connecting 34,000+ JECRC students and alumni with rich community feed and discovery.",
        tech: ["React.js", "Tailwind CSS", "Vite", "Node.js"],
        link: "https://github.com/tokir07/Alumni-Portal",
        github: "https://github.com/tokir07/Alumni-Portal",
      }
    ],
    achievements: [
      {
        id: "ach_st_1",
        title: "Winner — Smart India Hackathon (College Level)",
        description: "Secured 1st place among 60+ teams for developing an automated campus grievance resolution platform.",
        year: "2025"
      }
    ]
  }
};

export const profileService = {
  /**
   * Submit onboarding data to backend
   */
  completeOnboarding: async (data) => {
    try {
      return await apiClient.post('/api/v1/profiles/onboarding', data);
    } catch (err) {
      console.warn('Backend onboarding endpoint failed, falling back to local storage:', err);
      return data;
    }
  },

  /**
   * Fetch current user profile
   */
  getCurrentProfile: async () => {
    try {
      return await apiClient.get('/api/v1/profiles/me');
    } catch (err) {
      return null;
    }
  },

  /**
   * Update profile
   */
  updateProfile: async (data) => {
    try {
      return await apiClient.put('/api/v1/profiles/me', data);
    } catch (err) {
      return data;
    }
  },

  /**
   * Fetch full profile by user ID
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  getProfileById: async (userId) => {
    try {
      const profile = await apiClient.get(`/api/v1/profiles/${userId}`);
      if (profile) return profile;
    } catch (err) {
      // Fallback
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        if (memoryProfiles[userId]) {
          return resolve({ ...memoryProfiles[userId] });
        }

        const baseUser = MOCK_USERS[userId] || Object.values(MOCK_USERS).find((u) => u.id === userId);
        if (!baseUser) return resolve(null);

        const isAlumni = baseUser.isAlumni || baseUser.role?.toLowerCase() === 'alumni';

        const synthesized = {
          ...baseUser,
          about: isAlumni
            ? `${baseUser.headline || 'JECRC Alumnus'}. Passionate about engineering excellence, mentoring juniors, and sharing industry best practices across the JECRC community.`
            : `Student at JECRC University passionate about technology, continuous learning, and building innovative software projects.`,
          experience: isAlumni
            ? [
                {
                  id: `exp_${userId}_1`,
                  role: baseUser.currentRole || baseUser.role || "Software Engineer",
                  company: baseUser.company || "Technology Partner",
                  period: "2021 – Present",
                  location: baseUser.location || "India",
                  description: `Working as ${baseUser.currentRole || 'Engineer'} leading core engineering initiatives.`,
                }
              ]
            : [
                {
                  id: `exp_${userId}_1`,
                  role: "Student Technical Member",
                  company: "JECRC University",
                  period: "2024 – Present",
                  location: "Jaipur, India",
                  description: "Participating in departmental development projects and technical hackathons.",
                }
              ],
          education: [
            {
              id: `edu_${userId}_1`,
              institution: "JECRC University",
              degree: "Bachelor of Technology (B.Tech)",
              fieldOfStudy: baseUser.branch ? `${baseUser.branch} Engineering` : "Computer Science & Engineering",
              startYear: isAlumni ? String((baseUser.batch || 2020) - 4) : "2022",
              endYear: String(baseUser.batch || 2026),
            }
          ],
          projects: [
            {
              id: `proj_${userId}_1`,
              title: isAlumni ? `${baseUser.company || 'Enterprise'} Cloud Solution` : "Smart Campus Web Portal",
              description: "Engineered scalable responsive solution with clean microservices and modern frontend architecture.",
              tech: baseUser.skills ? baseUser.skills.slice(0, 4) : ["React", "Python", "SQL"],
              link: "https://github.com",
              github: "https://github.com",
            }
          ],
          achievements: [
            {
              id: `ach_${userId}_1`,
              title: "JECRC Academic & Technical Merit",
              description: "Recognized for consistent academic performance and technical project contributions.",
              year: String(baseUser.batch || 2024),
            }
          ]
        };

        memoryProfiles[userId] = synthesized;
        resolve({ ...synthesized });
      }, 50);
    });
  },

  /**
   * Update basic profile info
   */
  updateBasicInfo: async (userId, data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!memoryProfiles[userId]) {
          memoryProfiles[userId] = { ...data, id: userId };
        } else {
          memoryProfiles[userId] = {
            ...memoryProfiles[userId],
            ...data,
          };
        }
        resolve(memoryProfiles[userId]);
      }, 50);
    });
  },

  /**
   * Update about summary
   */
  updateAbout: async (userId, aboutText) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (memoryProfiles[userId]) {
          memoryProfiles[userId].about = aboutText;
        }
        resolve(aboutText);
      }, 50);
    });
  },
};
