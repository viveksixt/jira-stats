import type { AuthStrategy, ApiTokenUserCredentials } from '../types';

export const apiTokenUserStrategy: AuthStrategy = {
  name: 'api-token-user',
  
  getHeaders(credentials: any, jiraHost: string): Record<string, string> {
    const creds = credentials as ApiTokenUserCredentials;
    const auth = Buffer.from(`${creds.username}:${creds.apiToken}`).toString('base64');
    
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  },
  
  validate(credentials: any): boolean {
    const creds = credentials as ApiTokenUserCredentials;
    return !!(creds.username && creds.apiToken);
  },
};
