import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { DbToken } from '../../../../app/tokens.js';
import { IdGenerator } from '../../../../shared/application/ports/id-generator.js';
import { Clock } from '../../../../shared/application/ports/clock.js';
import type { Db } from '../../../../shared/adapters/db/connection.js';
import { sessions } from '../../../../shared/adapters/db/schema/index.js';
import { SessionIssuer } from '../ports/session-issuer.js';
import type { IssuedSession } from '../../domain/session.js';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const buildToken = (): string => randomBytes(32).toString('hex');

@injectable()
export class SessionIssuerService extends SessionIssuer {
  constructor(
    @inject(DbToken) private readonly db: Db,
    @inject(IdGenerator) private readonly ids: IdGenerator,
    @inject(Clock) private readonly clock: Clock,
  ) {
    super();
  }

  override async issue(userId: UserId): Promise<IssuedSession> {
    const now = this.clock.now();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    const token = buildToken();
    await this.db.insert(sessions).values({
      id: this.ids.generate(),
      token,
      userId,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });
    return { token, expiresAt };
  }

  override async revoke(token: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.token, token));
  }
}
