export const CAREER_DOMAINS = [
  "AI & Machine Learning",
  "Web Development",
  "Data Science",
  "Cyber Security",
  "Cloud Computing",
  "UI/UX Design",
  "Graphic Design",
  "Digital Marketing",
  "Finance",
  "Entrepreneurship",
  "Product Management",
];

export const INDUSTRIES = [
  "Technology & Software",
  "Financial Services & Banking",
  "Consulting",
  "Healthcare & Biotech",
  "E-Commerce & Retail",
  "Automotive & EV",
  "Venture Capital & Startups",
];

export const MOCK_STUDENT = {
  id: "st_101",
  name: "Tokir Khan",
  role: "Student",
  degree: "B.Tech Computer Science & Engineering",
  specialization: "AI & Machine Learning",
  year: "3rd Year",
  headline: "B.Tech CSE (AI-ML) | 3rd Year • Seeking SDE / AI Internships",
  graduationYear: 2026,
  batch: "JECRC CSE • 2026",
  university: "JECRC University, Jaipur",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
  email: "tokir.khan@jecrcu.edu.in",
  completionPercentage: 88,
  connectionsCount: 48,
  profileViewsCount: 184,
  interests: ["AI & Machine Learning", "Full Stack Web", "Distributed Systems"],
  targetCompanies: ["Google", "Microsoft", "Stripe", "Amazon"],
  careerGoal: "Software Engineer / AI Product Specialist",
  savedAlumniIds: ["alm_1", "alm_3"],
};

