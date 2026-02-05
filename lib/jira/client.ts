import { AuthManager } from './auth';
import type { AuthMethod, Credentials } from './auth/types';
import type { JiraIssue, JiraSprint, JiraBoard, JiraComponent, JiraProject } from '@/types/jira';

export class JiraClient {
  private baseUrl: string;
  private authManager: AuthManager;

  constructor(jiraHost: string, authMethod: AuthMethod, credentials: Credentials) {
    this.baseUrl = jiraHost.startsWith('http') ? jiraHost : `https://${jiraHost}`;
    this.authManager = new AuthManager(authMethod, credentials, jiraHost);
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers = {
      ...this.authManager.getHeaders(),
      ...options?.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jira API error: ${response.status} ${response.statusText}. ${errorText}`);
    }

    return response.json();
  }

  // Search issues with JQL
  async searchIssues(jql: string, fields?: string[], expand?: string[]): Promise<JiraIssue[]> {
    const body: any = {
      jql,
      maxResults: 1000,
    };

    if (fields && fields.length > 0) {
      body.fields = fields;
    }

    if (expand && expand.length > 0) {
      body.expand = expand.join(',');
    }

    const result = await this.request<{ issues: JiraIssue[] }>(
      '/rest/api/3/search/jql',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    return result.issues;
  }

  // Get boards
  async getBoards(): Promise<JiraBoard[]> {
    const result = await this.request<{ values: JiraBoard[] }>(
      '/rest/agile/1.0/board'
    );
    return result.values;
  }

  // Get boards for a specific project
  async getBoardsForProject(projectKey: string, type?: string): Promise<JiraBoard[]> {
    const params = new URLSearchParams();
    params.append('projectKeyOrId', projectKey);
    if (type && type !== 'all') {
      params.append('type', type);
    }
    const result = await this.request<{ values: JiraBoard[] }>(
      `/rest/agile/1.0/board?${params.toString()}`
    );
    return result.values;
  }

  // Get all projects
  async getProjects(): Promise<JiraProject[]> {
    const result = await this.request<{ values: JiraProject[] }>(
      '/rest/api/3/project/search'
    );
    return result.values;
  }

  // Get sprint by ID
  async getSprint(sprintId: number): Promise<JiraSprint> {
    return this.request<JiraSprint>(
      `/rest/agile/1.0/sprint/${sprintId}`
    );
  }

  // Get sprints for a board
  async getSprints(boardId: number): Promise<JiraSprint[]> {
    let allSprints: JiraSprint[] = [];
    let startAt = 0;
    let isLast = false;

    while (!isLast) {
      const result = await this.request<{ values: JiraSprint[]; isLast: boolean }>(
        `/rest/agile/1.0/board/${boardId}/sprint?startAt=${startAt}&maxResults=50`
      );
      allSprints = allSprints.concat(result.values);
      isLast = result.isLast;
      startAt += 50;
    }

    return allSprints;
  }

  // Get issues in a sprint
  async getSprintIssues(sprintId: number, expand?: string[]): Promise<JiraIssue[]> {
    const params = new URLSearchParams({
      maxResults: '1000',
    });

    if (expand && expand.length > 0) {
      params.append('expand', expand.join(','));
    }

    const result = await this.request<{ issues: JiraIssue[] }>(
      `/rest/agile/1.0/sprint/${sprintId}/issue?${params.toString()}`
    );

    return result.issues;
  }

  // Get issue with changelog
  async getIssueWithChangelog(issueKey: string): Promise<JiraIssue> {
    return this.request<JiraIssue>(
      `/rest/api/3/issue/${issueKey}?expand=changelog`
    );
  }

  // Get project components
  async getProjectComponents(projectKey: string): Promise<JiraComponent[]> {
    return this.request<JiraComponent[]>(
      `/rest/api/3/project/${projectKey}/components`
    );
  }

  // Get current user
  async getCurrentUser() {
    return this.request<any>('/rest/api/3/myself');
  }
}
