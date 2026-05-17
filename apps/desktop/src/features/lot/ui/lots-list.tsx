import { useState, type ReactNode } from 'react';
import { EmptyState } from '@/shared/ui/card-grid';
import type { LotView } from '../model/use-lots';
import { LotsFilter, type SphereFilter } from './lots-filter';

type Props = {
  lots: LotView[];
  renderLot: (lot: LotView) => ReactNode;
  emptyMessage?: string;
};

export const LotsList = ({
  lots,
  renderLot,
  emptyMessage = 'Ещё нет лотов — создай первый.',
}: Props) => {
  const [filter, setFilter] = useState<SphereFilter>('all');
  const filtered = filter === 'all' ? lots : lots.filter((l) => l.sphere === filter);

  if (lots.length === 0) return <EmptyState>{emptyMessage}</EmptyState>;

  return (
    <div className="flex flex-col gap-4">
      <LotsFilter value={filter} onChange={setFilter} />
      {filtered.length === 0 ? (
        <EmptyState>Нет лотов в этой сфере.</EmptyState>
      ) : (
        <div className="flex flex-col gap-2">{filtered.map(renderLot)}</div>
      )}
    </div>
  );
};
