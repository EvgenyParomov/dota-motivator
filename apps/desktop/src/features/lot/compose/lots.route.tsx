import { PageLoader } from '@/shared/ui/page-loader';
import { useLots } from '../model/use-lots';
import { LotsLayout } from '../ui/lots-layout';
import { LotsList } from '../ui/lots-list';
import { LotRowCompose } from './lot-row.compose';

export const LotsRoute = () => {
  const { data, isPending } = useLots();
  return (
    <LotsLayout
      list={
        isPending ? (
          <PageLoader />
        ) : (
          <LotsList
            lots={data ?? []}
            renderLot={(lot) => <LotRowCompose key={lot.id} lot={lot} />}
          />
        )
      }
    />
  );
};
