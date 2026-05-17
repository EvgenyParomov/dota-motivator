import type { TopLotEntry } from '@dm/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export const TopLotsList = ({ data }: { data: TopLotEntry[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Топ-лоты</CardTitle>
    </CardHeader>
    <CardContent>
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm">Нет данных за период.</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {data.map((e) => (
            <li key={e.lotId} className="flex items-center justify-between py-2 text-sm">
              <span>{e.name}</span>
              <span className="text-muted-foreground tabular-nums">{e.count}</span>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);
