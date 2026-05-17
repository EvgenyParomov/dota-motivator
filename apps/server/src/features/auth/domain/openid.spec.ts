import { describe, expect, it } from 'vitest';
import { buildSteamLoginUrl, parseClaimedId, parseIsValid, buildVerifyPayload } from './openid.js';

describe('Аутентификация', () => {
  describe('Steam OpenID протокол', () => {
    it('builder формирует Steam OpenID URL с openid.mode=checkid_setup и переданным return_to', () => {
      const url = buildSteamLoginUrl({
        realm: 'http://localhost:4000',
        returnTo: 'http://localhost:4000/auth/steam/callback',
        state: 'abc',
      });
      const u = new URL(url);
      expect(u.host).toBe('steamcommunity.com');
      expect(u.searchParams.get('openid.mode')).toBe('checkid_setup');
      expect(u.searchParams.get('openid.return_to')).toContain(
        'http://localhost:4000/auth/steam/callback',
      );
    });

    it('builder включает state в return_to как query-параметр', () => {
      const url = buildSteamLoginUrl({
        realm: 'http://localhost:4000',
        returnTo: 'http://localhost:4000/auth/steam/callback',
        state: 'my-state',
      });
      const returnTo = new URL(new URL(url).searchParams.get('openid.return_to')!);
      expect(returnTo.searchParams.get('state')).toBe('my-state');
    });

    it('parser извлекает steamId64 из claimed_id формата https://steamcommunity.com/openid/id/<id>', () => {
      expect(parseClaimedId('https://steamcommunity.com/openid/id/76561198000000001')).toBe(
        '76561198000000001',
      );
    });

    it('parser отклоняет claimed_id с нестандартным форматом', () => {
      expect(parseClaimedId('http://steamcommunity.com/openid/id/123')).toBeNull();
      expect(parseClaimedId('garbage')).toBeNull();
      expect(parseClaimedId('https://steamcommunity.com/openid/id/abc')).toBeNull();
    });
  });

  describe('SteamOpenIdVerifier', () => {
    it('валидный openid response подтверждается через check_authentication у Steam', () => {
      expect(parseIsValid('ns:http://specs.openid.net/auth/2.0\nis_valid:true\n')).toBe(true);
    });

    it('response отклоняется когда Steam возвращает is_valid:false', () => {
      expect(parseIsValid('ns:http://specs.openid.net/auth/2.0\nis_valid:false\n')).toBe(false);
    });
  });

  describe('verify payload', () => {
    it('builds check_authentication payload with same params', () => {
      const orig = new URLSearchParams({ 'openid.mode': 'id_res', foo: 'bar' });
      const verify = buildVerifyPayload(orig);
      expect(verify.get('openid.mode')).toBe('check_authentication');
      expect(verify.get('foo')).toBe('bar');
    });
  });
});
