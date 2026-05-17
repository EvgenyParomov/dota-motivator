import type { ReactNode } from 'react';

type Props = {
  sidebar: ReactNode;
  children: ReactNode;
  overlay?: ReactNode;
};

export const AppShell = ({ sidebar, children, overlay }: Props) => (
  <div className="flex h-full min-h-screen bg-background text-foreground">
    <aside className="bg-sidebar border-sidebar-border w-64 shrink-0 border-r">
      {sidebar}
    </aside>
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-8 py-8">{children}</div>
    </main>
    {overlay}
  </div>
);
