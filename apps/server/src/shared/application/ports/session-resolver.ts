import type { AuthContext } from '@dm/shared';

export abstract class SessionResolver {
  abstract resolve(headers: Record<string, string | string[] | undefined>): Promise<AuthContext>;
}
