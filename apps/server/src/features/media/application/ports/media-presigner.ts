import type { MediaKey } from '@dm/shared';

export abstract class MediaPresigner {
  abstract presignPut(key: MediaKey, mimeType: string): Promise<string>;
}
