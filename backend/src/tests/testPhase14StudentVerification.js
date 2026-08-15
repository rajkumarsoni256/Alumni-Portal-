const assert = require('assert');
const db = require('../config/db');
const authService = require('../services/authService');
const profileService = require('../services/profileService');
const { validateJECRCEmail, validateAcademicYears, validateMobileNumber, validateAndNormalizeRollNumber } = require('../utils/courseConfig');

async function runPhase14VerificationTests() {
  console.log('====================================================');
  console.log('   PHASE 14 — STUDENT VERIFICATION & IDENTITY TEST  ');
  console.log('====================================================');

  try {
    // 1. Validation Helpers Test
    console.log('\n[TEST 1] Testing Validation Helpers & Normalization...');

    assert.strictEqual(validateAndNormalizeRollNumber('  24bcon0332 '), '24BCON0332');
    assert.strictEqual(validateJECRCEmail('student.test@jecrcu.edu.in'), 'student.test@jecrcu.edu.in');
    assert.strictEqual(validateJECRCEmail('STUDENT.TEST@JECRCU.EDU.IN'), 'student.test@jecrcu.edu.in');

    let invalidEmailPassed = false;
    try {
      validateJECRCEmail('student@gmail.com');
    } catch (err) {
      invalidEmailPassed = true;
      assert.strictEqual(err.errorCode, 'INVALID_INSTITUTIONAL_DOMAIN');
    }
    assert.strictEqual(invalidEmailPassed, true, 'Non-JECRC email must throw INVALID_INSTITUTIONAL_DOMAIN');

    assert.strictEqual(validateMobileNumber('9876543210'), '9876543210');
    let invalidMobilePassed = false;
    try {
      validateMobileNumber('12345');
    } catch (err) {
      invalidMobilePassed = true;
      assert.strictEqual(err.errorCode, 'INVALID_MOBILE_NUMBER');
    }
    assert.strictEqual(invalidMobilePassed, true, 'Invalid mobile number must throw INVALID_MOBILE_NUMBER');

    let yearCheckPassed = false;
    try {
      validateAcademicYears(2025, 2024);
    } catch (err) {
      yearCheckPassed = true;
      assert.strictEqual(err.errorCode, 'INVALID_ACADEMIC_YEARS');
    }
    assert.strictEqual(yearCheckPassed, true, 'Academic years validation must throw on graduationYear <= joiningYear');
    console.log('✔ Validation helpers & rules verified cleanly.');

    // Cleanup Test Users
    const testInstEmail = `p14.student.${Date.now()}@jecrcu.edu.in`;
    const testPersonalEmail = `p14.personal.${Date.now()}@gmail.com`;
    const testRoll = `24BTECH${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Initiate Student Registration
    console.log('\n[TEST 2] Initiating Student Verification with JECRC Email...');
    
    // Invalid domain check
    try {
      await authService.initiateStudentRegistration({
        name: 'Phase 14 Tester',
        rollNumber: testRoll,
        institutionalEmail: 'invalid@gmail.com',
        personalEmail: testPersonalEmail,
        mobileNumber: '9876543210',
        password: 'Password123!',
        joiningYear: 2024,
        graduationYear: 2028,
      });
      assert.fail('Should have rejected non-JECRC email');
    } catch (err) {
      assert.strictEqual(err.errorCode, 'INVALID_INSTITUTIONAL_DOMAIN');
      console.log('  ✔ Non-JECRC domain properly rejected');
    }

    // Valid student init
    const initRes = await authService.initiateStudentRegistration({
      name: 'Phase 14 Verified Student',
      rollNumber: testRoll,
      institutionalEmail: testInstEmail,
      personalEmail: testPersonalEmail,
      mobileNumber: '9876543210',
      password: 'Password123!',
      joiningYear: 2024,
      graduationYear: 2028,
    });

    assert.strictEqual(initRes.success, true);
    assert.strictEqual(initRes.institutionalEmail, testInstEmail.toLowerCase());
    console.log('  ✔ OTP initiated & sent to JECRC email');

    // 3. Verify OTP & Complete Student Account Registration
    console.log('\n[TEST 3] Verifying OTP and Creating Student Account...');

    // Fetch generated OTP from database
    const otpRow = await db.query(
      `SELECT code_hash FROM verification_codes WHERE email = $1 AND purpose = 'STUDENT_VERIFICATION' ORDER BY created_at DESC LIMIT 1`,
      [testInstEmail.toLowerCase()]
    );
    assert.ok(otpRow.rows.length > 0, 'OTP record should exist in verification_codes');

    const testCode = '654321';
    const codeHash = require('crypto').createHash('sha256').update(testCode).digest('hex');
    await db.query(
      `UPDATE verification_codes SET code_hash = $1 WHERE email = $2 AND purpose = 'STUDENT_VERIFICATION'`,
      [codeHash, testInstEmail.toLowerCase()]
    );

    const verifyRes = await authService.verifyStudentRegistrationOTP({
      name: 'Phase 14 Verified Student',
      rollNumber: testRoll,
      institutionalEmail: testInstEmail,
      personalEmail: testPersonalEmail,
      mobileNumber: '9876543210',
      password: 'Password123!',
      joiningYear: 2024,
      graduationYear: 2028,
      code: testCode,
    });

    assert.ok(verifyRes.token, 'Registration should return JWT token');
    assert.strictEqual(verifyRes.user.email, testPersonalEmail.toLowerCase());
    assert.strictEqual(verifyRes.user.institutionalEmail, testInstEmail.toLowerCase());
    assert.strictEqual(verifyRes.user.role, 'STUDENT');
    console.log('  ✔ Student account created cleanly. Personal email set as login username!');

    // 4. Test Login Credentials
    console.log('\n[TEST 4] Testing Personal Email Login & Institutional Email Guard...');

    const loginPersonalRes = await authService.login({
      email: testPersonalEmail,
      password: 'Password123!',
    });
    assert.ok(loginPersonalRes.token, 'Login with personal email must succeed');
    console.log('  ✔ Personal email login succeeded!');

    try {
      await authService.login({
        email: testInstEmail,
        password: 'Password123!',
      });
      assert.fail('Should not be able to log in with institutional email if user used personal email');
    } catch (err) {
      assert.strictEqual(err.statusCode, 401);
      console.log('  ✔ Institutional email login attempt correctly rejected with 401!');
    }

    // 5. Test Roll Number Immutability
    console.log('\n[TEST 5] Testing Backend Roll Number Immutability...');

    const studentUser = verifyRes.user;

    try {
      await profileService.updateProfile(studentUser, {
        universityRollNumber: 'MUTATED999',
      });
      assert.fail('Should have rejected roll number mutation attempt');
    } catch (err) {
      assert.strictEqual(err.errorCode, 'ROLL_NUMBER_IMMUTABLE');
      console.log('  ✔ Roll number mutation attempt correctly blocked with ROLL_NUMBER_IMMUTABLE error!');
    }

    // Cleanup
    await db.query('DELETE FROM user_profiles WHERE user_id = $1', [studentUser.id]);
    await db.query('DELETE FROM users WHERE id = $1', [studentUser.id]);
    await db.query('DELETE FROM verification_codes WHERE email = $1', [testInstEmail.toLowerCase()]);

    console.log('\n====================================================');
    console.log('   ALL PHASE 14 STUDENT VERIFICATION TESTS PASSED! ');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ Phase 14 Test Failed:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runPhase14VerificationTests();
