import type { Container } from 'inversify';
import { SessionResolver } from '../../shared/application/ports/session-resolver.js';
import { SteamOpenIdVerifier } from './application/ports/steam-openid-verifier.js';
import { SteamProfileFetcher } from './application/ports/steam-profile-fetcher.js';
import { AuthStateStore } from './application/ports/auth-state-store.js';
import { UserRepository } from './application/ports/user-repository.js';
import { SessionIssuer } from './application/ports/session-issuer.js';
import { StartSteamLoginUseCase } from './application/use-cases/start-steam-login.use-case.js';
import { HandleSteamCallbackUseCase } from './application/use-cases/handle-steam-callback.use-case.js';
import { SignOutUseCase } from './application/use-cases/sign-out.use-case.js';
import { GetMeUseCase } from './application/use-cases/get-me.use-case.js';
import { SessionIssuerService } from './application/services/session-issuer.service.js';
import { SessionResolverService } from './application/services/session-resolver.service.js';
import { HttpSteamOpenIdVerifier } from './adapters/steam-openid-verifier.adapter.js';
import { HttpSteamProfileFetcher } from './adapters/steam-profile-fetcher.adapter.js';
import { DrizzleAuthStateStore } from './adapters/auth-state-store.adapter.js';
import { DrizzleUserRepository } from './adapters/user-repository.adapter.js';

export const registerAuth = (c: Container): void => {
  c.bind(SteamOpenIdVerifier).to(HttpSteamOpenIdVerifier);
  c.bind(SteamProfileFetcher).to(HttpSteamProfileFetcher);
  c.bind(AuthStateStore).to(DrizzleAuthStateStore);
  c.bind(UserRepository).to(DrizzleUserRepository);

  c.bind(SessionIssuer).to(SessionIssuerService);
  c.bind(SessionResolver).to(SessionResolverService);

  c.bind(StartSteamLoginUseCase).toSelf();
  c.bind(HandleSteamCallbackUseCase).toSelf();
  c.bind(SignOutUseCase).toSelf();
  c.bind(GetMeUseCase).toSelf();
};
