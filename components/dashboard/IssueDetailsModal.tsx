'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { JiraIssue } from '@/types/jira';

interface IssueDetailsModalProps {
  isOpen: boolean;
  title: string;
  issues: JiraIssue[];
  onClose: () => void;
}

export function IssueDetailsModal({ isOpen, title, issues, onClose }: IssueDetailsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIssues = issues.filter(issue =>
    issue.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.fields.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-background border rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
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
            placeholder="Search issues by key or summary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            <div className="divide-y">
              {filteredIssues.map((issue) => (
                <div key={issue.id} className="p-4 hover:bg-accent transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-blue-600">
                          {issue.key}
                        </span>
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {issue.fields.issuetype.name}
                        </span>
                      </div>
                      <p className="text-sm text-foreground truncate">
                        {issue.fields.summary}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="bg-muted px-2 py-1 rounded">
                          {issue.fields.status.name}
                        </span>
                        {issue.fields.assignee && (
                          <span>{issue.fields.assignee.displayName}</span>
                        )}
                      </div>
                    </div>
                    {issue.fields.customfield_10016 && (
                      <div className="text-sm font-medium text-right">
                        {issue.fields.customfield_10016} pts
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-muted/50 text-sm text-muted-foreground">
          Showing {filteredIssues.length} of {issues.length} issues
        </div>
      </div>
    </div>
  );
}
