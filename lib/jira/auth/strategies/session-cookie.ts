import type { AuthStrategy, SessionCookieCredentials } from '../types';

export const sessionCookieStrategy: AuthStrategy = {
  name: 'session-cookie',
  
  getHeaders(credentials: any, jiraHost: string): Record<string, string> {
    const creds = credentials as SessionCookieCredentials;
    
    return {
      'Cookie': `JSESSIONID=${creds.sessionId}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  },
  
  validate(credentials: any): boolean {
    const creds = credentials as SessionCookieCredentials;
    return !!creds.sessionId;
  },
};
