import { PageLoader } from '@/shared/ui/page-loader';
import { useStatisticsView } from '../model/use-statistics-view';
import { StatisticsLayout } from '../ui/statistics-layout';
import { StatisticsBody } from '../ui/statistics-body';
import { SphereWheel } from '../ui/sphere-wheel';
import { TopLotsList } from '../ui/top-lots';
import { OrphansList } from '../ui/orphans';

export const StatisticsRoute = () => {
  const { period, setPeriod, stats } = useStatisticsView();
  return (
    <StatisticsLayout
      period={period}
      onPeriodChange={setPeriod}
      body={
        stats.isPending ? (
          <PageLoader />
        ) : stats.data ? (
          <StatisticsBody
            sphereWheel={<SphereWheel data={stats.data.spheres} />}
            topLots={<TopLotsList data={stats.data.topLots} />}
            orphans={<OrphansList data={stats.data.orphans} />}
          />
        ) : null
      }
    />
  );
};