export const MOCK_ALUMNI = [
  {
    id: "alm_1",
    name: "Priya Sharma",
    currentRole: "Senior AI Engineer",
    company: "Google",
    graduationYear: 2018,
    degree: "B.Tech Computer Science",
    location: "Bengaluru, India (Remote Available)",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
    coverBg: "from-red-600 via-rose-700 to-red-900",
    domain: "AI & Machine Learning",
    industry: "Technology & Software",
    experienceYears: 6,
    isAvailableForMentorship: true,
    rating: 4.9,
    reviewsCount: 34,
    matchPercentage: 98,
    matchReasons: [
      "Expert in PyTorch, LLMs, and System Design",
      "JU Alumnus from your CS Department (Class of '18)",
      "Helped 14+ JECRC students crack Tier-1 Tech placement offers"
    ],
    about: "Passionate about Machine Learning, Generative AI applications, and distributed systems. At Google, I build foundation model training pipelines. I love guiding JECRC students on technical interview prep, research paper publishing, and campus placement prep.",
    skills: ["Python", "PyTorch", "TensorFlow", "System Design", "LLMs", "Deep Learning", "Algorithms"],
    areasOfHelp: [
      "Career Guidance",
      "Resume Review",
      "Mock Interview",
      "Project Guidance",
      "Placement Guidance"
    ],
    careerJourney: [
      { year: "2022 - Present", role: "Senior AI Engineer", company: "Google", description: "Leading foundation model optimization & real-time inference teams." },
      { year: "2020 - 2022", role: "Machine Learning Engineer", company: "Adobe", description: "Developed computer vision tools used by millions of Sensei users." },
      { year: "2018 - 2020", role: "Associate Software Engineer", company: "Microsoft", description: "Worked on Azure AI services and developer SDKs." },
      { year: "2014 - 2018", role: "B.Tech CS Student", company: "JECRC University", description: "Graduated with Gold Medal, Lead of JU Robotics & AI Club." }
    ],
    education: [
      { degree: "B.Tech in Computer Science & Engineering", institution: "JECRC University, Jaipur", year: "2014 - 2018" },
      { degree: "Specialization in Deep Learning", institution: "Stanford Online", year: "2019" }
    ],
    achievements: [
      "Published 3 IEEE Research papers on Vision Transformers",
      "Google Excellence Award 2023",
      "Distinguished Alumni Award 2025 - JECRC University"
    ]
  },
  {
    id: "alm_2",
    name: "Arjun Verma",
    currentRole: "Staff Frontend Architect",
    company: "Stripe",
    graduationYear: 2017,
    degree: "B.Tech Information Technology",
    location: "San Francisco, CA (Hybrid)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    coverBg: "from-red-700 via-rose-800 to-slate-900",
    domain: "Web Development",
    industry: "Technology & Software",
    experienceYears: 7,
    isAvailableForMentorship: true,
    rating: 4.95,
    reviewsCount: 42,
    matchPercentage: 94,
    matchReasons: [
      "Mastery in React, TypeScript, Next.js, and Web Performance",
      "Spearheads front-end infrastructure for international payments",
      "JU Alumni & active open-source contributor"
    ],
    about: "I build high-scale, accessible web infrastructure. Prior to Stripe, I led web performance at Flipkart. I enjoy mentoring JECRC students who are passionate about React, full-stack JavaScript, design systems, and frontend architecture.",
    skills: ["React", "TypeScript", "Next.js", "GraphQL", "Tailwind CSS", "Web Performance", "Node.js"],
    areasOfHelp: [
      "Career Guidance",
      "Resume Review",
      "Mock Interview",
      "Project Guidance"
    ],
    careerJourney: [
      { year: "2021 - Present", role: "Staff Frontend Architect", company: "Stripe", description: "Building next-gen global payment element interfaces." },
      { year: "2018 - 2021", role: "Senior Frontend Engineer", company: "Flipkart", description: "Optimized mobile web checkout funnel for 50M+ users." },
      { year: "2017 - 2018", role: "UI Engineer", company: "Zomato", description: "Built initial design system components in React." }
    ],
    education: [
      { degree: "B.Tech in Information Technology", institution: "JECRC University, Jaipur", year: "2013 - 2017" }
    ],
    achievements: [
      "Creator of open-source UI component library (12k+ GitHub Stars)",
      "Tech Speaker at React Summit Europe 2024"
    ]
  },
  {
    id: "alm_3",
    name: "Sneha Reddy",
    currentRole: "Lead Data Scientist",
    company: "Amazon Web Services",
    graduationYear: 2019,
    degree: "B.Tech Data Engineering",
    location: "Hyderabad, India",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300",
    coverBg: "from-rose-600 via-red-700 to-rose-950",
    domain: "Data Science",
    industry: "Technology & Software",
    experienceYears: 5,
    isAvailableForMentorship: true,
    rating: 4.88,
    reviewsCount: 28,
    matchPercentage: 91,
    matchReasons: [
      "Expert in Big Data Analytics, SQL, Python & Predictive Modeling",
      "Mentors JECRC students on data science portfolios & Kaggle competitions",
      "Offers step-by-step guidance for AWS certifications"
    ],
    about: "Data Scientist passionate about extracting actionable insights from petabytes of data. At AWS, I build predictive analytics tools for enterprise cloud operations.",
    skills: ["Python", "SQL", "Spark", "Pandas", "Scikit-Learn", "AWS Redshift", "Data Visualization"],
    areasOfHelp: [
      "Career Guidance",
      "Resume Review",
      "Placement Guidance",
      "Project Guidance"
    ],
    careerJourney: [
      { year: "2022 - Present", role: "Lead Data Scientist", company: "Amazon Web Services", description: "Building cloud customer churn prediction models." },
      { year: "2019 - 2022", role: "Data Scientist", company: "Deloitte Digital", description: "Delivered analytics consulting for Fortune 500 clients." }
    ],
    education: [
      { degree: "B.Tech in Data Engineering", institution: "JECRC University, Jaipur", year: "2015 - 2019" }
    ],
    achievements: [
      "AWS Certified Machine Learning Specialty 2023",
      "Kaggle Grandmaster Rank #42"
    ]
  },
  {
    id: "alm_4",
    name: "Vikramaditya Rao",
    currentRole: "Principal Product Manager",
    company: "Microsoft",
    graduationYear: 2015,
    degree: "B.Tech Electronics & Communication",
    location: "Seattle, WA",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
    coverBg: "from-red-800 via-red-900 to-slate-950",
    domain: "Product Management",
    industry: "Technology & Software",
    experienceYears: 9,
    isAvailableForMentorship: true,
    rating: 4.98,
    reviewsCount: 50,
    matchPercentage: 88,
    matchReasons: [
      "Transitioned from JU Engineering to Executive Product Leadership",
      "Expert in PM case interviews, product sense & strategy",
      "Founded JU Entrepreneurship & Innovation Cell"
    ],
    about: "Principal Product Manager leading Microsoft Teams AI integrations. I love helping JECRC engineers transition into Product Management and founder roles.",
    skills: ["Product Strategy", "User Research", "Agile Roadmap", "Metrics & KPIs", "A/B Testing", "PM Interviewing"],
    areasOfHelp: [
      "Career Guidance",
      "Mock Interview",
      "Resume Review",
      "Guest Sessions"
    ],
    careerJourney: [
      { year: "2020 - Present", role: "Principal PM", company: "Microsoft", description: "Scaling Teams Copilot ecosystem." },
      { year: "2017 - 2020", role: "Senior PM", company: "Uber", description: "Rider growth and loyalty rewards algorithms." },
      { year: "2015 - 2017", role: "Software Engineer", company: "Oracle", description: "Database cloud management tools." }
    ],
    education: [
      { degree: "MBA in Strategy & Innovation", institution: "INSEAD", year: "2019" },
      { degree: "B.Tech in ECE", institution: "JECRC University, Jaipur", year: "2011 - 2015" }
    ],
    achievements: [
      "Launched product feature used by over 250 million daily active users",
      "Keynote Speaker at ProductCon 2024"
    ]
  },
  {
    id: "alm_5",
    name: "Ananya Iyer",
    currentRole: "Lead UX Architect",
    company: "Adobe",
    graduationYear: 2020,
    degree: "B.Des Industrial Design",
    location: "Bengaluru, India",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
    coverBg: "from-rose-500 via-red-600 to-red-900",
    domain: "UI/UX Design",
    industry: "Technology & Software",
    experienceYears: 4,
    isAvailableForMentorship: true,
    rating: 4.92,
    reviewsCount: 22,
    matchPercentage: 86,
    matchReasons: [
      "Specialist in Figma, Design Systems, and User Research",
      "Portfolio reviewer for JECRC design school graduates",
      "Mentors on wireframing and interactive prototyping"
    ],
    about: "Designing intuitive, delightful digital tools for creators. At Adobe Creative Cloud team, I craft seamless multi-platform experiences.",
    skills: ["Figma", "Design Systems", "User Research", "Prototyping", "Design Thinking", "Interaction Design"],
    areasOfHelp: [
      "Resume Review",
      "Project Guidance",
      "Career Guidance",
      "Mock Interview"
    ],
    careerJourney: [
      { year: "2022 - Present", role: "Lead UX Architect", company: "Adobe", description: "Leading mobile UI design systems." },
      { year: "2020 - 2022", role: "UX Designer", company: "Swiggy", description: "Designed merchant partner order management app." }
    ],
    education: [
      { degree: "B.Des in Design", institution: "JECRC University, Jaipur", year: "2016 - 2020" }
    ],
    achievements: [
      "Red Dot Design Award Winner 2023",
      "Figma Community Advocate"
    ]
  },
  {
    id: "alm_6",
    name: "Rohan Kapoor",
    currentRole: "Cybersecurity Director",
    company: "PwC Cybersecurity",
    graduationYear: 2016,
    degree: "B.Tech Computer Science",
    location: "Mumbai, India",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300",
    coverBg: "from-slate-900 via-red-950 to-slate-900",
    domain: "Cyber Security",
    industry: "Consulting",
    experienceYears: 8,
    isAvailableForMentorship: false,
    rating: 4.85,
    reviewsCount: 19,
    matchPercentage: 82,
    matchReasons: [
      "CEH, CISSP certified security architect",
      "Expert in penetration testing & ethical hacking"
    ],
    about: "Protecting enterprise financial infrastructure from cyber threats. Passionate about cloud security and zero-trust architecture.",
    skills: ["Penetration Testing", "Ethical Hacking", "Cloud Security", "CISSP", "Network Security"],
    areasOfHelp: ["Career Guidance", "Guest Sessions"],
    careerJourney: [
      { year: "2021 - Present", role: "Director", company: "PwC", description: "Leading cloud threat response team." }
    ],
    education: [
      { degree: "B.Tech CS", institution: "JECRC University, Jaipur", year: "2012 - 2016" }
    ],
    achievements: ["Hall of Fame Bug Bounty Reporter at Meta & Twitter"]
  }
];

