import { useCallback, useEffect, useState } from 'react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { isTauri } from '../../../shared/lib/tauri-bridge';

export type UpdateStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'up-to-date' }
  | { kind: 'available'; version: string; notes: string | null; update: Update }
  | { kind: 'downloading'; version: string; downloaded: number; total: number | null }
  | { kind: 'installing'; version: string }
  | { kind: 'error'; message: string };

export const useUpdater = () => {
  const [status, setStatus] = useState<UpdateStatus>({ kind: 'idle' });

  const checkForUpdate = useCallback(async () => {
    if (!isTauri()) return;
    setStatus({ kind: 'checking' });
    try {
      const update = await check();
      if (!update) {
        setStatus({ kind: 'up-to-date' });
        return;
      }
      setStatus({
        kind: 'available',
        version: update.version,
        notes: update.body ?? null,
        update,
      });
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  const install = useCallback(async (update: Update) => {
    setStatus({ kind: 'downloading', version: update.version, downloaded: 0, total: null });
    try {
      let total: number | null = null;
      let downloaded = 0;
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            total = event.data.contentLength ?? null;
            setStatus({ kind: 'downloading', version: update.version, downloaded: 0, total });
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            setStatus({ kind: 'downloading', version: update.version, downloaded, total });
            break;
          case 'Finished':
            setStatus({ kind: 'installing', version: update.version });
            break;
        }
      });
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    void checkForUpdate();
    const id = setInterval(() => void checkForUpdate(), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [checkForUpdate]);

  return { status, checkForUpdate, install };
};
