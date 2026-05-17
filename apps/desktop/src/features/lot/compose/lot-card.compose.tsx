import { LotCard } from '../ui/lot-card';
import { LotActions } from '../ui/lot-actions';
import { useArchiveLot, useExecuteLot, type LotView } from '../model/use-lots';

type Props = { lot: LotView };

export const LotCardCompose = ({ lot }: Props) => {
  const execute = useExecuteLot();
  const archive = useArchiveLot();
  const ruleReason = lot.canExecuteNow.allowed ? null : lot.canExecuteNow.reason;
  return (
    <LotCard
      name={lot.name}
      sphere={lot.sphere}
      reward={lot.reward}
      iconUrl={lot.iconUrl}
      ruleReason={ruleReason}
      slots={{
        action: (
          <LotActions
            canExecute={lot.canExecuteNow.allowed}
            executing={execute.isPending}
            archiving={archive.isPending}
            onExecute={() => execute.mutate(lot.id)}
            onArchive={() => archive.mutate(lot.id)}
          />
        ),
      }}
    />
  );
};
