import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnection } from '@/lib/jira/auth/storage';
import { JiraClient } from '@/lib/jira/client';
import { calculateSprintMetrics } from '@/lib/metrics';

// GET - Get components for a project and calculate team metrics
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
    const sprintId = searchParams.get('sprintId');
    const projectKey = searchParams.get('projectKey');

    if (!sprintId || !projectKey) {
      return NextResponse.json(
        { error: 'sprintId and projectKey parameters required' },
        { status: 400 }
      );
    }

    const client = new JiraClient(
      connection.jiraHost,
      connection.authMethod,
      connection.credentials
    );

    // Get project components
    let components;
    try {
      components = await client.getProjectComponents(projectKey);
    } catch (error) {
      console.error('Failed to fetch components:', error);
      components = [];
    }

    // If no components, return empty teams
    if (components.length === 0) {
      return NextResponse.json({
        teams: [],
        message: 'No components found in this project',
      });
    }

    // Fetch issues for the sprint
    let allIssues = await client.getSprintIssues(parseInt(sprintId), ['changelog']);

    // Calculate metrics for each team/component
    const teamMetrics = components.map((component) => {
      const componentIssues = allIssues.filter((issue) =>
        issue.fields.components?.some((c) => c.name === component.name)
      );

      const metrics = calculateSprintMetrics(
        sprintId,
        component.name,
        componentIssues,
        component.name
      );

      return {
        name: component.name,
        velocity: metrics.velocity,
        cycleTime: metrics.cycleTime.average,
        techDebtRatio: metrics.techDebtRatio,
        issueCount: metrics.totalIssues,
      };
    });

    // Filter out teams with no issues
    const activeTeams = teamMetrics.filter((t) => t.issueCount > 0);

    return NextResponse.json({
      teams: activeTeams,
      totalComponents: components.length,
    });
  } catch (error) {
    console.error('Error fetching team metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team metrics' },
      { status: 500 }
    );
  }
}
