export abstract class SteamOpenIdVerifier {
  abstract verify(openidParams: URLSearchParams): Promise<boolean>;
}
