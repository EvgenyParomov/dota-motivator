import { Card, CardContent } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';
import type { BalanceEvent } from '../model/use-recent-events';

const CAUSE_LABELS: Record<string, string> = {
  'initial-deposit': 'стартовый баланс',
  'lot-execution': 'выполнен лот',
  match: 'сыграна катка',
};

const labelFor = (e: BalanceEvent): string => {
  if (e.causeKind === 'lot-execution' && e.lotName) {
    return `выполнен лот: ${e.lotName}`;
  }
  return CAUSE_LABELS[e.causeKind] ?? e.description;
};

const TIME_FMT = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const DATE_FMT = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const formatWhen = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return sameDay ? TIME_FMT.format(d) : DATE_FMT.format(d);
};

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
            className="flex items-center justify-between gap-3 border-b border-border/50 py-2 last:border-0"
          >
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm">{labelFor(e)}</span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {formatWhen(e.createdAt)}
              </span>
            </div>
            <span
              className={cn(
                'shrink-0 text-sm font-medium tabular-nums',
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
