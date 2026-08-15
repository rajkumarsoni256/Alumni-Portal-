/**
 * Centralized Course Configuration & Institutional Student Identity Validation
 * JECRC Community Platform
 */

const ALLOWED_COURSES = [
  { code: 'BCON', name: 'Bachelor of Construction Management / Commerce', durationYears: 3 },
  { code: 'BCS', name: 'Bachelor of Computer Science', durationYears: 3 },
  { code: 'BTECH', name: 'Bachelor of Technology', durationYears: 4 },
  { code: 'MCA', name: 'Master of Computer Applications', durationYears: 2 },
  { code: 'MBA', name: 'Master of Business Administration', durationYears: 2 },
  { code: 'BCA', name: 'Bachelor of Computer Applications', durationYears: 3 },
];

const ALLOWED_COURSE_CODES = ALLOWED_COURSES.map((c) => c.code);

/**
 * Validate & Normalize University Roll Number
 * Treats roll number as an opaque institutional unique identifier.
 * Normalizes via trim().toUpperCase().
 * Does NOT enforce a rigid regex or reject unknown course prefixes.
 */
const validateAndNormalizeRollNumber = (rollNumber) => {
  if (!rollNumber || typeof rollNumber !== 'string' || !rollNumber.trim()) {
    const err = new Error('University Roll Number is required.');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const cleanRoll = rollNumber.trim().toUpperCase();
  if (cleanRoll.length < 3 || cleanRoll.length > 50) {
    const err = new Error('University Roll Number must be between 3 and 50 characters.');
    err.statusCode = 400;
    err.errorCode = 'INVALID_ROLL_NUMBER_LENGTH';
    throw err;
  }

  return cleanRoll;
};

/**
 * Validate JECRC Institutional Email (@jecrcu.edu.in)
 * Email matching must be case-insensitive and enforce exact domain match.
 */
const validateJECRCEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    const err = new Error('JECRC Institutional Email is required for student verification.');
    err.statusCode = 400;
    err.errorCode = 'INSTITUTIONAL_EMAIL_REQUIRED';
    throw err;
  }

  const cleanEmail = email.trim().toLowerCase();
  const parts = cleanEmail.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    const err = new Error('Invalid email format for JECRC Institutional Email.');
    err.statusCode = 400;
    err.errorCode = 'INVALID_EMAIL_FORMAT';
    throw err;
  }

  const domain = parts[1];
  if (domain !== 'jecrcu.edu.in') {
    const err = new Error('JECRC Institutional Email must belong to @jecrcu.edu.in domain.');
    err.statusCode = 400;
    err.errorCode = 'INVALID_INSTITUTIONAL_DOMAIN';
    throw err;
  }

  return cleanEmail;
};

/**
 * Validate Mobile Number for All Users (STUDENT, ALUMNI, ADMIN)
 * Rejects non-phone strings ('abc', '123', '123456', '!!!!!!!!').
 */
const validateMobileNumber = (phone) => {
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    const err = new Error('Mobile number is required.');
    err.statusCode = 400;
    err.errorCode = 'MOBILE_REQUIRED';
    throw err;
  }

  const cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, '');

  // Rejects invalid strings such as 'abc', '123', '123456', '!!!!!!!!'
  const indianMobileRegex = /^[6-9]\d{9}$/;
  const internationalE164Regex = /^\+?[1-9]\d{7,14}$/;

  if (!indianMobileRegex.test(cleanPhone) && !internationalE164Regex.test(cleanPhone)) {
    const err = new Error('Please enter a valid 10-digit mobile number.');
    err.statusCode = 400;
    err.errorCode = 'INVALID_MOBILE_NUMBER';
    throw err;
  }

  return cleanPhone;
};

/**
 * Validate Admission (Joining) & Graduation Years
 * Enforces graduationYear > joiningYear (never equal or less).
 */
const validateAcademicYears = (joiningYear, graduationYear) => {
  const jYear = parseInt(joiningYear, 10);
  const gYear = parseInt(graduationYear, 10);

  if (isNaN(jYear) || jYear < 1990 || jYear > 2050) {
    const err = new Error('Admission year must be a valid 4-digit year.');
    err.statusCode = 400;
    err.errorCode = 'INVALID_JOINING_YEAR';
    throw err;
  }

  if (isNaN(gYear) || gYear < 1990 || gYear > 2050) {
    const err = new Error('Graduation year must be a valid 4-digit year.');
    err.statusCode = 400;
    err.errorCode = 'INVALID_GRADUATION_YEAR';
    throw err;
  }

  if (gYear <= jYear) {
    const err = new Error(`Graduation year (${gYear}) must be after admission year (${jYear}).`);
    err.statusCode = 400;
    err.errorCode = 'INVALID_ACADEMIC_YEARS';
    throw err;
  }

  return { joiningYear: jYear, graduationYear: gYear };
};

module.exports = {
  ALLOWED_COURSES,
  ALLOWED_COURSE_CODES,
  validateAndNormalizeRollNumber,
  validateJECRCEmail,
  validateMobileNumber,
  validateAcademicYears,
};
