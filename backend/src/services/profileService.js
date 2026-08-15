const crypto = require('crypto');
const db = require('../config/db');

const isBlank = (str) => !str || String(str).trim().length === 0;
const isNotBlank = (str) => !isBlank(str);

const formatSkillsInterests = (input) => {
  if (!input) return '';
  if (Array.isArray(input)) return input.join(', ');
  return String(input).trim();
};

const parseList = (str) => {
  if (!str || typeof str !== 'string' || str.trim() === '') return [];
  return str.split(/\s*,\s*/).filter(Boolean);
};

const formatProfileResponse = (row) => {
  if (!row) {
    return {
      profile: null,
      profileCompleted: false,
      isProfileComplete: false,
    };
  }

  const isComplete = !!row.is_profile_complete;
  const currentAcademicYear = row.current_year ? parseInt(row.current_year, 10) : null;
  const avatar = row.avatar_url || null;
  const banner = row.banner_url || null;

  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    role: row.role,
    fullName: row.full_name,
    phone: row.phone || null,
    avatarUrl: avatar,
    avatar: avatar,
    bannerUrl: banner,
    banner: banner,
    coverImage: banner,
    bio: row.bio || null,
    degree: row.degree || null,
    branch: row.branch || null,
    graduationYear: row.graduation_year || null,
    currentYear: currentAcademicYear,
    currentAcademicYear: currentAcademicYear,
    company: row.company || null,
    designation: row.designation || null,
    location: row.location || null,
    isAvailableForMentorship: row.is_available_for_mentorship !== false,
    linkedinUrl: row.linkedin_url || null,
    githubUrl: row.github_url || null,
    websiteUrl: row.website_url || null,
    skills: parseList(row.skills),
    interests: parseList(row.interests),
    profileCompleted: isComplete,
    isProfileComplete: isComplete,
    profile: {
      userId: row.user_id,
      fullName: row.full_name,
      phone: row.phone || null,
      degree: row.degree || null,
      branch: row.branch || null,
      graduationYear: row.graduation_year || null,
      currentAcademicYear: currentAcademicYear,
      company: row.company || null,
      designation: row.designation || null,
      location: row.location || null,
      linkedinUrl: row.linkedin_url || null,
      githubUrl: row.github_url || null,
      bio: row.bio || null,
      skills: parseList(row.skills),
      interests: parseList(row.interests),
      avatarUrl: avatar,
      avatar: avatar,
      bannerUrl: banner,
      banner: banner,
      coverImage: banner,
      profileCompleted: isComplete,
    }
  };
};

const validateRoleOnboarding = (role, data) => {
  if (isBlank(data.fullName)) {
    const error = new Error('Full name is required');
    error.statusCode = 400;
    error.errorCode = 'BAD_REQUEST';
    throw error;
  }
  if (isBlank(data.avatarUrl) || String(data.avatarUrl).includes('unsplash')) {
    const error = new Error('Profile photo is mandatory. Please upload or set your profile photo');
    error.statusCode = 400;
    error.errorCode = 'BAD_REQUEST';
    throw error;
  }


  if (isBlank(data.phone)) {
    const error = new Error('Mobile number is required');
    error.statusCode = 400;
    error.errorCode = 'BAD_REQUEST';
    throw error;
  }
  if (isBlank(data.degree)) {
    const error = new Error('Degree program is required');
    error.statusCode = 400;
    error.errorCode = 'BAD_REQUEST';
    throw error;
  }
  if (isBlank(data.branch)) {
    const error = new Error('Branch / Specialization is required');
    error.statusCode = 400;
    error.errorCode = 'BAD_REQUEST';
    throw error;
  }

  if (role === 'ALUMNI') {
    if (!data.graduationYear) {
      const error = new Error('Graduation year / Passout batch is required for Alumni onboarding');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      throw error;
    }
    if (isBlank(data.company)) {
      const error = new Error('Current company is required for Alumni onboarding');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      throw error;
    }
    if (isBlank(data.designation)) {
      const error = new Error('Current job title / designation is required for Alumni onboarding');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      throw error;
    }
    if (isBlank(data.location)) {
      const error = new Error('Current location is required for Alumni onboarding');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      throw error;
    }
    if (isBlank(data.linkedinUrl)) {
      const error = new Error('LinkedIn profile URL is required for Alumni onboarding');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      throw error;
    }
    const lowerLinkedin = String(data.linkedinUrl).toLowerCase();
    if (!lowerLinkedin.startsWith('http://') && !lowerLinkedin.startsWith('https://')) {
      const error = new Error('LinkedIn URL must be a valid http/https link');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      throw error;
    }
  } else if (role === 'STUDENT') {
    const academicYear = data.currentAcademicYear || data.currentYear;
    if (!academicYear) {
      const error = new Error('Current academic year is required for Student onboarding');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      throw error;
    }
    if (!data.graduationYear) {
      const error = new Error('Expected graduation year is required for Student onboarding');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      throw error;
    }
  }
};

