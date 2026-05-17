import { Loader2 } from 'lucide-react';

type Props = { message?: string };

export const PageLoader = ({ message = 'Загрузка…' }: Props) => (
  <div className="bg-background text-muted-foreground flex min-h-screen items-center justify-center gap-3">
    <Loader2 className="size-5 animate-spin" />
    <span className="text-sm">{message}</span>
  </div>
);
