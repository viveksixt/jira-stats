import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnection } from '@/lib/jira/auth/storage';
import { JiraClient } from '@/lib/jira/client';
import {
  calculateSprintMetrics,
  calculateStoryPointsByAssignee,
  calculateIssueTypeBreakdown,
  calculateCreatedResolvedTrend,
  calculateWorkloadDistribution,
  calculateIssueAging,
  getIssuesByType,
  calculateProductionBugsTrend,
  calculateCycleTimeTrend,
  calculateTechDebtTrend,
} from '@/lib/metrics';

// GET - Calculate metrics for a sprint
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
    const component = searchParams.get('component');
    const techLabelsParam = searchParams.get('techLabels');
    const techLabels = techLabelsParam ? techLabelsParam.split(',').map(l => l.trim()) : undefined;
    const ignoreKeysParam = searchParams.get('ignoreKeys');
    const ignoreKeys = ignoreKeysParam ? ignoreKeysParam.split(',').map(k => k.trim()) : [];

    if (!sprintId) {
      return NextResponse.json(
        { error: 'sprintId parameter required' },
        { status: 400 }
      );
    }

    const client = new JiraClient(
      connection.jiraHost,
      connection.authMethod,
      connection.credentials
    );

    // Fetch issues with changelog for cycle time calculation
    let issues = await client.getSprintIssues(parseInt(sprintId), ['changelog']);

    // Filter by component if specified
    if (component) {
      issues = issues.filter(issue => 
        issue.fields.components?.some(c => c.name === component)
      );
    }

    // Filter out cancelled issues (case-insensitive)
    issues = issues.filter(issue => {
      const status = issue.fields.status?.name?.toLowerCase() || '';
      return status !== 'cancelled' && status !== 'canceled';
    });

    // Filter out Task issue type
    issues = issues.filter(issue => {
      const issueType = issue.fields.issuetype?.name?.toLowerCase() || '';
      return !issueType.includes('task') && issueType !== 'sub-task';
    });

    // Filter out ignored issue keys
    if (ignoreKeys.length > 0) {
      issues = issues.filter(issue => !ignoreKeys.includes(issue.key));
    }

    // Get sprint info using the new getSprint method
    let sprint;
    try {
      sprint = await client.getSprint(parseInt(sprintId));
    } catch (error) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      );
    }

    // Calculate metrics
    const metrics = calculateSprintMetrics(
      sprintId,
      sprint.name,
      issues,
      component || undefined,
      techLabels
    );

    // Filter bugs from existing sprint issues
    const bugs = issues.filter(issue => {
      return issue.fields.issuetype?.name?.toLowerCase().includes('bug') || false;
    });

    // Calculate chart data
    const chartData = {
      storyPointsByAssignee: calculateStoryPointsByAssignee(issues),
      issueTypeBreakdown: calculateIssueTypeBreakdown(issues),
      createdResolvedTrend: calculateCreatedResolvedTrend(issues, 'day'),
      workloadDistribution: calculateWorkloadDistribution(issues),
      issueAging: calculateIssueAging(issues),
      bugsTrend: calculateProductionBugsTrend(bugs, 'week'),
      cycleTimeTrend: calculateCycleTimeTrend(issues),
      techDebtTrend: calculateTechDebtTrend(issues, techLabels),
    };

    // Get issues for metric tiles
    const { isTechIssue } = await import('@/lib/metrics/kpi');
    const productIssues = issues.filter(issue => !isTechIssue(issue, techLabels));
    const techDebtIssues = issues.filter(issue => isTechIssue(issue, techLabels));
    const cycleTimeIssues = issues.filter(issue => issue.fields.status?.name?.toLowerCase() === 'done');
    const issuesByType = getIssuesByType(issues);

    return NextResponse.json({
      metrics,
      chartData,
      issues: {
        product: productIssues,
        techDebt: techDebtIssues,
        cycleTime: cycleTimeIssues,
        all: issues,
        bugs,
      },
      issuesByType,
    });
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate metrics' },
      { status: 500 }
    );
  }
}
