import { OAuth2Client } from 'google-auth-library';

export interface GoogleTokenPayload {
  googleId: string;
  email: string;
  isEmailVerified: boolean;
  fullName: string;
  picture?: string;
}

/**
 * Verifies a Google OAuth token using official google-auth-library (ID Token)
 * or Google UserInfo endpoint (OAuth2 Access Token).
 */
export const verifyGoogleToken = async (token: string): Promise<GoogleTokenPayload> => {
  if (!token) {
    throw new Error('Google OAuth token is required.');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const client = new OAuth2Client(clientId);

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId || undefined,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google ID token payload.');
    }

    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (payload.iss && !validIssuers.includes(payload.iss)) {
      throw new Error(`Invalid token issuer: ${payload.iss}`);
    }

    if (payload.email_verified === false) {
      throw new Error('Unverified Google email address. Please verify your Google account before signing in.');
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase().trim(),
      isEmailVerified: true,
      fullName: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || payload.email,
      picture: payload.picture
    };
  } catch (idTokenError: any) {
    // Fallback: If not a valid JWT ID Token, test if it is a valid OAuth2 Access Token
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Google UserInfo response error: ${response.statusText}`);
      }

      const userData: any = await response.json();
      if (!userData || !userData.email) {
        throw new Error('Invalid userinfo payload returned by Google.');
      }

      return {
        googleId: userData.sub,
        email: userData.email.toLowerCase().trim(),
        isEmailVerified: true,
        fullName: userData.name || `${userData.given_name || ''} ${userData.family_name || ''}`.trim() || userData.email,
        picture: userData.picture
      };
    } catch (accessTokenError: any) {
      throw new Error(`Google token verification failed: ${idTokenError?.message || accessTokenError?.message || 'Invalid OAuth token'}`);
    }
  }
};
