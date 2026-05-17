import { Archive, Check } from 'lucide-react';
import { Button } from '@/shared/ui/button';

type Props = {
  canExecute: boolean;
  executing: boolean;
  archiving: boolean;
  onExecute: () => void;
  onArchive: () => void;
};

export const LotActions = ({ canExecute, executing, archiving, onExecute, onArchive }: Props) => (
  <div className="flex gap-2">
    <Button
      className="flex-1"
      size="sm"
      onClick={onExecute}
      disabled={!canExecute || executing}
    >
      <Check />
      {executing ? 'Засчитываю…' : 'Выполнить'}
    </Button>
    <Button
      size="sm"
      variant="outline"
      onClick={onArchive}
      disabled={archiving}
      aria-label="Архивировать"
    >
      <Archive />
    </Button>
  </div>
);