export const MOCK_REQUESTS = [
  {
    id: "req_101",
    studentId: "st_101",
    studentName: "Raj Kumar",
    studentAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300",
    studentDegree: "B.Tech CS (3rd Year, JU)",
    alumniId: "alm_1",
    alumniName: "Priya Sharma",
    alumniRole: "Senior AI Engineer @ Google",
    alumniAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
    category: "Mock Interview & Resume Review",
    helpTopics: ["Resume Review", "Mock Interview"],
    reason: "Preparing for Google & Microsoft summer AI intern interviews. Seeking advice on system design and portfolio project presentation.",
    goals: "Targeting top-tier tech placements and wanting feedback on my Deep Learning project.",
    meetingType: "Online (Google Meet)",
    requestedDate: "2026-08-10",
    status: "Accepted",
    scheduledTime: "Saturday, 4:00 PM IST",
    meetingLink: "https://meet.google.com/abc-xyz-ju-alum"
  },
  {
    id: "req_102",
    studentId: "st_102",
    studentName: "Meera Nair",
    studentAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300",
    studentDegree: "B.Tech IT (4th Year, JU)",
    alumniId: "alm_1",
    alumniName: "Priya Sharma",
    alumniRole: "Senior AI Engineer @ Google",
    alumniAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
    category: "Career Guidance",
    helpTopics: ["Career Guidance", "Placement Guidance"],
    reason: "Looking for clarity on transitioning from web development to Applied Machine Learning research.",
    goals: "Publishing a paper and getting into top MS / Industry AI roles.",
    meetingType: "Online (Google Meet)",
    requestedDate: "2026-08-11",
    status: "Pending",
    scheduledTime: null,
    meetingLink: null
  },
  {
    id: "req_103",
    studentId: "st_103",
    studentName: "Aditya Roy",
    studentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    studentDegree: "B.Tech ECE (4th Year, JU)",
    alumniId: "alm_2",
    alumniName: "Arjun Verma",
    alumniRole: "Staff Frontend Architect @ Stripe",
    alumniAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    category: "Project Guidance",
    helpTopics: ["Project Guidance", "Resume Review"],
    reason: "Built a React design system and looking for architectural critique from an expert.",
    goals: "Refining portfolio code quality for full-stack engineer applications.",
    meetingType: "Online (Google Meet)",
    requestedDate: "2026-07-25",
    status: "Completed",
    scheduledTime: "July 28, 2026",
    meetingLink: null
  }
];

