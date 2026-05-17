import type { ReactNode } from 'react';
import type { StatPeriod } from '@dm/shared';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

type Props = {
  period: StatPeriod;
  onPeriodChange: (p: StatPeriod) => void;
  body: ReactNode;
};

const periodLabels: Record<StatPeriod, string> = {
  week: 'Неделя',
  month: 'Месяц',
  all: 'Всё время',
};

export const StatisticsLayout = ({ period, onPeriodChange, body }: Props) => (
  <div className="flex flex-col gap-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Статистика</h1>
        <p className="text-muted-foreground text-sm">
          Колесо баланса, топ-лоты и сферы без активности.
        </p>
      </div>
      <Tabs value={period} onValueChange={(v) => onPeriodChange(v as StatPeriod)}>
        <TabsList>
          {(['week', 'month', 'all'] as const).map((p) => (
            <TabsTrigger key={p} value={p}>
              {periodLabels[p]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </header>
    {body}
  </div>
);
