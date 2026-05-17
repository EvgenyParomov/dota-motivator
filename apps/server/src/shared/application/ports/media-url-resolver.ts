import type { MediaKey } from '@dm/shared';

export abstract class MediaUrlResolver {
  abstract resolveReadUrl(key: MediaKey | null): Promise<string | null>;
}
