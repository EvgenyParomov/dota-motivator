import { MAX_REWARD, rulesHaveConflicts, type LotRule } from '@dm/shared';
import { parseSphere } from '@dm/shared';
import { ValidationError } from '../../../shared/lib/errors.js';

export type NewLotInput = {
  name: string;
  sphere: string;
  reward: number;
  rules: LotRule[];
  iconMediaKey?: string | null;
};

export type LotDraft = {
  name: string;
  sphere: string;
  reward: number;
  rules: LotRule[];
  iconMediaKey: string | null;
};

export const validateAndNormalize = (input: NewLotInput): LotDraft => {
  const name = input.name?.trim() ?? '';
  if (!name) throw new ValidationError('name is required');

  if (!parseSphere(input.sphere)) throw new ValidationError('sphere is invalid');

  if (typeof input.reward !== 'number' || Number.isNaN(input.reward)) {
    throw new ValidationError('reward must be a number');
  }
  if (input.reward <= 0) throw new ValidationError('reward must be positive');
  if (input.reward > MAX_REWARD) throw new ValidationError(`reward must be <= ${MAX_REWARD}`);

  validateRules(input.rules ?? []);

  return {
    name,
    sphere: input.sphere,
    reward: input.reward,
    rules: input.rules ?? [],
    iconMediaKey: input.iconMediaKey ?? null,
  };
};

export const validateRules = (rules: readonly LotRule[]): void => {
  for (const r of rules) {
    if (r.type === 'daily-limit' || r.type === 'weekly-limit') {
      if (!Number.isInteger(r.count) || r.count <= 0) {
        throw new ValidationError(`${r.type}.count must be positive integer`);
      }
    }
    if (r.type === 'cooldown') {
      if (!Number.isFinite(r.minutes) || r.minutes < 0) {
        throw new ValidationError('cooldown.minutes must be non-negative');
      }
    }
  }
  if (rulesHaveConflicts(rules)) {
    throw new ValidationError('one-time conflicts with daily-limit');
  }
};
