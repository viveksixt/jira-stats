'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { JiraIssue } from '@/types/jira';
import { getStoryPoints } from '@/lib/metrics/velocity';

interface ChartDetailsModalProps {
  isOpen: boolean;
  title: string;
  issues: JiraIssue[];
  onClose: () => void;
  techLabels?: string[];
  showAge?: boolean;
}

function calculateAge(issue: JiraIssue): number | null {
  if (!issue.fields.created) return null;
  const created = new Date(issue.fields.created);
  if (Number.isNaN(created.getTime())) return null;
  // For resolved issues, age is measured at resolution time so the number stays stable.
  // For open issues, measure against today.
  const end = issue.fields.resolutiondate
    ? new Date(issue.fields.resolutiondate)
    : new Date();
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil(Math.abs(end.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

function isTechIssue(issue: JiraIssue, techLabels?: string[]): boolean {
  if (!techLabels || techLabels.length === 0) {
    // Default tech labels
    const defaultTechLabels = ['tech', 'tech-debt', 'tech_debt', 'technical'];
    return issue.fields.labels?.some(label => 
      defaultTechLabels.some(tech => label.toLowerCase().includes(tech.toLowerCase()))
    ) || false;
  }
  
  return issue.fields.labels?.some(label => 
    techLabels.some(tech => label.toLowerCase().includes(tech.toLowerCase()))
  ) || false;
}

type SortField = 'key' | 'type' | 'summary' | 'status' | 'assignee' | 'storyPoints' | 'age';
type SortDirection = 'asc' | 'desc';

export function ChartDetailsModal({ 
  isOpen, 
  title, 
  issues, 
  onClose, 
  techLabels,
  showAge = false 
}: ChartDetailsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('key');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const itemsPerPage = 20;

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const filteredIssues = issues.filter(issue =>
    issue.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.fields.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.fields.labels?.some(label => label.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedIssues = [...filteredIssues].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortField) {
      case 'key':
        compareValue = a.key.localeCompare(b.key);
        break;
      case 'type':
        compareValue = a.fields.issuetype.name.localeCompare(b.fields.issuetype.name);
        break;
      case 'summary':
        compareValue = a.fields.summary.localeCompare(b.fields.summary);
        break;
      case 'status':
        compareValue = a.fields.status.name.localeCompare(b.fields.status.name);
        break;
      case 'assignee':
        const aAssignee = a.fields.assignee?.displayName || 'Unassigned';
        const bAssignee = b.fields.assignee?.displayName || 'Unassigned';
        compareValue = aAssignee.localeCompare(bAssignee);
        break;
      case 'storyPoints':
        compareValue = getStoryPoints(a) - getStoryPoints(b);
        break;
      case 'age':
        compareValue = (calculateAge(a) ?? -1) - (calculateAge(b) ?? -1);
        break;
    }
    
    return sortDirection === 'asc' ? compareValue : -compareValue;
  });

  const totalPages = Math.ceil(sortedIssues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIssues = sortedIssues.slice(startIndex, startIndex + itemsPerPage);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 pointer-events-auto" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-background border rounded-lg shadow-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex flex-col z-50 pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Search */}
        <div className="border-b px-6 py-4">
          <input
            type="text"
            placeholder="Search by key, summary, or labels..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {filteredIssues.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No issues found
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th 
                    className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted select-none"
                    onClick={() => handleSort('key')}
                  >
                    <div className="flex items-center gap-1">
                      Key
                      {sortField === 'key' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted select-none"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      {sortField === 'type' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted select-none"
                    onClick={() => handleSort('summary')}
                  >
                    <div className="flex items-center gap-1">
                      Summary
                      {sortField === 'summary' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortField === 'status' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted select-none"
                    onClick={() => handleSort('assignee')}
                  >
                    <div className="flex items-center gap-1">
                      Assignee
                      {sortField === 'assignee' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-left p-3 text-sm font-medium">Labels</th>
                  <th 
                    className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted select-none"
                    onClick={() => handleSort('storyPoints')}
                  >
                    <div className="flex items-center gap-1">
                      Story Points
                      {sortField === 'storyPoints' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  {showAge && (
                    <th 
                      className="text-left p-3 text-sm font-medium cursor-pointer hover:bg-muted select-none"
                      onClick={() => handleSort('age')}
                    >
                      <div className="flex items-center gap-1">
                        Age (days)
                        {sortField === 'age' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedIssues.map((issue) => {
                  const isTech = isTechIssue(issue, techLabels);
                  const storyPoints = getStoryPoints(issue);
                  const hasDefaultedPoints = storyPoints === 3 && !issue.fields.customfield_10039 && !issue.fields.customfield_10016;
                  
                  return (
                    <tr 
                      key={issue.id} 
                      className={`hover:bg-accent/50 transition-colors ${isTech ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
                    >
                      <td className="p-3">
                        <a
                          href={`https://sixt-cloud.atlassian.net/browse/${issue.key}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm font-bold text-blue-600 hover:underline"
                        >
                          {issue.key}
                        </a>
                      </td>
                      <td className="p-3">
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {issue.fields.issuetype.name}
                        </span>
                      </td>
                      <td className="p-3 text-sm max-w-md truncate">
                        {issue.fields.summary}
                      </td>
                      <td className="p-3">
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {issue.fields.status.name}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        {issue.fields.assignee?.displayName || 'Unassigned'}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {issue.fields.labels && issue.fields.labels.length > 0 ? (
                            issue.fields.labels.map((label, idx) => (
                              <span 
                                key={idx} 
                                className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded"
                              >
                                {label}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        {storyPoints}
                        {hasDefaultedPoints && <span className="text-xs text-muted-foreground">*</span>}
                      </td>
                      {showAge && (
                        <td className="p-3 text-sm">
                          {calculateAge(issue) ?? '—'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="border-t p-4 bg-muted/50 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredIssues.length)} of {filteredIssues.length} issues
            {issues.some(issue => {
              const sp = getStoryPoints(issue);
              return sp === 3 && !issue.fields.customfield_10039 && !issue.fields.customfield_10016;
            }) && (
              <span className="ml-2">
                * Defaulted to 3 story points (no value in Jira)
              </span>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
