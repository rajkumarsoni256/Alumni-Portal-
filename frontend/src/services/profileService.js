/**
 * Profile Service Layer
 * 
 * Provides an abstraction for retrieving and editing student and alumni profiles.
 * Handles Basic Info, About, Experience, Education, Skills, Projects, and Achievements.
 * 
 * Ready for future backend REST API integration (e.g. GET /api/users/:id, PUT /api/users/:id).
 */

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
      },
      {
        id: "proj_st_2",
        title: "Autonomous Drone Pathfinding with Deep RL",
        description: "Trained Deep Q-Network (DQN) and PPO agents for obstacle avoidance in simulated campus environments using PyTorch and AirSim.",
        tech: ["Python", "PyTorch", "OpenCV", "Gymnasium"],
        link: "https://github.com/tokir07",
        github: "https://github.com/tokir07",
      },
      {
        id: "proj_st_3",
        title: "Campus Placement Analytics Engine",
        description: "Predictive ML pipeline analyzing past campus recruitment datasets to benchmark student placement readiness and core competencies.",
        tech: ["Python", "Scikit-Learn", "FastAPI", "Pandas"],
        link: "https://github.com/tokir07",
        github: "https://github.com/tokir07",
      }
    ],
    achievements: [
      {
        id: "ach_st_1",
        title: "Winner — Smart India Hackathon (College Level)",
        description: "Secured 1st place among 60+ teams for developing an automated campus grievance resolution platform.",
        year: "2025"
      },
      {
        id: "ach_st_2",
        title: "Dean's Academic Excellence Scholarship",
        description: "Awarded top 2% academic merit scholarship for consecutive semesters in B.Tech CSE.",
        year: "2024"
      }
    ]
  },
  alm_1: {
    ...MOCK_USERS.alm_1,
    about: "Passionate about Machine Learning, Generative AI applications, and distributed systems. At Google, I build foundation model training pipelines and optimize large-scale inference systems. Proud JECRC Alumnus (Class of 2018). Love guiding students on technical interview prep, research papers, and placement readiness.",
    experience: [
      {
        id: "exp_alm1_1",
        role: "Senior AI Engineer",
        company: "Google",
        period: "2022 – Present",
        location: "Bengaluru, India",
        description: "Leading foundation model optimization & real-time inference teams for multimodal reasoning pipelines.",
      },
      {
        id: "exp_alm1_2",
        role: "Machine Learning Engineer",
        company: "Adobe",
        period: "2020 – 2022",
        location: "Bengaluru, India",
        description: "Developed computer vision tools and distributed feature stores used across Adobe Sensei platform.",
      },
      {
        id: "exp_alm1_3",
        role: "Associate Software Engineer",
        company: "Microsoft",
        period: "2018 – 2020",
        location: "Hyderabad, India",
        description: "Worked on Azure AI developer SDKs and REST APIs with 99.99% service availability.",
      }
    ],
    education: [
      {
        id: "edu_alm1_1",
        institution: "JECRC University",
        degree: "Bachelor of Technology (B.Tech)",
        fieldOfStudy: "Computer Science & Engineering",
        startYear: "2014",
        endYear: "2018",
      },
      {
        id: "edu_alm1_2",
        institution: "Stanford Online",
        degree: "Professional Certificate",
        fieldOfStudy: "Deep Learning & Distributed Systems",
        startYear: "2019",
        endYear: "2019",
      }
    ],
    projects: [
      {
        id: "proj_alm1_1",
        title: "Open Source Foundation Model Benchmark",
        description: "Open-source latency and reasoning evaluation suite for multi-modal LLMs on commodity GPU clusters.",
        tech: ["PyTorch", "CUDA", "Python", "Triton"],
        link: "https://github.com/google",
        github: "https://github.com/google",
      }
    ],
    achievements: [
      {
        id: "ach_alm1_1",
        title: "Google Technical Excellence Award",
        description: "Recognized for optimizing large model inference throughput by 42%.",
        year: "2023"
      },
      {
        id: "ach_alm1_2",
        title: "Distinguished Alumni Award — JECRC University",
        description: "Honored for outstanding contributions to engineering and alumni mentorship.",
        year: "2025"
      }
    ]
  }
};