export const MOCK_EVENTS = [
  {
    id: "evt_1",
    title: "Cracking Tier-1 AI & Tech Placements 2026",
    category: "Career Talks",
    date: "Aug 18, 2026",
    time: "6:00 PM - 7:30 PM IST",
    speaker: "Priya Sharma (Senior AI Engineer @ Google)",
    speakerRole: "JU Alumni Class of 2018",
    speakerAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
    location: "JECRC Auditorium & Youtube Live",
    registeredCount: 342,
    seatsLeft: 58,
    isRegistered: true,
    description: "Learn actionable strategies on DSA problem solving, system design fundamentals, resume filtering, and standing out in JU campus placement interviews.",
    coverBg: "from-red-600 to-rose-800"
  },
  {
    id: "evt_2",
    title: "Modern Fullstack Web Architecture with Next.js",
    category: "Workshops",
    date: "Aug 22, 2026",
    time: "4:00 PM - 6:00 PM IST",
    speaker: "Arjun Verma (Staff Architect @ Stripe)",
    speakerRole: "JU Alumni Class of 2017",
    speakerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    location: "JU Computer Lab 3 & Google Meet",
    registeredCount: 180,
    seatsLeft: 20,
    isRegistered: false,
    description: "Hands-on code session building a high-performance e-commerce payment flow with React 19, TypeScript, and micro-frontends.",
    coverBg: "from-rose-700 to-red-900"
  },
  {
    id: "evt_3",
    title: "JU Global Alumni & Student Annual Meet",
    category: "Networking",
    date: "Sep 05, 2026",
    time: "5:00 PM - 9:00 PM IST",
    speaker: "JECRC Leadership & Alumni Board",
    speakerRole: "JECRC University Campus, Jaipur",
    speakerAvatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=300",
    location: "Grand Convention Center, JU Campus",
    registeredCount: 520,
    seatsLeft: 80,
    isRegistered: true,
    description: "Connect face-to-face with 100+ distinguished JU alumni across tech, finance, consulting, and research over dinner & speed networking.",
    coverBg: "from-red-800 to-slate-950"
  },
  {
    id: "evt_4",
    title: "Transitioning to Product Management: Roadmaps for Engineers",
    category: "Webinars",
    date: "Sep 12, 2026",
    time: "7:00 PM - 8:30 PM IST",
    speaker: "Vikramaditya Rao (Principal PM @ Microsoft)",
    speakerRole: "JU Alumni Class of 2015",
    speakerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
    location: "Zoom Live Stream",
    registeredCount: 290,
    seatsLeft: 110,
    isRegistered: false,
    description: "Insights on product sense, wireframing, metrics evaluation, and cracking PM APM programs as an undergrad.",
    coverBg: "from-rose-600 to-red-800"
  }
];

