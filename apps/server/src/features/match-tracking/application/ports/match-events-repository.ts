import type { UserId } from '@dm/shared';
import type {
  CreateMatchEventInput,
  MatchEventEntity,
} from '../../domain/match-event.js';

export abstract class MatchEventsRepository {
  abstract createIfMissing(input: CreateMatchEventInput): Promise<MatchEventEntity | null>;
  abstract listForUser(userId: UserId): Promise<MatchEventEntity[]>;
}
