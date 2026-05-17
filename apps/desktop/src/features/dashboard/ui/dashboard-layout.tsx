import type { ReactNode } from 'react';

type Props = {
  balance: ReactNode;
  quickLotsTitle?: string;
  quickLots: ReactNode;
  recentTitle?: string;
  recent: ReactNode;
};

export const DashboardLayout = ({
  balance,
  quickLotsTitle = 'Быстрое выполнение',
  quickLots,
  recentTitle = 'Последние события',
  recent,
}: Props) => (
  <div className="flex flex-col gap-6">
    <header>
      <h1 className="text-2xl font-semibold tracking-tight">Главная</h1>
      <p className="text-muted-foreground text-sm">
        Управляй балансом и выполняй лоты, чтобы оставаться в плюсе.
      </p>
    </header>
    {balance}
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{quickLotsTitle}</h2>
      {quickLots}
    </section>
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{recentTitle}</h2>
      {recent}
    </section>
  </div>
);
