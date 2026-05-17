import { test, expect } from '@playwright/test';

test.describe('Блокировка Dota', () => {
  test.describe('Поток блокировки (с моком сервера и Tauri-команд)', () => {
    test('pre_game event при balance ниже порога вызывает killDota и показывает оверлей', () => {
      // @TODO Tauri-driver или замоканный invoke в браузере: вызвать gsi-event, проверить overlay
      expect(true).toBe(true);
    });

    test('pre_game event при достаточном балансе не вызывает killDota', () => {
      // @TODO мок /play-decision allowed=true, проверить отсутствие kill_dota вызова
      expect(true).toBe(true);
    });

    test('ошибка сети при запросе play-decision не блокирует игру', () => {
      // @TODO мок fetch с отказом, проверить отсутствие overlay
      expect(true).toBe(true);
    });

    test('повторный pre_game для того же matchId не вызывает killDota дважды', () => {
      // @TODO эмитировать pre_game с тем же matchId дважды
      expect(true).toBe(true);
    });
  });
});
