import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type Props = {
  title: string;
  items: ReactNode;
  footer?: ReactNode;
};

export const SidebarNav = ({ title, items, footer }: Props) => (
  <div className="flex h-full flex-col gap-2 p-4">
    <div className="text-sidebar-foreground mb-2 flex items-center gap-2 px-2 py-1">
      <Gamepad2 className="text-sidebar-primary size-5" />
      <span className="text-base font-semibold tracking-tight">{title}</span>
    </div>
    <nav className="flex flex-1 flex-col gap-1">{items}</nav>
    {footer ? (
      <div className="border-sidebar-border mt-auto border-t pt-3">{footer}</div>
    ) : null}
  </div>
);

type ItemProps = {
  to: string;
  icon: ReactNode;
  label: ReactNode;
};

export const SidebarNavItem = ({ to, icon, label }: ItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
      )
    }
    end={to === '/'}
  >
    <span className="size-4 shrink-0">{icon}</span>
    <span>{label}</span>
  </NavLink>
);
