import { Navigate } from 'react-router-dom';
import { CardGrid, EmptyState } from '@/shared/ui/card-grid';
import { PageLoader } from '@/shared/ui/page-loader';
import { useBalanceWidget } from '../../../shared/ports/balance-widget';
import { useProfile } from '../../profile/model/use-profile';
import { useLots } from '../../lot/model/use-lots';
import { LotCardCompose } from '../../lot/compose/lot-card.compose';
import { useRecentEvents } from '../model/use-recent-events';
import { DashboardLayout } from '../ui/dashboard-layout';
import { RecentEventsList } from '../ui/recent-events-list';
import { ManualMatchButton } from '../../match-tracking/ui/manual-match-button';

export const DashboardRoute = () => {
  const { Widget } = useBalanceWidget();
  const profile = useProfile();
  const lots = useLots();
  const recent = useRecentEvents();

  if (profile.isPending) return <PageLoader />;
  if (profile.data && !profile.data.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <DashboardLayout
      balance={<Widget />}
      actions={<ManualMatchButton />}
      quickLots={
        lots.data && lots.data.length === 0 ? (
          <EmptyState>Нет активных лотов.</EmptyState>
        ) : (
          <CardGrid>
            {lots.data?.map((lot) => <LotCardCompose key={lot.id} lot={lot} />)}
          </CardGrid>
        )
      }
      recent={<RecentEventsList events={recent.data ?? []} />}
    />
  );
};
