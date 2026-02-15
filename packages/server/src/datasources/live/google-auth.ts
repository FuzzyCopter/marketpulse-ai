import { google } from 'googleapis';
import { env } from '../../config/env.js';

let oauth2Client: InstanceType<typeof google.auth.OAuth2> | null = null;

export function getGoogleAuth() {
  if (!oauth2Client) {
    const { clientId, clientSecret, refreshToken } = env.google;
    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Google OAuth2 credentials not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN in .env');
    }
    oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  }
  return oauth2Client;
}
