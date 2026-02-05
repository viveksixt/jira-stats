import type { JiraIssue } from '@/types/jira';

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
