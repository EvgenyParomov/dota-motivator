export type BlockDecision =
  | { kind: 'allow' }
  | { kind: 'block'; reason: string };

export const decide = (allowed: boolean, reason: string): BlockDecision =>
  allowed ? { kind: 'allow' } : { kind: 'block', reason };

export const formatBlockReason = (balance: number, debtThreshold: number): string =>
  `Баланс ${balance}, порог ${debtThreshold}. Сначала выполни лот.`;
