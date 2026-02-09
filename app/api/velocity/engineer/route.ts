import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnection } from '@/lib/jira/auth/storage';
import { JiraClient } from '@/lib/jira/client';
import { calculateVelocity, calculateAssigneeVelocity } from '@/lib/metrics/velocity';
import { getLastNClosedSprints, filterSprintsByDateRange } from '@/lib/metrics/velocity';
import type { EngineerVelocityData, AssigneeVelocityData } from '@/types/jira';

// GET - Get engineer velocity data across sprints
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
    const assigneeIdsParam = searchParams.get('assigneeIds');
    const mode = searchParams.get('mode') || 'sprint-count';
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!boardId) {
      return NextResponse.json(
        { error: 'boardId parameter required' },
        { status: 400 }
      );
    }

    if (!assigneeIdsParam) {
      return NextResponse.json(
        { error: 'assigneeIds parameter required (comma-separated accountIds)' },
        { status: 400 }
      );
    }

    const assigneeIds = assigneeIdsParam.split(',').map(id => id.trim());

    const client = new JiraClient(
      connection.jiraHost,
      connection.authMethod,
      connection.credentials
    );

    // Fetch all sprints for the board
    let sprints = await client.getSprints(parseInt(boardId));

    // Filter and sort sprints based on mode
    let targetSprints;
    if (mode === 'date-range' && startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      targetSprints = filterSprintsByDateRange(sprints, startDate, endDate);
    } else {
      // Default to sprint-count mode
      targetSprints = getLastNClosedSprints(sprints, Math.min(limit, 100));
    }

    if (targetSprints.length === 0) {
      return NextResponse.json({
        sprints: [],
        message: 'No closed sprints found in the specified range',
      });
    }

    // Fetch velocity data for each sprint
    const velocityData: EngineerVelocityData[] = [];

    for (const sprint of targetSprints) {
      try {
        const issues = await client.getSprintIssues(sprint.id);

        // Calculate velocity for each assignee
        const assigneeVelocities: AssigneeVelocityData[] = [];

        for (const accountId of assigneeIds) {
          const assigneeIssues = issues.filter(issue => 
            issue.fields.assignee?.accountId === accountId
          );

          if (assigneeIssues.length > 0) {
            const velocity = calculateVelocity(assigneeIssues);
            const completedIssues = assigneeIssues.filter(issue => {
              const status = issue.fields.status.name.toLowerCase();
              return status === 'done' || status === 'closed' || status === 'resolved';
            });

            // Get display name from the first issue
            const displayName = assigneeIssues[0].fields.assignee?.displayName || 'Unknown';

            assigneeVelocities.push({
              accountId,
              displayName,
              velocity,
              issueCount: completedIssues.length,
              issues: completedIssues,
            });
          }
        }

        if (assigneeVelocities.length > 0) {
          velocityData.push({
            sprintId: sprint.id,
            sprintName: sprint.name,
            completeDate: sprint.completeDate || new Date().toISOString(),
            assignees: assigneeVelocities,
          });
        }
      } catch (error) {
        console.error(`Failed to fetch issues for sprint ${sprint.id}:`, error);
        // Continue with next sprint
      }
    }

    // Sort by completeDate ascending (oldest to newest)
    velocityData.sort((a, b) => 
      new Date(a.completeDate).getTime() - new Date(b.completeDate).getTime()
    );

    return NextResponse.json({
      sprints: velocityData,
      totalSprints: velocityData.length,
      assigneeIds,
    });
  } catch (error) {
    console.error('Error fetching engineer velocity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engineer velocity data' },
      { status: 500 }
    );
  }
}
