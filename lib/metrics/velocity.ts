import type { JiraIssue, JiraSprint } from '@/types/jira';

// Extract story points from an issue
export function getStoryPoints(issue: JiraIssue): number {
  // Common story point field names
  const storyPointFields = [
    'customfield_10039', // Confirmed field for this Jira instance
    'customfield_10016', // Most common
    'customfield_10026',
    'customfield_10002',
    'storyPoints',
    'story_points',
  ];

  for (const field of storyPointFields) {
    const value = issue.fields[field];
    if (typeof value === 'number') {
      // Return the value even if it's 0, as 0 is a valid story point value
      return value;
    }
  }

  // Default to 3 if no story points found
  return 3;
}

// Calculate velocity (total story points completed)
export function calculateVelocity(issues: JiraIssue[]): number {
  // Only count completed issues
  const completedIssues = issues.filter(issue => {
    const status = issue.fields.status.name.toLowerCase();
    return status === 'done' || status === 'closed' || status === 'resolved';
  });

  const totalPoints = completedIssues.reduce((sum, issue) => {
    return sum + getStoryPoints(issue);
  }, 0);

  return totalPoints;
}

// Calculate velocity for a specific assignee
export function calculateAssigneeVelocity(issues: JiraIssue[], accountId: string): number {
  const assigneeIssues = issues.filter(issue => 
    issue.fields.assignee?.accountId === accountId
  );
  return calculateVelocity(assigneeIssues);
}

// Get last N closed sprints
export function getLastNClosedSprints(sprints: JiraSprint[], n: number): JiraSprint[] {
  const closedSprints = sprints.filter(s => s.state === 'closed');
  
  // Sort by completeDate descending (newest first)
  const sorted = closedSprints.sort((a, b) => {
    const dateA = a.completeDate ? new Date(a.completeDate).getTime() : 0;
    const dateB = b.completeDate ? new Date(b.completeDate).getTime() : 0;
    return dateB - dateA;
  });

  return sorted.slice(0, n);
}

// Filter sprints by date range
export function filterSprintsByDateRange(sprints: JiraSprint[], startDate: Date, endDate: Date): JiraSprint[] {
  return sprints.filter(sprint => {
    if (!sprint.completeDate) return false;
    
    const sprintDate = new Date(sprint.completeDate);
    return sprintDate >= startDate && sprintDate <= endDate;
  });
}
