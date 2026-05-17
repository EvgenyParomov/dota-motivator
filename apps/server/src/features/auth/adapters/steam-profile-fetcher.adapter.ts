import { inject, injectable } from 'inversify';
import { SteamProfileFetcher } from '../application/ports/steam-profile-fetcher.js';
import type { SteamProfile } from '../domain/steam-profile.js';
import { EnvToken } from '../../../app/tokens.js';
import type { AppEnv } from '../../../shared/lib/env.js';

@injectable()
export class HttpSteamProfileFetcher extends SteamProfileFetcher {
  constructor(@inject(EnvToken) private readonly env: AppEnv) {
    super();
  }

  override async fetch(steamId: string): Promise<SteamProfile> {
    const fallback: SteamProfile = { steamId, personaName: steamId, avatarUrl: '' };
    if (!this.env.STEAM_API_KEY) return fallback;
    try {
      const url = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/');
      url.searchParams.set('key', this.env.STEAM_API_KEY);
      url.searchParams.set('steamids', steamId);
      const resp = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (!resp.ok) return fallback;
      const json = (await resp.json()) as {
        response?: { players?: { personaname?: string; avatarfull?: string }[] };
      };
      const player = json.response?.players?.[0];
      if (!player) return fallback;
      return {
        steamId,
        personaName: player.personaname ?? steamId,
        avatarUrl: player.avatarfull ?? '',
      };
    } catch {
      return fallback;
    }
  }
}
