import { SPHERES, type Sphere, getSphereLabel } from '@dm/shared';
import { Button } from '@/shared/ui/button';
import { SphereIcon } from '@/shared/ui/sphere-icon';

export type SphereFilter = Sphere | 'all';

type Props = {
  value: SphereFilter;
  onChange: (value: SphereFilter) => void;
};

export const LotsFilter = ({ value, onChange }: Props) => (
  <div className="flex flex-wrap gap-2">
    <Button
      size="sm"
      variant={value === 'all' ? 'default' : 'outline'}
      onClick={() => onChange('all')}
    >
      Все
    </Button>
    {SPHERES.map((s) => (
      <Button
        key={s}
        size="sm"
        variant={value === s ? 'default' : 'outline'}
        onClick={() => onChange(s)}
        title={getSphereLabel(s)}
      >
        <SphereIcon sphere={s} />
        <span className="hidden sm:inline">{getSphereLabel(s)}</span>
      </Button>
    ))}
  </div>
);
