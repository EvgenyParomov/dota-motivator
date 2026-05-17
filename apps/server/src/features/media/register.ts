import type { Container } from 'inversify';
import { MediaUrlResolver } from '../../shared/application/ports/media-url-resolver.js';
import { MediaRepository } from './application/ports/media-repository.js';
import { MediaPresigner } from './application/ports/media-presigner.js';
import { DrizzleMediaRepository } from './adapters/media-repository.adapter.js';
import { MinioMediaPresigner } from './adapters/minio-presigner.adapter.js';
import { MinioMediaUrlResolver } from './adapters/media-url-resolver.adapter.js';
import { PresignUploadUseCase } from './application/use-cases/presign-upload.use-case.js';

export const registerMedia = (c: Container): void => {
  c.bind(MediaRepository).to(DrizzleMediaRepository);
  c.bind(MediaPresigner).to(MinioMediaPresigner);

  c.bind(MediaUrlResolver).to(MinioMediaUrlResolver);

  c.bind(PresignUploadUseCase).toSelf();
};
