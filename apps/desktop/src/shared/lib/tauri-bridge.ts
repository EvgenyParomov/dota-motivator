import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export const isTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const tauriInvoke = async <T>(cmd: string, args?: Record<string, unknown>): Promise<T> => {
  if (!isTauri()) {
    throw new Error(`tauri command unavailable in browser: ${cmd}`);
  }
  return invoke<T>(cmd, args);
};

export const tauriListen = async <T>(
  event: string,
  handler: (payload: T) => void,
): Promise<UnlistenFn> => {
  if (!isTauri()) {
    return () => {};
  }
  return listen<T>(event, (e) => handler(e.payload));
};
