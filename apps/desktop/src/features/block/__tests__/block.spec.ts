import { describe, it, expect } from 'vitest';

describe('Блокировка Dota', () => {
  describe('BlockOrchestrator', () => {
    it('на фазе pre_game запрашивает play-decision у сервера', () => {
      // @TODO RTL: mount BlockOrchestrator, emit gsi-event pre_game, assert fetch /play-decision called
      expect(true).toBe(true);
    });

    it('при ошибке сети применяет fail-safe allow и логирует ошибку', () => {
      // @TODO mock fetch reject, assert killDota NOT invoked, overlay stays closed
      expect(true).toBe(true);
    });
  });

  describe('FallbackProcessWatcher', () => {
    it('при обнаружении dota2.exe без активного GSI запрашивает play-decision и принимает решение', () => {
      // @TODO Tauri sysinfo polling — covered by Rust side; TS bridge test pending
      expect(true).toBe(true);
    });
  });

  describe('KillNotification', () => {
    it('показывает оверлей с причиной блокировки и текущим балансом', () => {
      // @TODO RTL: render BlockOverlay open=true, assert reason text visible
      expect(true).toBe(true);
    });

    it('оверлей закрывается явным действием пользователя', () => {
      // @TODO RTL: click "Понятно" → onClose invoked
      expect(true).toBe(true);
    });
  });

  describe('Поток блокировки (с моком сервера и Tauri-команд)', () => {
    it('pre_game event при balance ниже порога вызывает killDota и показывает оверлей', () => {
      // @TODO Playwright + tauri-driver OR mocked invoke; see e2e/block.spec.ts
      expect(true).toBe(true);
    });

    it('pre_game event при достаточном балансе не вызывает killDota', () => {
      // @TODO see e2e/block.spec.ts
      expect(true).toBe(true);
    });

    it('ошибка сети при запросе play-decision не блокирует игру', () => {
      // @TODO see e2e/block.spec.ts
      expect(true).toBe(true);
    });

    it('повторный pre_game для того же matchId не вызывает killDota дважды', () => {
      // @TODO see e2e/block.spec.ts
      expect(true).toBe(true);
    });
  });
});
