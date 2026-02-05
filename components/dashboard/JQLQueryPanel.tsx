'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { showError, showLoading } from '@/lib/toast';
import { toast } from 'sonner';

interface JQLQueryPanelProps {
  onExecute: (jql: string) => Promise<void>;
  isLoading?: boolean;
}

const EXAMPLE_QUERIES = [
  'project = RBW AND Sprint in closedSprints() ORDER BY created DESC',
  'project = RBW AND resolved >= -30d',
  'project = RBW AND status changed to Done AFTER -14d',
  'project in (RBW, OTHER) AND Sprint is not EMPTY',
];

export function JQLQueryPanel({ onExecute, isLoading = false }: JQLQueryPanelProps) {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const handleExecute = async () => {
    if (!query.trim()) {
      showError('Please enter a JQL query');
      return;
    }

    try {
      await onExecute(query);
      if (!history.includes(query)) {
        setHistory([query, ...history.slice(0, 9)]);
      }
    } catch (error) {
      console.error('Query execution failed:', error);
    }
  };

  const handleUseExample = (example: string) => {
    setQuery(example);
    setShowExamples(false);
  };

  return (
    <div className="space-y-4 w-full">
      <Label>JQL Query:</Label>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter JQL query (e.g., project = RBW AND Sprint in closedSprints())"
        className="w-full h-24 p-3 border border-input rounded-md bg-background text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />
      
      <div className="flex gap-2 flex-wrap">
        <Button onClick={handleExecute} disabled={isLoading || !query.trim()}>
          {isLoading ? 'Executing...' : 'Execute Query'}
        </Button>
        
        <Button variant="outline" onClick={() => setShowExamples(!showExamples)}>
          Examples
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
          disabled={history.length === 0}
        >
          History ({history.length})
        </Button>
      </div>

      {showExamples && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-2">Example Queries:</p>
            <div className="space-y-2">
              {EXAMPLE_QUERIES.map((example, i) => (
                <button
                  key={i}
                  onClick={() => handleUseExample(example)}
                  className="w-full text-left text-xs p-2 bg-secondary hover:bg-secondary/80 rounded transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showHistory && history.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-2">Query History:</p>
            <div className="space-y-2">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(h);
                    setShowHistory(false);
                  }}
                  className="w-full text-left text-xs p-2 bg-secondary hover:bg-secondary/80 rounded transition-colors truncate"
                  title={h}
                >
                  {h}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
