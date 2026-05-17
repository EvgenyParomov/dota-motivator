import { Card, CardContent } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';
import type { BalanceEvent } from '../model/use-recent-events';

type Props = {
  events: BalanceEvent[];
  emptyMessage?: string;
};

export const RecentEventsList = ({ events, emptyMessage = 'События пока пустые.' }: Props) => {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        {events.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between border-b border-border/50 py-2 last:border-0"
          >
            <span className="text-sm">{e.description}</span>
            <span
              className={cn(
                'text-sm font-medium tabular-nums',
                e.type === 'credit' ? 'text-success' : 'text-destructive',
              )}
            >
              {e.type === 'credit' ? '+' : ''}
              {e.delta}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
