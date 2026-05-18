import { Outlet } from 'react-router-dom';
import { Home, ListChecks, BarChart3 } from 'lucide-react';
import { AppShell } from '@/shared/ui/app-shell';
import { SidebarNav, SidebarNavItem } from '@/shared/ui/sidebar-nav';
import { BlockOrchestrator } from '../features/block/compose/block-orchestrator';
import { UserMenuCompose } from '../features/auth/compose/user-menu.compose';
import { TrackingStatusBadge } from '../features/tracking-status/ui/tracking-status-badge';
import { UpdateBanner } from '../features/updater/ui/update-banner';

const navItems = (
  <>
    <SidebarNavItem to="/dashboard" icon={<Home className="size-4" />} label="Главная" />
    <SidebarNavItem to="/lots" icon={<ListChecks className="size-4" />} label="Лоты" />
    <SidebarNavItem to="/statistics" icon={<BarChart3 className="size-4" />} label="Статистика" />
  </>
);

export const Layout = () => (
  <AppShell
    sidebar={
      <SidebarNav title="Dota Motivator" items={navItems} footer={<UserMenuCompose />} />
    }
    overlay={
      <>
        <TrackingStatusBadge />
        <UpdateBanner />
        <BlockOrchestrator />
      </>
    }
  >
    <Outlet />
  </AppShell>
);
