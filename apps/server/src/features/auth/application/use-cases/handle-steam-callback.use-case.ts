import { inject, injectable } from 'inversify';
import { Clock } from '../../../../shared/application/ports/clock.js';
import { IdGenerator } from '../../../../shared/application/ports/id-generator.js';
import { ProfileInitializer } from '../../../../shared/application/ports/profile-initializer.js';
import { AuthStateStore } from '../ports/auth-state-store.js';
import { SteamOpenIdVerifier } from '../ports/steam-openid-verifier.js';
import { SteamProfileFetcher } from '../ports/steam-profile-fetcher.js';
import { UserRepository } from '../ports/user-repository.js';
import { SessionIssuer } from '../ports/session-issuer.js';
import { parseClaimedId } from '../../domain/openid.js';
import {
  InvalidSteamResponseError,
  InvalidStateError,
} from '../../domain/errors.js';
import type { SteamProfile } from '../../domain/steam-profile.js';
import type { User } from '../../domain/user.js';

export type CallbackResult = {
  redirectUrl: string;
};

@injectable()
export class HandleSteamCallbackUseCase {
  constructor(
    @inject(Clock) private readonly clock: Clock,
    @inject(IdGenerator) private readonly ids: IdGenerator,
    @inject(AuthStateStore) private readonly states: AuthStateStore,
    @inject(SteamOpenIdVerifier) private readonly verifier: SteamOpenIdVerifier,
    @inject(SteamProfileFetcher) private readonly profiles: SteamProfileFetcher,
    @inject(UserRepository) private readonly users: UserRepository,
    @inject(SessionIssuer) private readonly sessions: SessionIssuer,
    @inject(ProfileInitializer) private readonly profileInit: ProfileInitializer,
  ) {}

  async execute(openidParams: URLSearchParams): Promise<CallbackResult> {
    const state = openidParams.get('state');
    if (!state) throw new InvalidStateError();

    const consumed = await this.states.consume(state, this.clock.now());
    if (!consumed) throw new InvalidStateError();

    const isValid = await this.verifier.verify(openidParams);
    if (!isValid) throw new InvalidSteamResponseError();

    const claimedId = openidParams.get('openid.claimed_id');
    const steamId = claimedId ? parseClaimedId(claimedId) : null;
    if (!steamId) throw new InvalidSteamResponseError();

    const steamProfile = await this.profiles.fetch(steamId);
    const { user, isNew } = await this.upsertUser(steamProfile);
    if (isNew) {
      await this.profileInit.initialize(user.id);
    }

    const issued = await this.sessions.issue(user.id);
    const url = new URL(consumed.clientCallback);
    url.searchParams.set('token', issued.token);
    return { redirectUrl: url.toString() };
  }

  private async upsertUser(profile: SteamProfile): Promise<{ user: User; isNew: boolean }> {
    const now = this.clock.now();
    const existing = await this.users.findBySteamId(profile.steamId);
    if (existing) {
      await this.users.updateOnLogin(existing.id, {
        personaName: profile.personaName,
        avatarUrl: profile.avatarUrl,
        lastLoginAt: now,
      });
      return {
        user: {
          ...existing,
          personaName: profile.personaName,
          avatarUrl: profile.avatarUrl,
        },
        isNew: false,
      };
    }
    const created = await this.users.create({
      id: this.ids.generate(),
      steamId: profile.steamId,
      personaName: profile.personaName,
      avatarUrl: profile.avatarUrl,
      now,
    });
    return { user: created, isNew: true };
  }
}
