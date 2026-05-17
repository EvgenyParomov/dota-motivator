import type { MediaKey, UserId } from '@dm/shared';

export type MediaEntity = {
  id: string;
  userId: UserId;
  mediaKey: MediaKey;
  mimeType: string;
  size: number;
  createdAt: Date;
};
