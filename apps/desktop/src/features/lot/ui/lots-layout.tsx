import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';

type Props = {
  list: ReactNode;
};

export const LotsLayout = ({ list }: Props) => (
  <div className="flex flex-col gap-6">
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Лоты</h1>
        <p className="text-muted-foreground text-sm">
          Список твоих лотов. Выполняй и получай «катки».
        </p>
      </div>
      <Button asChild>
        <Link to="/lots/new">
          <Plus />
          Создать лот
        </Link>
      </Button>
    </header>
    {list}
  </div>
);
