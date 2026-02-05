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
} from '@/lib/metrics';

// POST - Execute JQL query and calculate metrics
export async function POST(request: NextRequest) {
  try {
    const connection = await getActiveConnection();

    if (!connection) {
      return NextResponse.json(
        { error: 'No active Jira connection' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { jql, techLabels, ignoreKeys } = body;

    if (!jql) {
      return NextResponse.json(
        { error: 'JQL query is required' },
        { status: 400 }
      );
    }

    const client = new JiraClient(
      connection.jiraHost,
      connection.authMethod,
      connection.credentials
    );

    // Execute JQL query with changelog expansion
    let issues = await client.searchIssues(jql, undefined, ['changelog']);

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
    if (ignoreKeys && ignoreKeys.length > 0) {
      issues = issues.filter(issue => !ignoreKeys.includes(issue.key));
    }

    if (issues.length === 0) {
      return NextResponse.json({
        metrics: null,
        message: 'No issues found matching the JQL query',
        issueCount: 0,
      });
    }

    // Calculate metrics from the results
    const metrics = calculateSprintMetrics(
      'jql-query',
      'JQL Query Results',
      issues,
      undefined,
      techLabels
    );

    // Calculate chart data
    const chartData = {
      storyPointsByAssignee: calculateStoryPointsByAssignee(issues),
      issueTypeBreakdown: calculateIssueTypeBreakdown(issues),
      createdResolvedTrend: calculateCreatedResolvedTrend(issues, 'day'),
      workloadDistribution: calculateWorkloadDistribution(issues),
      issueAging: calculateIssueAging(issues),
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
      issueCount: issues.length,
      issues: {
        product: productIssues,
        techDebt: techDebtIssues,
        cycleTime: cycleTimeIssues,
        all: issues,
      },
      issuesByType,
    });
  } catch (error) {
    console.error('Error executing JQL query:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to execute JQL query';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
