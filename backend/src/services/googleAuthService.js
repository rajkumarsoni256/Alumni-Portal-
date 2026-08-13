const { OAuth2Client } = require('google-auth-library');

const clientId = process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id';
const client = new OAuth2Client(clientId);

const verifyIdToken = async (idTokenString) => {
  if (!idTokenString || typeof idTokenString !== 'string') {
    const error = new Error('Google ID token is required');
    error.statusCode = 401;
    error.errorCode = 'UNAUTHORIZED';
    throw error;
  }

  // Support mock test tokens for development and automated testing
  if (idTokenString.startsWith('mock-google-token')) {
    let rawToken = idTokenString;
    if (rawToken.startsWith('mock-google-token:')) {
      rawToken = rawToken.substring('mock-google-token:'.length);
    } else if (rawToken.startsWith('mock-google-token-')) {
      rawToken = rawToken.substring('mock-google-token-'.length);
    }
    const parts = rawToken.split(':');
    const sub = parts.length > 0 && parts[0] ? parts[0] : 'mock-google-sub-123';
    const email = parts.length > 1 && parts[1] ? parts[1] : 'mockstudent@jecrc.ac.in';
    const name = parts.length > 2 && parts[2] ? parts[2] : 'Mock Google Student';

    console.log(`[DEV EMAIL SERVICE] Verified mock Google token for sub: [${sub}] | email: [${email}] | name: [${name}]`);
    return {
      subjectId: sub,
      email: email.toLowerCase().trim(),
      emailVerified: true,
      name,
      pictureUrl: null,
    };
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: idTokenString,
      audience: clientId !== 'mock-google-client-id' ? clientId : undefined,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      const error = new Error('Google token payload does not contain a valid email');
      error.statusCode = 401;
      error.errorCode = 'UNAUTHORIZED';
      throw error;
    }

    if (!payload.email_verified) {
      const error = new Error('Google email address is not verified by Google');
      error.statusCode = 401;
      error.errorCode = 'UNAUTHORIZED';
      throw error;
    }

    return {
      subjectId: payload.sub,
      email: payload.email.toLowerCase().trim(),
      emailVerified: true,
      name: payload.name || payload.email.split('@')[0],
      pictureUrl: payload.picture || null,
    };
  } catch (err) {
    if (err.statusCode) throw err;
    console.error('Failed to verify Google ID token:', err.message);
    const error = new Error('Google identity verification failed: ' + err.message);
    error.statusCode = 401;
    error.errorCode = 'UNAUTHORIZED';
    throw error;
  }
};

module.exports = {
  verifyIdToken,
};