export const MOCK_ADMIN_STATS = {
  totalStudents: 4250,
  totalAlumni: 1890,
  activeMentors: 432,
  mentorshipConnections: 1240,
  upcomingEvents: 8,
  pendingVerificationsCount: 14,
  alumniByIndustry: [
    { label: "Tech & Software", value: 45, color: "#dc2626" },
    { label: "Financial Services", value: 20, color: "#991b1b" },
    { label: "Consulting", value: 15, color: "#f43f5e" },
    { label: "Healthcare & Biotech", value: 10, color: "#fb7185" },
    { label: "Others", value: 10, color: "#64748b" }
  ],
  alumniByLocation: [
    { label: "Bengaluru", value: 38 },
    { label: "San Francisco / US", value: 24 },
    { label: "Jaipur / NCR", value: 18 },
    { label: "Hyderabad", value: 12 },
    { label: "London / EU", value: 8 }
  ],
  studentInterests: [
    { label: "AI & Machine Learning", percentage: 34 },
    { label: "Web Development", percentage: 28 },
    { label: "Data Science", percentage: 16 },
    { label: "Product Management", percentage: 12 },
    { label: "Cyber Security", percentage: 10 }
  ],
  recentActivity: [
    { time: "10 mins ago", text: "Raj Kumar requested mentorship from Priya Sharma (Senior AI Engineer @ Google)" },
    { time: "45 mins ago", text: "Priya Sharma accepted mentorship request from Meera Nair" },
    { time: "2 hours ago", text: "New Alumni Verification: Dr. Sameer Khan (Class of 2012, VP @ Goldman Sachs)" },
    { time: "4 hours ago", text: "34 JU students registered for 'Cracking Tier-1 AI & Tech Placements' event" }
  ],
  pendingVerifications: [
    { id: "v_1", name: "Karan Malhotra", degree: "B.Tech CS 2019", company: "Uber", role: "Staff Engineer", status: "Pending Verification" },
    { id: "v_2", name: "Dr. Sameer Khan", degree: "Ph.D. Finance 2012", company: "Goldman Sachs", role: "VP Quantitative Research", status: "Pending Verification" },
    { id: "v_3", name: "Tanya Sen", degree: "B.Des 2021", company: "Razorpay", role: "Product Designer", status: "Pending Verification" }
  ]
};

