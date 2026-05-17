import type { ReactNode } from 'react';
import type { Sphere } from '@dm/shared';
import { getSphereLabel } from '@dm/shared';
import { Card, CardContent } from '@/shared/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { SphereIcon } from '@/shared/ui/sphere-icon';

type Props = {
  name: string;
  sphere: Sphere;
  reward: number;
  iconUrl: string | null;
  ruleReason: string | null;
  slots?: { action?: ReactNode; meta?: ReactNode };
};

export const LotCard = ({ name, sphere, reward, iconUrl, ruleReason, slots }: Props) => (
  <Card className="gap-3 py-4">
    <CardContent className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar className="size-10 shrink-0 rounded-md">
          {iconUrl ? <AvatarImage src={iconUrl} alt="" /> : null}
          <AvatarFallback className="bg-primary/10 text-primary rounded-md">
            <SphereIcon sphere={sphere} className="size-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div
            className="truncate text-sm font-semibold leading-tight"
            title={name}
          >
            {name}
          </div>
          <span className="bg-secondary text-secondary-foreground max-w-full truncate rounded-full px-2 py-0.5 text-xs font-medium">
            {getSphereLabel(sphere)}
          </span>
        </div>
        <div className="text-primary shrink-0 text-lg font-semibold tabular-nums">
          +{reward}
        </div>
      </div>
      {ruleReason ? (
        <p className="text-destructive text-xs leading-snug">{ruleReason}</p>
      ) : null}
      {slots?.meta}
      {slots?.action}
    </CardContent>
  </Card>
);
