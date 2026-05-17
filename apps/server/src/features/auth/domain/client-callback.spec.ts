import { describe, expect, it } from 'vitest';
import { isAllowedClientCallback } from './client-callback.js';

describe('Аутентификация', () => {
  describe('Старт потока', () => {
    it('client_callback не из allowlist (только http://localhost:*) отклоняется с 400', () => {
      const allow = ['http://localhost:5187'];
      expect(isAllowedClientCallback('http://localhost:5187', allow)).toBe(true);
      expect(isAllowedClientCallback('http://localhost:9999', allow)).toBe(false);
      expect(isAllowedClientCallback('https://evil.example.com', allow)).toBe(false);
      expect(isAllowedClientCallback('not-a-url', allow)).toBe(false);
    });
  });
});
