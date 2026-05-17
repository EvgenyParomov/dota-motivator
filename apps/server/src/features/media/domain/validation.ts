import { ValidationError } from '../../../shared/lib/errors.js';
import { DomainError } from '../../../shared/lib/errors.js';

export const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);
export const MAX_SIZE_BYTES = 1 * 1024 * 1024;

export class PayloadTooLargeError extends DomainError {
  constructor(message: string) {
    super('PAYLOAD_TOO_LARGE', message);
  }
}

export const validateUpload = (params: { mimeType: string; size: number }): void => {
  if (!ALLOWED_MIME.has(params.mimeType)) {
    throw new ValidationError(`mime type not allowed: ${params.mimeType}`);
  }
  if (!Number.isFinite(params.size) || params.size <= 0) {
    throw new ValidationError('size must be positive');
  }
  if (params.size > MAX_SIZE_BYTES) {
    throw new PayloadTooLargeError(`size exceeds ${MAX_SIZE_BYTES} bytes`);
  }
};