// Unified Users Lookup Dictionary
export const MOCK_USERS = {
  st_101: {
    id: "st_101",
    name: "Tokir Khan",
    role: "Student",
    headline: "B.Tech CSE (AI-ML) | 3rd Year • Seeking SDE Internships",
    batch: "JECRC CSE • 2026",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
    verified: false,
    isAlumni: false,
    company: "JECRC University",
    connectionsCount: 48,
    profileViewsCount: 184,
  },
  alm_1: {
    id: "alm_1",
    name: "Priya Sharma",
    role: "Senior AI Engineer",
    headline: "Senior AI Engineer @ Google | LLMs & Distributed Systems",
    batch: "JECRC CSE • 2018",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
    verified: true,
    isAlumni: true,
    company: "Google",
    connectionsCount: 1420,
    profileViewsCount: 890,
  },
  alm_2: {
    id: "alm_2",
    name: "Arjun Verma",
    role: "Staff Frontend Architect",
    headline: "Staff Frontend Architect @ Stripe | Web Performance & React Core",
    batch: "JECRC IT • 2017",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    verified: true,
    isAlumni: true,
    company: "Stripe",
    connectionsCount: 980,
    profileViewsCount: 650,
  },
  alm_3: {
    id: "alm_3",
    name: "Sneha Reddy",
    role: "Lead Data Scientist",
    headline: "Lead Data Scientist @ AWS | Big Data & Predictive AI",
    batch: "JECRC Data Eng • 2019",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300",
    verified: true,
    isAlumni: true,
    company: "Amazon Web Services",
    connectionsCount: 760,
    profileViewsCount: 520,
  },
  alm_4: {
    id: "alm_4",
    name: "Vikramaditya Rao",
    role: "Principal Product Manager",
    headline: "Principal PM @ Microsoft | Ex-Uber | AI Copilot Ecosystem",
    batch: "JECRC ECE • 2015",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
    verified: true,
    isAlumni: true,
    company: "Microsoft",
    connectionsCount: 2100,
    profileViewsCount: 1240,
  },
  alm_5: {
    id: "alm_5",
    name: "Ananya Iyer",
    role: "Lead UX Architect",
    headline: "Lead UX Architect @ Adobe | Design Systems & Micro-Interactions",
    batch: "JECRC Design • 2020",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
    verified: true,
    isAlumni: true,
    company: "Adobe",
    connectionsCount: 610,
    profileViewsCount: 430,
  },
  alm_6: {
    id: "alm_6",
    name: "Rohan Kapoor",
    role: "Cybersecurity Director",
    headline: "Cybersecurity Director @ PwC | Cloud Security & Zero-Trust",
    batch: "JECRC CSE • 2016",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300",
    verified: true,
    isAlumni: true,
    company: "PwC",
    connectionsCount: 890,
    profileViewsCount: 390,
  },
  alm_7: {
    id: "alm_7",
    name: "Aman Gupta",
    role: "Software Engineer",
    headline: "Software Engineer @ Amazon | High-Scale Distributed Systems",
    batch: "JECRC CSE • 2020",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    verified: true,
    isAlumni: true,
    company: "Amazon",
    connectionsCount: 540,
    profileViewsCount: 310,
  },
  st_102: {
    id: "st_102",
    name: "Meera Nair",
    role: "Student",
    headline: "B.Tech IT | 4th Year • Placed @ Cisco | Open Source Enthusiast",
    batch: "JECRC IT • 2025",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300",
    verified: false,
    isAlumni: false,
    company: "JECRC University",
    connectionsCount: 110,
    profileViewsCount: 220,
  },
};