export const profileService = {
  /**
   * Fetch full profile by user ID
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  getProfileById: async (userId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // If profile exists in detailed memory, return it
        if (memoryProfiles[userId]) {
          return resolve({ ...memoryProfiles[userId] });
        }

        // Fallback: build a default structured profile from MOCK_USERS
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
                },
                {
                  id: `exp_${userId}_2`,
                  role: "Software Engineering Intern",
                  company: "Tech Solutions",
                  period: "2019 – 2020",
                  location: "Bengaluru, India",
                  description: "Built scalable backend services and automated deployment pipelines.",
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

  /**
   * Experience CRUD
   */
  addExperience: async (userId, expData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = memoryProfiles[userId];
        if (!profile) return resolve(null);

        const newExp = {
          id: `exp_${Date.now()}`,
          ...expData,
        };
        profile.experience = [newExp, ...(profile.experience || [])];
        resolve(newExp);
      }, 50);
    });
  },

  updateExperience: async (userId, expId, expData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = memoryProfiles[userId];
        if (!profile) return resolve(null);

        profile.experience = (profile.experience || []).map((e) =>
          e.id === expId ? { ...e, ...expData } : e
        );
        resolve(true);
      }, 50);
    });
  },

  deleteExperience: async (userId, expId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = memoryProfiles[userId];
        if (!profile) return resolve(false);

        profile.experience = (profile.experience || []).filter((e) => e.id !== expId);
        resolve(true);
      }, 50);
    });
  },

  /**
   * Education CRUD
   */
  addEducation: async (userId, eduData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = memoryProfiles[userId];
        if (!profile) return resolve(null);

        const newEdu = {
          id: `edu_${Date.now()}`,
          ...eduData,
        };
        profile.education = [newEdu, ...(profile.education || [])];
        resolve(newEdu);
      }, 50);
    });
  },

  updateEducation: async (userId, eduId, eduData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = memoryProfiles[userId];
        if (!profile) return resolve(null);

        profile.education = (profile.education || []).map((e) =>
          e.id === eduId ? { ...e, ...eduData } : e
        );
        resolve(true);
      }, 50);
    });
  },

  deleteEducation: async (userId, eduId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = memoryProfiles[userId];
        if (!profile) return resolve(false);

        profile.education = (profile.education || []).filter((e) => e.id !== eduId);
        resolve(true);
      }, 50);
    });
  },

  /**
   * Projects CRUD
   */
  addProject: async (userId, projData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = memoryProfiles[userId];
        if (!profile) return resolve(null);

        const newProj = {
          id: `proj_${Date.now()}`,
          ...projData,
        };
        profile.projects = [newProj, ...(profile.projects || [])];
        resolve(newProj);
      }, 50);
    });
  },

  updateProject: async (userId, projId, projData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = memoryProfiles[userId];
        if (!profile) return resolve(null);

        profile.projects = (profile.projects || []).map((p) =>
          p.id === projId ? { ...p, ...projData } : p
        );
        resolve(true);
      }, 50);
    });
  },

  deleteProject: async (userId, projId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = memoryProfiles[userId];
        if (!profile) return resolve(false);

        profile.projects = (profile.projects || []).filter((p) => p.id !== projId);
        resolve(true);
      }, 50);
    });
  },

  /**
   * Skills Management
   */
  addSkill: async (userId, skill) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = memoryProfiles[userId];
        if (!profile) return resolve(false);

        const cleanSkill = skill.trim();
        if (!profile.skills) profile.skills = [];
        if (!profile.skills.includes(cleanSkill)) {
          profile.skills.push(cleanSkill);
        }
        resolve(profile.skills);
      }, 50);
    });
  },

  removeSkill: async (userId, skillToRemove) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = memoryProfiles[userId];
        if (!profile || !profile.skills) return resolve(false);

        profile.skills = profile.skills.filter((s) => s !== skillToRemove);
        resolve(profile.skills);
      }, 50);
    });
  },
};
