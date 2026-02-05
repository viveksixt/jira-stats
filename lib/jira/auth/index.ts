import type { AuthMethod, AuthStrategy, Credentials } from './types';
import { apiTokenStrategy } from './strategies/api-token';
import { oauthStrategy } from './strategies/oauth';
import { patStrategy } from './strategies/pat';
import { basicAuthStrategy } from './strategies/basic-auth';
import { sessionCookieStrategy } from './strategies/session-cookie';
import { apiTokenUserStrategy } from './strategies/api-token-user';

const strategies: Record<AuthMethod, AuthStrategy> = {
  'api-token': apiTokenStrategy,
  'oauth': oauthStrategy,
  'pat': patStrategy,
  'basic-auth': basicAuthStrategy,
  'session-cookie': sessionCookieStrategy,
  'api-token-user': apiTokenUserStrategy,
};

export class AuthManager {
  private strategy: AuthStrategy;
  private credentials: Credentials;
  private jiraHost: string;

  constructor(authMethod: AuthMethod, credentials: Credentials, jiraHost: string) {
    this.strategy = strategies[authMethod];
    this.credentials = credentials;
    this.jiraHost = jiraHost;
    
    if (!this.strategy) {
      throw new Error(`Unknown auth method: ${authMethod}`);
    }
    
    if (!this.strategy.validate(credentials)) {
      throw new Error(`Invalid credentials for auth method: ${authMethod}`);
    }
  }

  getHeaders(): Record<string, string> {
    return this.strategy.getHeaders(this.credentials, this.jiraHost);
  }

  static getStrategy(authMethod: AuthMethod): AuthStrategy {
    return strategies[authMethod];
  }

  static validateCredentials(authMethod: AuthMethod, credentials: any): boolean {
    const strategy = strategies[authMethod];
    return strategy ? strategy.validate(credentials) : false;
  }
}

export { strategies };
export type { AuthMethod, AuthStrategy, Credentials };
