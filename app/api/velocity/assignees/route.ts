import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnection } from '@/lib/jira/auth/storage';
import { JiraClient } from '@/lib/jira/client';
import { getLastNClosedSprints } from '@/lib/metrics/velocity';
import type { VelocityEngineer } from '@/types/jira';

// GET - Get list of engineers (assignees) who worked on a board
export async function GET(request: NextRequest) {
  try {
    const connection = await getActiveConnection();

    if (!connection) {
      return NextResponse.json(
        { error: 'No active Jira connection' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    if (!boardId) {
      return NextResponse.json(
        { error: 'boardId parameter required' },
        { status: 400 }
      );
    }

    const client = new JiraClient(
      connection.jiraHost,
      connection.authMethod,
      connection.credentials
    );

    const assigneeMap = new Map<string, VelocityEngineer>();
    const board = await client.getBoard(parseInt(boardId));

    if (board.type?.toLowerCase() === 'scrum') {
      // Fetch recent sprints (last 10) to get engineers
      const sprints = await client.getSprints(parseInt(boardId));
      const recentSprints = getLastNClosedSprints(sprints, 10);

      if (recentSprints.length === 0) {
        return NextResponse.json({
          assignees: [],
          message: 'No closed sprints found',
        });
      }

      for (const sprint of recentSprints) {
        try {
          const issues = await client.getSprintIssues(sprint.id);

          issues.forEach(issue => {
            if (issue.fields.assignee?.accountId) {
              const existing = assigneeMap.get(issue.fields.assignee.accountId);
              if (existing) {
                existing.totalIssueCount++;
              } else {
                assigneeMap.set(issue.fields.assignee.accountId, {
                  accountId: issue.fields.assignee.accountId,
                  displayName: issue.fields.assignee.displayName,
                  emailAddress: issue.fields.assignee.emailAddress,
                  totalIssueCount: 1,
                });
              }
            }
          });
        } catch (error) {
          console.error(`Failed to fetch issues for sprint ${sprint.id}:`, error);
        }
      }
    } else {
      // Kanban boards: fall back to board issues
      const issues = await client.getBoardIssues(parseInt(boardId), [
        'assignee',
      ]);

      issues.forEach(issue => {
        if (issue.fields.assignee?.accountId) {
          const existing = assigneeMap.get(issue.fields.assignee.accountId);
          if (existing) {
            existing.totalIssueCount++;
          } else {
            assigneeMap.set(issue.fields.assignee.accountId, {
              accountId: issue.fields.assignee.accountId,
              displayName: issue.fields.assignee.displayName,
              emailAddress: issue.fields.assignee.emailAddress,
              totalIssueCount: 1,
            });
          }
        }
      });
    }

    // Convert to array and sort by issue count (most active first)
    const assignees = Array.from(assigneeMap.values()).sort(
      (a, b) => b.totalIssueCount - a.totalIssueCount
    );

    return NextResponse.json({
      assignees,
      totalAssignees: assignees.length,
    });
  } catch (error) {
    console.error('Error fetching assignees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignees' },
      { status: 500 }
    );
  }
}
