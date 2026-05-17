import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { MatchEventsRepository } from '../ports/match-events-repository.js';
import type { MatchEventEntity } from '../../domain/match-event.js';

@injectable()
export class ListMatchEventsUseCase {
  constructor(@inject(MatchEventsRepository) private readonly repo: MatchEventsRepository) {}

  async execute(userId: UserId): Promise<MatchEventEntity[]> {
    return this.repo.listForUser(userId);
  }
}
