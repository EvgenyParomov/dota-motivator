import { api } from '../../../shared/lib/api';

export type PlayDecision =
  | { allowed: true; balance: number; debtThreshold: number }
  | { allowed: false; reason: string; balance: number; debtThreshold: number };

export const fetchPlayDecision = (): Promise<PlayDecision> =>
  api<PlayDecision>('/match-events/play-decision');
