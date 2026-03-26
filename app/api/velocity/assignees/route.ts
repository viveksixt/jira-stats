import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnection } from '@/lib/jira/auth/storage';
import { JiraClient } from '@/lib/jira/client';
import type { VelocityEngineer } from '@/types/jira';

export async function GET(request: NextRequest) {
  try {
    const connection = await getActiveConnection();
    if (!connection) {
      return NextResponse.json({ error: 'No active Jira connection' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boardIdParam = searchParams.get('boardId');
    if (!boardIdParam) {
      return NextResponse.json({ error: 'boardId parameter required' }, { status: 400 });
    }

    const boardId = parseInt(boardIdParam, 10);
    const client = new JiraClient(connection.jiraHost, connection.authMethod, connection.credentials);

    // Take last 10 closed sprints with completeDate (best signal for recent contributors)
    const allSprints = await client.getSprints(boardId);
    const recent = (allSprints || [])
      .filter((s) => s.state === 'closed' && s.completeDate)
      .sort((a, b) => new Date(b.completeDate!).getTime() - new Date(a.completeDate!).getTime())
      .slice(0, 10);

    const map = new Map<string, VelocityEngineer>();

    for (const sprint of recent) {
      const issues = await client.getSprintIssues(sprint.id);
      for (const issue of issues) {
        const assignee = issue.fields.assignee;
        if (!assignee?.accountId) continue;

        const existing = map.get(assignee.accountId);
        if (existing) {
          existing.totalIssueCount += 1;
        } else {
          map.set(assignee.accountId, {
            accountId: assignee.accountId,
            displayName: assignee.displayName,
            emailAddress: assignee.emailAddress,
            totalIssueCount: 1,
          });
        }
      }
    }

    const assignees = Array.from(map.values()).sort((a, b) => b.totalIssueCount - a.totalIssueCount);
    return NextResponse.json({ assignees });
  } catch (error) {
    console.error('Error fetching velocity assignees:', error);
    return NextResponse.json({ error: 'Failed to fetch assignees' }, { status: 500 });
  }
}

