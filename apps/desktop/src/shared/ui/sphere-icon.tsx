import {
  Briefcase,
  Coins,
  GraduationCap,
  HeartPulse,
  Home,
  Palette,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Sphere } from '@dm/shared';
import { cn } from '@/shared/lib/utils';

const sphereIcons: Record<Sphere, LucideIcon> = {
  health: HeartPulse,
  career: Briefcase,
  finance: Coins,
  family: Home,
  friends: Users,
  growth: GraduationCap,
  leisure: Palette,
  inner: Sparkles,
};

type Props = {
  sphere: Sphere;
  className?: string;
};

export const SphereIcon = ({ sphere, className }: Props) => {
  const Icon = sphereIcons[sphere];
  return <Icon className={cn('size-4', className)} aria-hidden />;
};