// Initial Community Feed Posts
export const MOCK_COMMUNITY_POSTS = [
  {
    id: "post_1",
    authorId: "alm_1",
    createdAt: "2 hours ago",
    timestamp: Date.now() - 7200000,
    content: "Excited to share that our team at Google just open-sourced a major benchmark for foundation model reasoning! 🚀\n\nFor all JECRC juniors preparing for upcoming off-campus and on-campus SDE/AI internships: focus deeply on your fundamentals in data structures, concurrency, and building end-to-end projects rather than just tutorial-hopping.\n\nHappy to review resumes of 3rd and 4th-year JECRC students this weekend. Drop your questions below!",
    type: "ACHIEVEMENT",
    category: "alumni",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200",
    achievementData: {
      badge: "Google Milestone",
      title: "Foundation Model Benchmark Open-Sourced",
      subtext: "Authored by Google Deep Learning Team"
    },
    likes: 148,
    likedByCurrentUser: false,
    savedByCurrentUser: true,
    commentsCount: 24,
    sharesCount: 14,
    tags: ["#Google", "#AIandML", "#JECRCAlumni", "#Internships2026"],
    comments: [
      {
        id: "c_101",
        authorId: "st_101",
        createdAt: "1 hour ago",
        content: "Congratulations Priya ma'am! Truly inspiring for all of us in 3rd year. I'd love your feedback on my LLM latency optimization project when you have a moment.",
        likes: 12,
        likedByCurrentUser: false,
        replies: [
          {
            id: "r_101",
            authorId: "alm_1",
            createdAt: "45 mins ago",
            content: "Thank you Tokir! Send across the GitHub repo in messages or schedule via the Mentorship tab. Happy to review.",
            likes: 5,
            likedByCurrentUser: false,
          }
        ]
      },
      {
        id: "c_102",
        authorId: "st_102",
        createdAt: "30 mins ago",
        content: "Amazing achievement! What are the top 3 core topics you recommend for freshers targeting Google ML roles?",
        likes: 8,
        likedByCurrentUser: false,
        replies: []
      }
    ]
  },
  {
    id: "post_2",
    authorId: "alm_2",
    createdAt: "4 hours ago",
    timestamp: Date.now() - 14400000,
    content: "🚨 We are actively hiring 2 Backend Engineering Interns and 1 Frontend Intern for our Stripe Bangalore hub!\n\nEligibility: JECRC pre-final and final year students (Batch 2026 / 2027).\nStipend: ₹60,000/month + complete remote flexibility option.\nStack: TypeScript, Go, React, Distributed Systems.\n\nI will be personally referring standout candidates from our JECRC community. Check out the details below and feel free to reach out!",
    type: "JOB",
    category: "jobs",
    jobData: {
      title: "Software Engineer Intern (Frontend & Backend)",
      company: "Stripe",
      location: "Bengaluru, India (Hybrid / Remote Available)",
      type: "Internship",
      stipend: "₹60,000 / month",
      batch: "Class of 2026 & 2027",
      deadline: "Aug 30, 2026",
      applyLink: "https://stripe.com/jobs"
    },
    likes: 215,
    likedByCurrentUser: false,
    savedByCurrentUser: false,
    commentsCount: 46,
    sharesCount: 38,
    tags: ["#Hiring", "#Internships", "#Stripe", "#Placements2026"],
    comments: [
      {
        id: "c_201",
        authorId: "st_101",
        createdAt: "3 hours ago",
        content: "Thank you Arjun sir! Just submitted my resume. Stripe's engineering culture and developer tools are legendary.",
        likes: 9,
        likedByCurrentUser: false,
        replies: [
          {
            id: "r_201",
            authorId: "alm_2",
            createdAt: "2 hours ago",
            content: "Best of luck Tokir! Make sure your GitHub and deployment links are clearly highlighted.",
            likes: 4,
            likedByCurrentUser: false,
          }
        ]
      }
    ]
  },
  {
    id: "post_3",
    authorId: "st_101",
    createdAt: "6 hours ago",
    timestamp: Date.now() - 21600000,
    content: "Just shipped 'NeuroPulse' — an AI-powered code latency analyzer built during the JU Smart Hackathon! 💻⚡\n\nIntegrated AST parsing with local LLM summarization to detect asynchronous bottlenecks in React applications. Proud to share that our team won 1st Place in the Open Innovation Track!\n\nHuge thanks to Priya Sharma ma'am for mentoring us on model quantization. The open-source repo is live on GitHub! Would love feedback from fellow alumni and seniors.",
    type: "ACHIEVEMENT",
    category: "student",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200",
    achievementData: {
      badge: "Hackathon Winner",
      title: "1st Place - JU Smart Hackathon 2026",
      subtext: "Built NeuroPulse AI Performance Profiler"
    },
    likes: 89,
    likedByCurrentUser: true,
    savedByCurrentUser: false,
    commentsCount: 18,
    sharesCount: 9,
    tags: ["#StudentProject", "#React", "#OpenSource", "#AI", "#Hackathon"],
    comments: [
      {
        id: "c_301",
        authorId: "alm_1",
        createdAt: "5 hours ago",
        content: "Super proud of you and the team Tokir! The architecture looked very clean. Keep shipping!",
        likes: 14,
        likedByCurrentUser: false,
        replies: []
      },
      {
        id: "c_302",
        authorId: "alm_2",
        createdAt: "4 hours ago",
        content: "Very impressive AST analysis for a 3rd-year project. Stars on GitHub incoming!",
        likes: 11,
        likedByCurrentUser: false,
        replies: []
      }
    ]
  },
  {
    id: "post_4",
    authorId: "alm_3",
    createdAt: "1 day ago",
    timestamp: Date.now() - 86400000,
    content: "Hosting an exclusive virtual AMA & Roadmap session this Saturday: 'Breaking into Cloud AI & Data Engineering at Scale'. ☁️📊\n\nWe'll cover:\n1. What cloud engineering teams at Amazon look for in freshers\n2. Building real-time data pipelines with AWS Redshift & S3\n3. Live resume teardowns & mock interview tips\n\nFree for all JECRC students. RSVP directly from the Events tab!",
    type: "TEXT",
    category: "alumni",
    likes: 94,
    likedByCurrentUser: false,
    savedByCurrentUser: false,
    commentsCount: 11,
    sharesCount: 15,
    tags: ["#AWS", "#DataScience", "#CareerGuidance", "#JECRCEvents"],
    comments: [
      {
        id: "c_401",
        authorId: "st_102",
        createdAt: "20 hours ago",
        content: "Already registered! Looking forward to learning about distributed pipeline optimizations.",
        likes: 6,
        likedByCurrentUser: false,
        replies: []
      }
    ]
  },
  {
    id: "post_5",
    authorId: "alm_4",
    createdAt: "2 days ago",
    timestamp: Date.now() - 172800000,
    content: "One crucial piece of advice for engineering students aspiring for Product & Leadership roles:\n\nCode builds the product, but understanding the customer builds the business. Always ask 'Why does this problem exist?' before diving into 'How should we build it?'.\n\nKudos to the JECRC E-Cell for organizing a stellar design thinking workshop this week.",
    type: "TEXT",
    category: "alumni",
    likes: 132,
    likedByCurrentUser: false,
    savedByCurrentUser: false,
    commentsCount: 14,
    sharesCount: 7,
    tags: ["#ProductManagement", "#Leadership", "#CareerTips"],
    comments: []
  }
];

