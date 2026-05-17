import { inject, injectable } from 'inversify';
import type { UserId, MediaKey } from '@dm/shared';
import { MediaRepository } from '../ports/media-repository.js';
import { MediaPresigner } from '../ports/media-presigner.js';
import { IdGenerator } from '../../../../shared/application/ports/id-generator.js';
import { validateUpload } from '../../domain/validation.js';

export type PresignResult = {
  uploadUrl: string;
  mediaKey: MediaKey;
};

@injectable()
export class PresignUploadUseCase {
  constructor(
    @inject(MediaRepository) private readonly repo: MediaRepository,
    @inject(MediaPresigner) private readonly presigner: MediaPresigner,
    @inject(IdGenerator) private readonly ids: IdGenerator,
  ) {}

  async execute(
    userId: UserId,
    params: { mimeType: string; size: number },
  ): Promise<PresignResult> {
    validateUpload(params);
    const extension = params.mimeType.split('/')[1] ?? 'bin';
    const mediaKey = `${userId}/${this.ids.generate()}.${extension}`;
    await this.repo.create({
      id: this.ids.generate(),
      userId,
      mediaKey,
      mimeType: params.mimeType,
      size: params.size,
    });
    const uploadUrl = await this.presigner.presignPut(mediaKey, params.mimeType);
    return { uploadUrl, mediaKey };
  }
}