const calculateCompleteness = (role, data) => {
  if (isBlank(data.fullName) || isBlank(data.phone) || isBlank(data.degree) || isBlank(data.branch)) {
    return false;
  }
  const academicYear = data.currentAcademicYear || data.currentYear;
  if (role === 'ALUMNI') {
    return isNotBlank(data.company) && isNotBlank(data.designation) && isNotBlank(data.location) && isNotBlank(data.linkedinUrl) && !!data.graduationYear;
  } else if (role === 'STUDENT') {
    return !!data.graduationYear && !!academicYear;
  }
  return true;
};

const completeOnboarding = async (user, data) => {
  validateRoleOnboarding(user.role, data);

  const skillsStr = formatSkillsInterests(data.skills);
  const interestsStr = formatSkillsInterests(data.interests);
  const isComplete = calculateCompleteness(user.role, data);
  const profileId = crypto.randomUUID();
  const currentAcademicYear = data.currentAcademicYear || data.currentYear;

  const queryText = `
    INSERT INTO user_profiles (
      id, user_id, full_name, phone, avatar_url, bio, degree, branch,
      graduation_year, current_year, company, designation, location,
      is_available_for_mentorship, linkedin_url, github_url, website_url,
      skills, interests, is_profile_complete, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
      bio = COALESCE(EXCLUDED.bio, user_profiles.bio),
      degree = EXCLUDED.degree,
      branch = EXCLUDED.branch,
      graduation_year = EXCLUDED.graduation_year,
      current_year = EXCLUDED.current_year,
      company = EXCLUDED.company,
      designation = EXCLUDED.designation,
      location = EXCLUDED.location,
      is_available_for_mentorship = EXCLUDED.is_available_for_mentorship,
      linkedin_url = EXCLUDED.linkedin_url,
      github_url = COALESCE(EXCLUDED.github_url, user_profiles.github_url),
      website_url = COALESCE(EXCLUDED.website_url, user_profiles.website_url),
      skills = EXCLUDED.skills,
      interests = EXCLUDED.interests,
      is_profile_complete = EXCLUDED.is_profile_complete,
      updated_at = NOW()
    RETURNING *;
  `;

  const values = [
    profileId,
    user.id,
    data.fullName.trim(),
    data.phone ? data.phone.trim() : null,
    data.avatarUrl ? data.avatarUrl.trim() : null,
    data.bio ? data.bio.trim() : null,
    data.degree ? data.degree.trim() : null,
    data.branch ? data.branch.trim() : null,
    data.graduationYear ? parseInt(data.graduationYear, 10) : null,
    currentAcademicYear ? parseInt(currentAcademicYear, 10) : null,
    data.company ? data.company.trim() : null,
    data.designation ? data.designation.trim() : null,
    data.location ? data.location.trim() : null,
    data.isAvailableForMentorship !== false,
    data.linkedinUrl ? data.linkedinUrl.trim() : null,
    data.githubUrl ? data.githubUrl.trim() : null,
    data.websiteUrl ? data.websiteUrl.trim() : null,
    skillsStr,
    interestsStr,
    isComplete,
  ];

  const result = await db.query(queryText, values);
  const profileRow = result.rows[0];

  return formatProfileResponse({ ...profileRow, email: user.email, role: user.role });
};

