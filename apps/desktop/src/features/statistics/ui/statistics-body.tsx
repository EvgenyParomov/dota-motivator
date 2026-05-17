import type { ReactNode } from 'react';

type Props = {
  sphereWheel: ReactNode;
  topLots: ReactNode;
  orphans: ReactNode;
};

export const StatisticsBody = ({ sphereWheel, topLots, orphans }: Props) => (
  <div className="grid gap-4 lg:grid-cols-2">
    <div className="lg:col-span-2">{sphereWheel}</div>
    {topLots}
    {orphans}
  </div>
);
