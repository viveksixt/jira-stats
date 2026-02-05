'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AuthMethodCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  recommended?: boolean;
  onSelect: (id: string) => void;
}

export function AuthMethodCard({
  id,
  name,
  description,
  icon,
  recommended,
  onSelect,
}: AuthMethodCardProps) {
  return (
    <Card className="relative hover:border-primary transition-colors cursor-pointer">
      {recommended && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
          Recommended
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              {name}
            </CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>
          </div>
        </div>
        <div className="pt-4">
          <Button onClick={() => onSelect(id)} className="w-full">
            Select
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