// Suggested Connections (People You May Know)
export const MOCK_SUGGESTED_PEOPLE = [
  {
    id: "alm_7",
    name: "Aman Gupta",
    role: "Software Engineer @ Amazon",
    batch: "JECRC CSE • 2020",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    mutualCount: 14,
    connectionStatus: "none", // 'none' | 'pending' | 'connected'
  },
  {
    id: "alm_5",
    name: "Ananya Iyer",
    role: "Lead UX Architect @ Adobe",
    batch: "JECRC Design • 2020",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
    mutualCount: 8,
    connectionStatus: "none",
  },
  {
    id: "alm_6",
    name: "Rohan Kapoor",
    role: "Cybersecurity Director @ PwC",
    batch: "JECRC CSE • 2016",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300",
    mutualCount: 19,
    connectionStatus: "none",
  },
  {
    id: "st_102",
    name: "Meera Nair",
    role: "B.Tech IT • 4th Year (Placed @ Cisco)",
    batch: "JECRC IT • 2025",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300",
    mutualCount: 26,
    connectionStatus: "connected",
  },
];

// Trending Hashtags in JECRC
export const MOCK_TRENDING_TAGS = [
  { tag: "#Placements2026", count: "340+ posts", category: "Career" },
  { tag: "#AlumniMeetJaipur", count: "185 posts", category: "Events" },
  { tag: "#GoogleInternships", count: "120 posts", category: "Opportunities" },
  { tag: "#AIandML", count: "98 posts", category: "Tech" },
  { tag: "#HackathonWinners", count: "64 posts", category: "Campus" },
];

// Notifications
export const MOCK_NOTIFICATIONS = [
  {
    id: "notif_1",
    type: "connection",
    actor: "Priya Sharma",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
    text: "accepted your mentorship request for Saturday.",
    time: "10 mins ago",
    unread: true,
    link: "/my-connections",
  },
  {
    id: "notif_2",
    type: "like",
    actor: "Arjun Verma",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    text: "and 14 others liked your post 'NeuroPulse AI Performance Profiler'.",
    time: "2 hours ago",
    unread: true,
    link: "/",
  },
  {
    id: "notif_3",
    type: "job",
    actor: "Stripe Alumni Referral",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    text: "New SDE Internship opening posted by Arjun Verma.",
    time: "4 hours ago",
    unread: false,
    link: "/",
  },
  {
    id: "notif_4",
    type: "event",
    actor: "JECRC Alumni Cell",
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=300",
    text: "Registration open for 'Modern Fullstack Web Architecture' workshop.",
    time: "1 day ago",
    unread: false,
    link: "/events",
  },
];
