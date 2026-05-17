import type { SteamProfile } from '../../domain/steam-profile.js';

export abstract class SteamProfileFetcher {
  abstract fetch(steamId: string): Promise<SteamProfile>;
}
