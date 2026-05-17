import type { SphereCount } from '@dm/shared';
import { getSphereLabel } from '@dm/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';

type Props = { data: SphereCount[] };

export const SphereWheel = ({ data }: Props) => {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Колесо баланса</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.map((d) => (
          <div key={d.sphere} className="flex items-center gap-3">
            <span className="text-sm w-40 shrink-0">{getSphereLabel(d.sphere)}</span>
            <Progress value={(d.count / max) * 100} className="flex-1" />
            <span className="text-muted-foreground w-8 text-right text-sm tabular-nums">
              {d.count}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
