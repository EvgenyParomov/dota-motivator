import { useEffect, useState } from 'react';
import { isTauri, tauriInvoke } from '../../../shared/lib/tauri-bridge';
import { apiUrl } from '../../../shared/lib/api';

export type Status = 'ok' | 'down' | 'unknown';

export type TrackingStatus = {
  server: Status;
  listener: Status;
  listenerPort: number;
  dota: Status;
};

const probeServer = async (): Promise<Status> => {
  try {
    const r = await fetch(apiUrl('/health'));
    return r.ok ? 'ok' : 'down';
  } catch {
    return 'down';
  }
};

const probeListener = async (): Promise<{ status: Status; port: number }> => {
  if (!isTauri()) return { status: 'unknown', port: 0 };
  let port = 0;
  try {
    port = await tauriInvoke<number>('get_gsi_port');
  } catch {
    return { status: 'down', port: 0 };
  }
  if (port === 0) return { status: 'down', port: 0 };
  try {
    await fetch(`http://127.0.0.1:${port}/`, { method: 'GET' });
    return { status: 'ok', port };
  } catch {
    return { status: 'down', port };
  }
};

const probeDota = async (): Promise<Status> => {
  if (!isTauri()) return 'unknown';
  try {
    const running = await tauriInvoke<boolean>('is_dota_running');
    return running ? 'ok' : 'down';
  } catch {
    return 'down';
  }
};

const POLL_MS = 5000;

export const useTrackingStatus = (): TrackingStatus => {
  const [status, setStatus] = useState<TrackingStatus>({
    server: 'unknown',
    listener: 'unknown',
    listenerPort: 0,
    dota: 'unknown',
  });

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const [server, listenerResult, dota] = await Promise.all([
        probeServer(),
        probeListener(),
        probeDota(),
      ]);
      if (!cancelled) {
        setStatus({
          server,
          listener: listenerResult.status,
          listenerPort: listenerResult.port,
          dota,
        });
      }
    };
    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return status;
};
