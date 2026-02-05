import type { AuthStrategy, OAuthCredentials } from '../types';

export const oauthStrategy: AuthStrategy = {
  name: 'oauth',
  
  getHeaders(credentials: any, jiraHost: string): Record<string, string> {
    const creds = credentials as OAuthCredentials;
    
    return {
      'Authorization': `Bearer ${creds.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  },
  
  validate(credentials: any): boolean {
    const creds = credentials as OAuthCredentials;
    return !!(creds.accessToken && creds.refreshToken);
  },
};
