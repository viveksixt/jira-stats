// JQL Query Builders

export function buildSprintJQL(sprintId: string | number, projectKey?: string): string {
  let jql = `Sprint = ${sprintId}`;
  
  if (projectKey) {
    jql += ` AND project = "${projectKey}"`;
  }
  
  return jql;
}

export function buildComponentJQL(
  sprintId: string | number,
  componentName: string,
  projectKey?: string
): string {
  let jql = `Sprint = ${sprintId} AND component = "${componentName}"`;
  
  if (projectKey) {
    jql += ` AND project = "${projectKey}"`;
  }
  
  return jql;
}

export function buildDateRangeJQL(
  startDate: Date,
  endDate: Date,
  projectKey?: string
): string {
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  
  let jql = `created >= "${start}" AND created <= "${end}"`;
  
  if (projectKey) {
    jql += ` AND project = "${projectKey}"`;
  }
  
  return jql;
}

export function buildCompletedIssuesJQL(
  sprintId: string | number,
  projectKey?: string
): string {
  let jql = `Sprint = ${sprintId} AND status in (Done, Closed, Resolved)`;
  
  if (projectKey) {
    jql += ` AND project = "${projectKey}"`;
  }
  
  return jql;
}
