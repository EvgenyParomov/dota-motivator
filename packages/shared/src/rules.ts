export type LotRule =
  | { type: 'daily-limit'; count: number }
  | { type: 'weekly-limit'; count: number }
  | { type: 'cooldown'; minutes: number }
  | { type: 'one-time' };

export type LotRuleType = LotRule['type'];

export const MAX_REWARD = 10;

export type RuleCheck =
  | { allowed: true }
  | { allowed: false; rule: LotRuleType; reason: string };

export const hasOneTime = (rules: readonly LotRule[]): boolean =>
  rules.some((r) => r.type === 'one-time');

export const hasDailyLimit = (rules: readonly LotRule[]): boolean =>
  rules.some((r) => r.type === 'daily-limit');

export const rulesHaveConflicts = (rules: readonly LotRule[]): boolean =>
  hasOneTime(rules) && hasDailyLimit(rules);

const startOfUtcDay = (d: Date): Date => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
};

const startOfUtcIsoWeek = (d: Date): Date => {
  const x = startOfUtcDay(d);
  const dow = x.getUTCDay() === 0 ? 7 : x.getUTCDay();
  x.setUTCDate(x.getUTCDate() - (dow - 1));
  return x;
};

const countSince = (history: readonly Date[], from: Date): number =>
  history.reduce((acc, d) => (d >= from ? acc + 1 : acc), 0);

const formatMinutes = (mins: number): string => {
  if (mins < 60) return `${mins} мин`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
};

export const checkRules = (
  rules: readonly LotRule[],
  history: readonly Date[],
  now: Date,
): RuleCheck => {
  for (const r of rules) {
    if (r.type === 'one-time') {
      if (history.length > 0) {
        return { allowed: false, rule: 'one-time', reason: 'уже выполнено' };
      }
    }
    if (r.type === 'daily-limit') {
      const done = countSince(history, startOfUtcDay(now));
      if (done >= r.count) {
        return {
          allowed: false,
          rule: 'daily-limit',
          reason: `уже выполнено сегодня (${done}/${r.count})`,
        };
      }
    }
    if (r.type === 'weekly-limit') {
      const done = countSince(history, startOfUtcIsoWeek(now));
      if (done >= r.count) {
        return {
          allowed: false,
          rule: 'weekly-limit',
          reason: `достигнут лимит за неделю (${done}/${r.count})`,
        };
      }
    }
    if (r.type === 'cooldown') {
      const last = history[history.length - 1];
      if (last) {
        const elapsedMin = (now.getTime() - last.getTime()) / 60_000;
        if (elapsedMin < r.minutes) {
          const remain = Math.ceil(r.minutes - elapsedMin);
          return {
            allowed: false,
            rule: 'cooldown',
            reason: `доступно через ${formatMinutes(remain)}`,
          };
        }
      }
    }
  }
  return { allowed: true };
};
