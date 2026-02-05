import type { AuthStrategy, ApiTokenCredentials } from '../types';

export const apiTokenStrategy: AuthStrategy = {
  name: 'api-token',
  
  getHeaders(credentials: any, jiraHost: string): Record<string, string> {
    const creds = credentials as ApiTokenCredentials;
    const auth = Buffer.from(`${creds.email}:${creds.apiToken}`).toString('base64');
    
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  },
  
  validate(credentials: any): boolean {
    const creds = credentials as ApiTokenCredentials;
    return !!(creds.email && creds.apiToken);
  },
};
