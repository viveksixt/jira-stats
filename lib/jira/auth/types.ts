import type {
  AuthMethod,
  Credentials,
  ApiTokenCredentials,
  OAuthCredentials,
  PATCredentials,
  BasicAuthCredentials,
  SessionCookieCredentials,
  ApiTokenUserCredentials,
} from '@/types/jira';

export type {
  AuthMethod,
  Credentials,
  ApiTokenCredentials,
  OAuthCredentials,
  PATCredentials,
  BasicAuthCredentials,
  SessionCookieCredentials,
  ApiTokenUserCredentials,
};

export interface AuthStrategy {
  name: AuthMethod;
  getHeaders(credentials: Credentials, jiraHost: string): Record<string, string>;
  validate(credentials: any): boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  user?: {
    accountId: string;
    email: string;
    displayName: string;
  };
  error?: string;
}
