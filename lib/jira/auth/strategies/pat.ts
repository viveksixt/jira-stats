import type { AuthStrategy, PATCredentials } from '../types';

export const patStrategy: AuthStrategy = {
  name: 'pat',
  
  getHeaders(credentials: any, jiraHost: string): Record<string, string> {
    const creds = credentials as PATCredentials;
    
    return {
      'Authorization': `Bearer ${creds.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  },
  
  validate(credentials: any): boolean {
    const creds = credentials as PATCredentials;
    return !!creds.token;
  },
};
