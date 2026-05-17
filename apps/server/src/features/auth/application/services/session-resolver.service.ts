import { inject, injectable } from 'inversify';
import type { AuthContext } from '@dm/shared';
import { SessionResolver } from '../../../../shared/application/ports/session-resolver.js';
import { AuthToken } from '../../../../app/tokens.js';
import type { Auth } from '../../../../shared/adapters/better-auth.js';

@injectable()
export class SessionResolverService extends SessionResolver {
  constructor(@inject(AuthToken) private readonly auth: Auth) {
    super();
  }

  override async resolve(
    headers: Record<string, string | string[] | undefined>,
  ): Promise<AuthContext> {
    const h = new Headers();
    for (const [k, v] of Object.entries(headers)) {
      if (v == null) continue;
      h.set(k, Array.isArray(v) ? v.join(', ') : v);
    }
    try {
      const session = await this.auth.api.getSession({ headers: h });
      if (session?.user?.id) {
        return { kind: 'authenticated', userId: session.user.id };
      }
    } catch {
      // fall through to anonymous
    }
    return { kind: 'anonymous' };
  }
}
