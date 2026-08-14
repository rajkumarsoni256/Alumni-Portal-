/**
 * Centralized Course Configuration & University Roll Number Validation
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
 * Expected format: YYCOURSECODENNNN (e.g. 24BCON0332, 25BTECH1045)
 */
const validateAndNormalizeRollNumber = (rollNumber, courseCode, joiningYear) => {
  if (!rollNumber || typeof rollNumber !== 'string') {
    const err = new Error('University Roll Number is required.');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }

  const cleanRoll = rollNumber.trim().toUpperCase();

  // Pattern: 2 digits joining year YY + 2 to 15 uppercase letters + 3 to 6 digits
  const rollRegex = /^(\d{2})([A-Z]{2,15})(\d{3,6})$/;
  const match = cleanRoll.match(rollRegex);

  if (!match) {
    const err = new Error(
      `Invalid University Roll Number format "${cleanRoll}". Expected format: YYCOURSECODENNNN (e.g. 24BCON0332).`
    );
    err.statusCode = 400;
    err.errorCode = 'INVALID_ROLL_NUMBER_FORMAT';
    throw err;
  }

  const [, rollYY, rollCourse, rollNum] = match;

  if (courseCode) {
    const normCourse = String(courseCode).trim().toUpperCase();
    if (rollCourse !== normCourse) {
      const err = new Error(
        `Roll number course code "${rollCourse}" does not match selected course "${normCourse}".`
      );
      err.statusCode = 400;
      err.errorCode = 'COURSE_MISMATCH';
      throw err;
    }
  }

  if (!ALLOWED_COURSE_CODES.includes(rollCourse)) {
    const err = new Error(
      `Unsupported course code "${rollCourse}". Allowed courses: ${ALLOWED_COURSE_CODES.join(', ')}.`
    );
    err.statusCode = 400;
    err.errorCode = 'UNSUPPORTED_COURSE';
    throw err;
  }

  if (joiningYear) {
    const yearYY = String(joiningYear).slice(-2);
    if (rollYY !== yearYY) {
      const err = new Error(
        `Roll number year digits "${rollYY}" do not match joining year ${joiningYear}.`
      );
      err.statusCode = 400;
      err.errorCode = 'JOINING_YEAR_MISMATCH';
      throw err;
    }
  }

  return cleanRoll;
};

/**
 * Validate Joining & Graduation Years
 */
const validateAcademicYears = (joiningYear, graduationYear) => {
  const jYear = parseInt(joiningYear, 10);
  const gYear = parseInt(graduationYear, 10);

  if (isNaN(jYear) || jYear < 1990 || jYear > 2050) {
    const err = new Error('Joining year must be a valid 4-digit year.');
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
    const err = new Error(`Graduation year (${gYear}) must be after joining year (${jYear}).`);
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
  validateAcademicYears,
};
