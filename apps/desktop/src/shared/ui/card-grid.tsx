import type { ReactNode } from 'react';
import { Card, CardContent } from '@/shared/ui/card';

export const CardGrid = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">{children}</div>
);

export const EmptyState = ({ children }: { children: ReactNode }) => (
  <Card>
    <CardContent>
      <p className="text-muted-foreground text-sm">{children}</p>
    </CardContent>
  </Card>
);
