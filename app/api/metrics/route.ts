import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnection } from '@/lib/jira/auth/storage';
import { JiraClient } from '@/lib/jira/client';
import {
  calculateSprintMetrics,
  calculateStoryPointsByAssignee,
  calculateIssueTypeBreakdown,
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
    const sprintIdsParam = searchParams.get('sprintIds');
    const sprintId = searchParams.get('sprintId'); // Keep for backwards compatibility
    const actualSprintIds = sprintIdsParam ? sprintIdsParam.split(',').map(id => parseInt(id)) : (sprintId ? [parseInt(sprintId)] : []);
    const component = searchParams.get('component');
    const techLabelsParam = searchParams.get('techLabels');
    const techLabels = techLabelsParam ? techLabelsParam.split(',').map(l => l.trim()) : undefined;
    const ignoreKeysParam = searchParams.get('ignoreKeys');
    const ignoreKeys = ignoreKeysParam ? ignoreKeysParam.split(',').map(k => k.trim()) : [];
    const techEpicKeysParam = searchParams.get('techEpicKeys');
    const techEpicKeys = techEpicKeysParam ? techEpicKeysParam.split(',').map(k => k.trim()) : [];

    if (!actualSprintIds || actualSprintIds.length === 0) {
      return NextResponse.json(
        { error: 'sprintIds or sprintId parameter required' },
        { status: 400 }
      );
    }

    const client = new JiraClient(
      connection.jiraHost,
      connection.authMethod,
      connection.credentials
    );

    // Fetch issues from all selected sprints
    let issues: any[] = [];
    for (const sprintId of actualSprintIds) {
      const sprintIssues = await client.getSprintIssues(sprintId, ['changelog']);
      issues.push(...sprintIssues);
    }

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

    // Get sprint info for the first sprint (for comparison view enhancement later)
    const firstSprintId = actualSprintIds[0];
    let sprint;
    try {
      sprint = await client.getSprint(firstSprintId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      );
    }

    // Calculate metrics
    const metrics = calculateSprintMetrics(
      firstSprintId,
      sprint.name,
      issues,
      component || undefined,
      techLabels,
      techEpicKeys
    );

    // Filter bugs from existing sprint issues
    const bugs = issues.filter(issue => {
      return issue.fields.issuetype?.name?.toLowerCase().includes('bug') || false;
    });

    // Calculate chart data
    const chartData = {
      storyPointsByAssignee: calculateStoryPointsByAssignee(issues),
      issueTypeBreakdown: calculateIssueTypeBreakdown(issues),
      workloadDistribution: calculateWorkloadDistribution(issues),
      issueAging: calculateIssueAging(issues),
      bugsTrend: calculateProductionBugsTrend(bugs, 'week'),
      cycleTimeTrend: calculateCycleTimeTrend(issues),
      techDebtTrend: calculateTechDebtTrend(issues, techLabels, techEpicKeys),
    };

    // Get issues for metric tiles
    const { isTechIssue } = await import('@/lib/metrics/kpi');
    const productIssues = issues.filter(issue => !isTechIssue(issue, techLabels, techEpicKeys));
    const techDebtIssues = issues.filter(issue => isTechIssue(issue, techLabels, techEpicKeys));
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
