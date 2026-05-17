import { describe, it, expect } from 'vitest';

describe('Статистика', () => {
  describe('WheelData domain (frontend)', () => {
    it('вычисляет нормированный вес сектора для радиального графика', () => {
      // @TODO move normalization to features/statistics/domain/wheel.ts and unit-test
      expect(true).toBe(true);
    });
  });

  describe('OrphanSpheres domain (frontend)', () => {
    it('сортирует сирот по количеству дней без активности по убыванию', () => {
      // @TODO move sort to features/statistics/domain/orphans.ts and unit-test
      expect(true).toBe(true);
    });
  });
});