const getCurrentProfile = async (user) => {
  const connectionService = require('./connectionService');
  const result = await db.query(
    `SELECT p.*, u.email, u.role
     FROM user_profiles p
     JOIN users u ON p.user_id = u.id
     WHERE p.user_id = $1`,
    [user.id]
  );

  const connCount = await connectionService.getConnectionsCount(user.id);

  if (result.rows.length === 0) {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName || '',
      connectionsCount: connCount,
      connectionCount: connCount,
      profileCompleted: false,
      isProfileComplete: false,
      profile: null,
    };
  }

  const profileData = formatProfileResponse(result.rows[0]);
  profileData.connectionsCount = connCount;
  profileData.connectionCount = connCount;
  return profileData;
};

const updateProfile = async (user, data) => {
  const currentProfileResult = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [user.id]);
  let current = currentProfileResult.rows[0] || {};

  // Roll Number Immutability Safeguard
  const newRoll = data.universityRollNumber || data.rollNumber;
  if (
    current.university_roll_number &&
    newRoll &&
    String(newRoll).trim().toUpperCase() !== String(current.university_roll_number).trim().toUpperCase()
  ) {
    const error = new Error('Verified University Roll Number is immutable and cannot be modified.');
    error.statusCode = 400;
    error.errorCode = 'ROLL_NUMBER_IMMUTABLE';
    throw error;
  }

  // Academic Year Validation Safeguard (graduationYear > joiningYear)
  const checkJoiningYear = data.joiningYear || data.joining_year || current.joining_year;
  const checkGradYear = data.graduationYear || current.graduation_year;
  if (checkJoiningYear && checkGradYear) {
    const { validateAcademicYears } = require('../utils/courseConfig');
    validateAcademicYears(checkJoiningYear, checkGradYear);
  }

  const currentAcademicYear = data.currentAcademicYear !== undefined 
    ? data.currentAcademicYear 
    : (data.currentYear !== undefined ? data.currentYear : current.current_year);

  const mergedData = {
    fullName: data.fullName !== undefined ? data.fullName : current.full_name,
    phone: data.phone !== undefined ? data.phone : current.phone,
    degree: data.degree !== undefined ? data.degree : current.degree,
    branch: data.branch !== undefined ? data.branch : current.branch,
    graduationYear: data.graduationYear !== undefined ? data.graduationYear : current.graduation_year,
    currentAcademicYear: currentAcademicYear,
    currentYear: currentAcademicYear,
    company: data.company !== undefined ? data.company : current.company,
    designation: data.designation !== undefined ? data.designation : current.designation,
    location: data.location !== undefined ? data.location : current.location,
    linkedinUrl: data.linkedinUrl !== undefined ? data.linkedinUrl : current.linkedin_url,
  };

  if (data.isOnboarding || !current.is_profile_complete) {
    validateRoleOnboarding(user.role, mergedData);
  }

  const isComplete = calculateCompleteness(user.role, mergedData);
  const profileId = current.id || crypto.randomUUID();

  const skillsStr = data.skills !== undefined ? formatSkillsInterests(data.skills) : current.skills;
  const interestsStr = data.interests !== undefined ? formatSkillsInterests(data.interests) : current.interests;

  const avatarVal = data.avatarUrl !== undefined
    ? (data.avatarUrl ? data.avatarUrl.trim() : null)
    : (data.avatar !== undefined ? (data.avatar ? data.avatar.trim() : null) : current.avatar_url);

  const bannerVal = data.bannerUrl !== undefined
    ? (data.bannerUrl ? data.bannerUrl.trim() : null)
    : (data.banner !== undefined
      ? (data.banner ? data.banner.trim() : null)
      : (data.coverImage !== undefined ? (data.coverImage ? data.coverImage.trim() : null) : current.banner_url));

  const queryText = `
    INSERT INTO user_profiles (
      id, user_id, full_name, phone, avatar_url, banner_url, bio, degree, branch,
      graduation_year, current_year, company, designation, location,
      is_available_for_mentorship, linkedin_url, github_url, website_url,
      skills, interests, is_profile_complete, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      avatar_url = EXCLUDED.avatar_url,
      banner_url = EXCLUDED.banner_url,
      bio = EXCLUDED.bio,
      degree = EXCLUDED.degree,
      branch = EXCLUDED.branch,
      graduation_year = EXCLUDED.graduation_year,
      current_year = EXCLUDED.current_year,
      company = EXCLUDED.company,
      designation = EXCLUDED.designation,
      location = EXCLUDED.location,
      is_available_for_mentorship = EXCLUDED.is_available_for_mentorship,
      linkedin_url = EXCLUDED.linkedin_url,
      github_url = EXCLUDED.github_url,
      website_url = EXCLUDED.website_url,
      skills = EXCLUDED.skills,
      interests = EXCLUDED.interests,
      is_profile_complete = EXCLUDED.is_profile_complete,
      updated_at = NOW()
    RETURNING *;
  `;

  const values = [
    profileId,
    user.id,
    mergedData.fullName ? mergedData.fullName.trim() : user.email,
    mergedData.phone ? mergedData.phone.trim() : null,
    avatarVal,
    bannerVal,
    data.bio !== undefined ? (data.bio ? data.bio.trim() : null) : current.bio,
    mergedData.degree ? mergedData.degree.trim() : null,
    mergedData.branch ? mergedData.branch.trim() : null,
    mergedData.graduationYear ? parseInt(mergedData.graduationYear, 10) : null,
    currentAcademicYear ? parseInt(currentAcademicYear, 10) : null,
    mergedData.company ? mergedData.company.trim() : null,
    mergedData.designation ? mergedData.designation.trim() : null,
    mergedData.location ? mergedData.location.trim() : null,
    data.isAvailableForMentorship !== undefined ? data.isAvailableForMentorship : (current.is_available_for_mentorship !== false),
    mergedData.linkedinUrl ? mergedData.linkedinUrl.trim() : null,
    data.githubUrl !== undefined ? (data.githubUrl ? data.githubUrl.trim() : null) : current.github_url,
    data.websiteUrl !== undefined ? (data.websiteUrl ? data.websiteUrl.trim() : null) : current.website_url,
    skillsStr,
    interestsStr,
    isComplete,
  ];

  const result = await db.query(queryText, values);
  return formatProfileResponse({ ...result.rows[0], email: user.email, role: user.role });
};

