import { describe, expect, it } from 'vitest';
import { SPHERES, parseSphere, getSphereLabel, getSphereIconKey } from './sphere.js';

describe('Сферы жизни', () => {
  describe('Sphere enum', () => {
    it('содержит ровно 8 предопределённых кодов сфер', () => {
      expect(SPHERES.length).toBe(8);
    });

    it('parseSphere возвращает Sphere для каждого известного кода', () => {
      for (const s of SPHERES) {
        expect(parseSphere(s)).toBe(s);
      }
    });

    it('parseSphere возвращает null для неизвестного кода', () => {
      expect(parseSphere('unknown')).toBeNull();
      expect(parseSphere('')).toBeNull();
    });
  });

  describe('Sphere display', () => {
    it('getSphereLabel возвращает русскую метку для каждой сферы', () => {
      for (const s of SPHERES) {
        expect(getSphereLabel(s)).not.toBe('');
      }
    });

    it('getSphereIconKey возвращает уникальный ключ иконки для каждой сферы', () => {
      const keys = SPHERES.map(getSphereIconKey);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });
});
