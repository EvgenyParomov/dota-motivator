import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { MatchEventsRepository } from '../ports/match-events-repository.js';
import { BalanceMutator } from '../../../../shared/application/ports/balance-mutator.js';
import { Clock } from '../../../../shared/application/ports/clock.js';
import { IdGenerator } from '../../../../shared/application/ports/id-generator.js';
import { isCountableLobby, parseGsiMatchEvent } from '../../domain/gsi.js';
import { ValidationError } from '../../../../shared/lib/errors.js';

export type ReportInput = {
  matchId?: string;
  phase?: string;
  lobbyType?: string;
  startedAt?: string;
  endedAt?: string;
};

export type ReportResult = {
  matchEventId: string | null;
  counted: boolean;
  duplicate: boolean;
};

@injectable()
export class ReportMatchEndUseCase {
  constructor(
    @inject(MatchEventsRepository) private readonly repo: MatchEventsRepository,
    @inject(BalanceMutator) private readonly balance: BalanceMutator,
    @inject(Clock) private readonly clock: Clock,
    @inject(IdGenerator) private readonly ids: IdGenerator,
  ) {}

  async execute(userId: UserId, input: ReportInput): Promise<ReportResult> {
    const event = parseGsiMatchEvent(input);
    if (event.phase !== 'post_game') {
      throw new ValidationError('only post_game events are accepted');
    }
    const counted = isCountableLobby(event.lobbyType);
    const id = this.ids.generate();
    const created = await this.repo.createIfMissing({
      id,
      userId,
      matchId: event.matchId,
      lobbyType: event.lobbyType,
      startedAt: event.startedAt ?? null,
      endedAt: event.endedAt ?? this.clock.now(),
      counted,
    });
    if (!created) {
      return { matchEventId: null, counted: false, duplicate: true };
    }
    if (counted) {
      await this.balance.debit(userId, 1, { kind: 'match', id: created.id });
    }
    return { matchEventId: created.id, counted, duplicate: false };
  }
}
