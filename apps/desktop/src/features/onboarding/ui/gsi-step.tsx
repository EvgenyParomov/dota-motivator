import { Check, RefreshCw, SkipForward } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import type { GsiCheckResult } from '../model/use-gsi-config';

type Props = {
  gsi: GsiCheckResult | null;
  checking: boolean;
  onRecheck: () => void;
  onSkip: () => void;
};

export const GsiStep = ({ gsi, checking, onRecheck, onSkip }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle>GSI-конфиг Dota</CardTitle>
      <CardDescription>
        Чтобы приложение знало, когда ты в игре, нужен конфиг Game State Integration.
      </CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      {gsi?.status === 'ok' ? (
        <p className="text-success flex items-center gap-2 text-sm">
          <Check className="size-4" />
          Файл уже на месте: <code className="text-xs">{gsi.path}</code>
        </p>
      ) : null}
      {gsi?.status === 'written' ? (
        <p className="text-success flex items-center gap-2 text-sm">
          <Check className="size-4" />
          Файл записан: <code className="text-xs">{gsi.path}</code>
        </p>
      ) : null}
      {gsi?.status === 'manual_required' ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            Не нашёл папку Dota. Положи файл вручную в:
          </p>
          <code className="bg-muted text-muted-foreground rounded-md p-2 text-xs break-all">
            ...Steam/steamapps/common/dota 2 beta/game/dota/cfg/gamestate_integration/
          </code>
          <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
            {gsi.content}
          </pre>
        </div>
      ) : null}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onRecheck} disabled={checking}>
          <RefreshCw className={checking ? 'animate-spin' : ''} />
          Проверить
        </Button>
        <Button variant="ghost" onClick={onSkip}>
          <SkipForward />
          Пропустить
        </Button>
      </div>
    </CardContent>
  </Card>
);
