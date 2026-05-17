const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';

export type SteamStartParams = {
  realm: string;
  returnTo: string;
  state: string;
};

export const buildSteamLoginUrl = (params: SteamStartParams): string => {
  const returnToWithState = appendQuery(params.returnTo, { state: params.state });
  const q = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnToWithState,
    'openid.realm': params.realm,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });
  return `${STEAM_OPENID_ENDPOINT}?${q.toString()}`;
};

const appendQuery = (url: string, params: Record<string, string>): string => {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
};

const CLAIMED_ID_RE = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;

export const parseClaimedId = (claimedId: string): string | null => {
  const m = CLAIMED_ID_RE.exec(claimedId);
  return m ? (m[1] ?? null) : null;
};

export const buildVerifyPayload = (
  openidParams: URLSearchParams,
): URLSearchParams => {
  const out = new URLSearchParams(openidParams);
  out.set('openid.mode', 'check_authentication');
  return out;
};

export const parseIsValid = (rawBody: string): boolean =>
  rawBody.split('\n').some((line) => line.trim() === 'is_valid:true');
