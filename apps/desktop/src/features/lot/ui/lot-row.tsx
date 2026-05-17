import type { ReactNode } from 'react';
import type { Sphere } from '@dm/shared';
import { getSphereLabel } from '@dm/shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { SphereIcon } from '@/shared/ui/sphere-icon';

type Props = {
  name: string;
  sphere: Sphere;
  reward: number;
  iconUrl: string | null;
  ruleReason: string | null;
  slots?: { action?: ReactNode };
};

export const LotRow = ({ name, sphere, reward, iconUrl, ruleReason, slots }: Props) => (
  <div className="bg-card hover:bg-accent/30 border-border flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors">
    <Avatar className="size-12 shrink-0 rounded-lg">
      {iconUrl ? <AvatarImage src={iconUrl} alt="" /> : null}
      <AvatarFallback className="bg-primary/10 text-primary rounded-lg">
        <SphereIcon sphere={sphere} className="size-6" />
      </AvatarFallback>
    </Avatar>
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div
        className="line-clamp-2 text-base font-medium leading-snug break-words"
        title={name}
      >
        {name}
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
        <span>{getSphereLabel(sphere)}</span>
        {ruleReason ? (
          <Badge variant="destructive" className="text-[10px]">
            {ruleReason}
          </Badge>
        ) : null}
      </div>
    </div>
    <div className="text-primary shrink-0 text-xl font-semibold tabular-nums">
      +{reward}
    </div>
    {slots?.action ? <div className="shrink-0">{slots.action}</div> : null}
  </div>
);