const getProfileById = async (targetUserId, authUser = null) => {
  const result = await db.query(
    `SELECT p.*, u.email, u.role
     FROM user_profiles p
     JOIN users u ON p.user_id = u.id
     WHERE p.user_id = $1`,
    [targetUserId]
  );

  if (result.rows.length === 0) {
    const error = new Error(`Profile not found for user ID: '${targetUserId}'`);
    error.statusCode = 404;
    error.errorCode = 'RESOURCE_NOT_FOUND';
    throw error;
  }

  const profile = formatProfileResponse(result.rows[0]);
  const connectionService = require('./connectionService');
  const connCount = await connectionService.getConnectionsCount(targetUserId);
  profile.connectionsCount = connCount;
  profile.connectionCount = connCount;

  // Compute relationship status relative to authUser
  if (authUser && authUser.id) {
    if (authUser.id === targetUserId) {
      profile.connectionStatus = 'self';
    } else {
      const connRes = await db.query(
        `SELECT * FROM connections 
         WHERE (requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1)`,
        [authUser.id, targetUserId]
      );
      if (connRes.rows.length > 0) {
        const conn = connRes.rows[0];
        if (conn.status === 'ACCEPTED') {
          profile.connectionStatus = 'connected';
          profile.connectionId = conn.id;
        } else if (conn.status === 'PENDING') {
          profile.connectionId = conn.id;
          if (conn.requester_id === authUser.id) {
            profile.connectionStatus = 'pending_outgoing';
          } else {
            profile.connectionStatus = 'pending_incoming';
          }
        }
      } else {
        profile.connectionStatus = 'none';
      }
    }
  } else {
    profile.connectionStatus = 'none';
  }

  return profile;
};

module.exports = {
  completeOnboarding,
  getCurrentProfile,
  updateProfile,
  getProfileById,
};
