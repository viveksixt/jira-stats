import type { AuthStrategy, BasicAuthCredentials } from '../types';

export const basicAuthStrategy: AuthStrategy = {
  name: 'basic-auth',
  
  getHeaders(credentials: any, jiraHost: string): Record<string, string> {
    const creds = credentials as BasicAuthCredentials;
    const auth = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
    
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  },
  
  validate(credentials: any): boolean {
    const creds = credentials as BasicAuthCredentials;
    return !!(creds.username && creds.password);
  },
};
