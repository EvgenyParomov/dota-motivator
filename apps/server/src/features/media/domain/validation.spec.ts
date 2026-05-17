import { describe, expect, it } from 'vitest';
import { validateUpload, PayloadTooLargeError, MAX_SIZE_BYTES } from './validation.js';
import { ValidationError } from '../../../shared/lib/errors.js';

describe('Загрузка медиа', () => {
  describe('Upload validation', () => {
    it('допускает image/png, image/jpeg, image/webp', () => {
      expect(() => validateUpload({ mimeType: 'image/png', size: 100 })).not.toThrow();
      expect(() => validateUpload({ mimeType: 'image/jpeg', size: 100 })).not.toThrow();
      expect(() => validateUpload({ mimeType: 'image/webp', size: 100 })).not.toThrow();
    });

    it('отклоняет mimeType вне allowlist', () => {
      expect(() => validateUpload({ mimeType: 'image/svg+xml', size: 100 })).toThrow(
        ValidationError,
      );
      expect(() => validateUpload({ mimeType: 'application/pdf', size: 100 })).toThrow(
        ValidationError,
      );
    });

    it('отклоняет contentLength больше 1 МБ доменной ошибкой PayloadTooLarge', () => {
      expect(() =>
        validateUpload({ mimeType: 'image/png', size: MAX_SIZE_BYTES + 1 }),
      ).toThrow(PayloadTooLargeError);
    });

    it('отклоняет нулевой или отрицательный размер', () => {
      expect(() => validateUpload({ mimeType: 'image/png', size: 0 })).toThrow(ValidationError);
      expect(() => validateUpload({ mimeType: 'image/png', size: -1 })).toThrow(ValidationError);
    });
  });
});
