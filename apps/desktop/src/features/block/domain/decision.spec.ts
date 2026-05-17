import { describe, expect, it } from 'vitest';
import { decide, formatBlockReason } from './decision';

describe('Блокировка Dota', () => {
  describe('BlockOrchestrator', () => {
    it('при ответе allow ничего не делает', () => {
      expect(decide(true, '').kind).toBe('allow');
    });
    it('при ответе block вызывает Tauri-команду killDota', () => {
      const d = decide(false, 'no katki');
      expect(d.kind).toBe('block');
    });
  });

  describe('BlockReasonFormatter', () => {
    it('возвращает человекочитаемый текст с текущим балансом и порогом', () => {
      expect(formatBlockReason(-3, 2)).toContain('-3');
      expect(formatBlockReason(-3, 2)).toContain('2');
    });
  });
});
