import type { OrphanSphere } from '@dm/shared';
import { getSphereLabel } from '@dm/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export const OrphansList = ({ data }: { data: OrphanSphere[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Сферы без активности</CardTitle>
    </CardHeader>
    <CardContent>
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm">Все сферы получают внимание.</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {data.map((s) => (
            <li key={s.sphere} className="flex items-center justify-between py-2 text-sm">
              <span>{getSphereLabel(s.sphere)}</span>
              <span className="text-muted-foreground tabular-nums">
                {s.daysWithoutActivity >= 9999 ? 'никогда' : `${s.daysWithoutActivity} дн.`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);
