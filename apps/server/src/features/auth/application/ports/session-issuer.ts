import type { UserId } from '@dm/shared';
import type { IssuedSession } from '../../domain/session.js';

export abstract class SessionIssuer {
  abstract issue(userId: UserId): Promise<IssuedSession>;
  abstract revoke(token: string): Promise<void>;
}
