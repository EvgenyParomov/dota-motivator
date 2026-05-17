import { injectable } from 'inversify';
import { SteamOpenIdVerifier } from '../application/ports/steam-openid-verifier.js';
import { buildVerifyPayload, parseIsValid } from '../domain/openid.js';

const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';

@injectable()
export class HttpSteamOpenIdVerifier extends SteamOpenIdVerifier {
  override async verify(openidParams: URLSearchParams): Promise<boolean> {
    const body = buildVerifyPayload(openidParams).toString();
    const resp = await fetch(STEAM_OPENID_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!resp.ok) return false;
    return parseIsValid(await resp.text());
  }
}
