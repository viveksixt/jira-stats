// Jira API Types

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: {
        key: string;
      };
    };
    issuetype: {
      name: string;
    };
    labels: string[];
    components: Array<{
      name: string;
    }>;
    assignee?: {
      accountId: string;
      displayName: string;
      emailAddress?: string;
    } | null;
    resolutiondate?: string | null;
    created: string;
    updated: string;
    customfield_10016?: number; // Story points (common field)
    parent?: {
      key: string;
      fields?: {
        summary?: string;
        issuetype?: { name: string };
      };
    } | null;
    [key: string]: any;
  };
  changelog?: {
    histories: Array<{
      created: string;
      items: Array<{
        field: string;
        fromString: string;
        toString: string;
      }>;
    }>;
  };
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'closed' | 'future';
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  originBoardId: number;
}

export interface JiraBoard {
  id: number;
  name: string;
  type: string;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
}

export interface JiraUser {
  accountId: string;
  emailAddress: string;
  displayName: string;
}

export interface JiraComponent {
  id: string;
  name: string;
  description?: string;
}

// Auth Types

export type AuthMethod = 
  | 'api-token'
  | 'oauth'
  | 'pat'
  | 'basic-auth'
  | 'session-cookie'
  | 'api-token-user';

export type BoardType = 'all' | 'scrum' | 'kanban';
export type QueryMode = 'board' | 'jql';

export interface ApiTokenCredentials {
  email: string;
  apiToken: string;
}

export interface OAuthCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface PATCredentials {
  token: string;
}

export interface BasicAuthCredentials {
  username: string;
  password: string;
}

export interface SessionCookieCredentials {
  sessionId: string;
}

export interface ApiTokenUserCredentials {
  username: string;
  apiToken: string;
}

export type Credentials =
  | ApiTokenCredentials
  | OAuthCredentials
  | PATCredentials
  | BasicAuthCredentials
  | SessionCookieCredentials
  | ApiTokenUserCredentials;

export interface JiraConnectionConfig {
  jiraHost: string;
  authMethod: AuthMethod;
  credentials: Credentials;
}

// Metrics Types

export interface CycleTimeMetrics {
  average: number;
  median: number;
  p85: number;
  min: number;
  max: number;
}

export interface SprintMetrics {
  sprintId: string;
  sprintName: string;
  totalIssues: number;
  productIssues: number;
  techDebtIssues: number;
  techDebtRatio: number;
  cycleTime: CycleTimeMetrics;
  velocity: number;
  component?: string;
}

// Velocity Tracking Types

export interface VelocitySprintData {
  sprintId: number;
  sprintName: string;
  completeDate: string;
  velocity: number;
  completedIssueCount: number;
  issues: JiraIssue[];
}

export interface AssigneeVelocityData {
  accountId: string;
  displayName: string;
  velocity: number;
  issueCount: number;
  issues: JiraIssue[];
}

export interface EngineerVelocityData {
  sprintId: number;
  sprintName: string;
  completeDate: string;
  assignees: AssigneeVelocityData[];
}

export interface VelocityTimelineConfig {
  mode: 'sprint-count' | 'date-range';
  sprintLimit?: number;
  startDate?: string;
  endDate?: string;
}

export interface VelocityEngineer {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  totalIssueCount: number;
}
