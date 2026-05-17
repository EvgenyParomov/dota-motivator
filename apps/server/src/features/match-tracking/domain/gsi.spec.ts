import { describe, expect, it } from 'vitest';
import { isCountableLobby, parseGsiMatchEvent } from './gsi.js';

describe('Трекинг матчей Dota', () => {
  describe('Match event domain', () => {
    it('парсинг GsiMatchEvent отклоняет пустой matchId', () => {
      expect(() => parseGsiMatchEvent({ matchId: '', phase: 'post_game' })).toThrow();
    });

    it('парсинг GsiMatchEvent распознаёт фазы pre_game, game_in_progress, post_game', () => {
      const e1 = parseGsiMatchEvent({ matchId: '1', phase: 'pre_game' });
      const e2 = parseGsiMatchEvent({ matchId: '1', phase: 'game_in_progress' });
      const e3 = parseGsiMatchEvent({ matchId: '1', phase: 'post_game' });
      expect(e1.phase).toBe('pre_game');
      expect(e2.phase).toBe('game_in_progress');
      expect(e3.phase).toBe('post_game');
    });

    it('события с lobbyType practice игнорируются для списания', () => {
      expect(isCountableLobby('DOTA_lobby_type_practice')).toBe(false);
      expect(isCountableLobby('practice')).toBe(false);
      expect(isCountableLobby('demo')).toBe(false);
      expect(isCountableLobby('public')).toBe(true);
    });
  });
});
