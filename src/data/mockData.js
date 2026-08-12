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
  name: "Raj Kumar",
  role: "Computer Science Student",
  degree: "B.Tech Computer Science & Engineering",
  graduationYear: 2026,
  university: "JECRC University, Jaipur",
  avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300",
  email: "raj.kumar@jecrcu.edu.in",
  completionPercentage: 82,
  interests: ["AI & Machine Learning", "Web Development", "Cloud Computing"],
  targetCompanies: ["Google", "Microsoft", "Uber", "Stripe"],
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
