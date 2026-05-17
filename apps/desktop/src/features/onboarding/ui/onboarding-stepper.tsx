import { Check } from 'lucide-react';
import type { OnboardingStep } from '../domain/steps';
import { cn } from '@/shared/lib/utils';

const stepOrder: OnboardingStep[] = ['profile', 'balance', 'lots', 'gsi'];

const labels: Record<OnboardingStep, string> = {
  profile: 'Порог долга',
  balance: 'Стартовый баланс',
  lots: 'Первый лот',
  gsi: 'GSI Dota',
  complete: 'Готово',
};

type Props = { current: OnboardingStep };

export const OnboardingStepper = ({ current }: Props) => {
  const currentIdx = stepOrder.indexOf(current);
  return (
    <ol className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      {stepOrder.map((s, idx) => {
        const done = currentIdx > idx || current === 'complete';
        const active = currentIdx === idx;
        return (
          <li key={s} className="flex items-center gap-2">
            <span
              className={cn(
                'flex size-7 items-center justify-center rounded-full border text-xs font-semibold',
                done
                  ? 'bg-success text-success-foreground border-success'
                  : active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground',
              )}
            >
              {done ? <Check className="size-4" /> : idx + 1}
            </span>
            <span
              className={cn(
                'text-sm',
                active ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}
            >
              {labels[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
};
