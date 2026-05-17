import { inject, injectable } from 'inversify';
import { Clock } from '../../../../shared/application/ports/clock.js';
import { IdGenerator } from '../../../../shared/application/ports/id-generator.js';
import { EnvToken } from '../../../../app/tokens.js';
import type { AppEnv } from '../../../../shared/lib/env.js';
import { AuthStateStore } from '../ports/auth-state-store.js';
import { buildSteamLoginUrl } from '../../domain/openid.js';
import { isAllowedClientCallback } from '../../domain/client-callback.js';
import { InvalidClientCallbackError } from '../../domain/errors.js';

const STATE_TTL_MS = 10 * 60 * 1000;

@injectable()
export class StartSteamLoginUseCase {
  constructor(
    @inject(EnvToken) private readonly env: AppEnv,
    @inject(Clock) private readonly clock: Clock,
    @inject(IdGenerator) private readonly ids: IdGenerator,
    @inject(AuthStateStore) private readonly states: AuthStateStore,
  ) {}

  async execute(clientCallback: string): Promise<{ redirectUrl: string }> {
    if (!isAllowedClientCallback(clientCallback, this.env.CLIENT_CALLBACK_ALLOWLIST)) {
      throw new InvalidClientCallbackError();
    }
    const state = this.ids.generate();
    const now = this.clock.now();
    await this.states.save({
      state,
      clientCallback,
      expiresAt: new Date(now.getTime() + STATE_TTL_MS),
    });
    const redirectUrl = buildSteamLoginUrl({
      realm: this.env.STEAM_OPENID_REALM,
      returnTo: `${this.env.STEAM_OPENID_REALM}/auth/steam/callback`,
      state,
    });
    return { redirectUrl };
  }
}
