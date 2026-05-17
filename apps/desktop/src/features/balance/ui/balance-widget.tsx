import { Wallet } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { useBalance } from '../model/use-balance';
import { balanceStatusLabel, getBalanceStatus, type BalanceStatus } from '../domain/status';

const statusVariant: Record<BalanceStatus, 'default' | 'secondary' | 'destructive'> = {
  ok: 'secondary',
  debt: 'default',
  blocked: 'destructive',
};

export const BalanceWidget = () => {
  const { data, isPending } = useBalance();
  if (isPending) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">Загружаю баланс…</p>
        </CardContent>
      </Card>
    );
  }
  if (!data) {
    return (
      <Card>
        <CardContent>
          <p className="text-destructive text-sm">Баланс недоступен.</p>
        </CardContent>
      </Card>
    );
  }
  const status = getBalanceStatus(data.balance, data.debtThreshold);
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md">
            <Wallet className="size-5" />
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide">Баланс</div>
            <div
              className={
                'text-3xl font-semibold tabular-nums ' +
                (data.balance < 0 ? 'text-destructive' : 'text-foreground')
              }
            >
              {data.balance}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-muted-foreground text-xs uppercase tracking-wide">
            Порог долга
          </div>
          <div className="text-base font-medium tabular-nums">{data.debtThreshold}</div>
          <Badge variant={statusVariant[status]}>{balanceStatusLabel(status)}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};
