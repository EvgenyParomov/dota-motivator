import { useEffect, useState } from 'react';
import { isTauri, tauriInvoke } from '../../../shared/lib/tauri-bridge';
import { apiUrl } from '../../../shared/lib/api';

export type Status = 'ok' | 'down' | 'unknown';

export type TrackingStatus = {
  server: Status;
  listener: Status;
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

const probeListener = async (): Promise<Status> => {
  try {
    await fetch('http://127.0.0.1:7383/', { method: 'GET' });
    return 'ok';
  } catch {
    return 'down';
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
    dota: 'unknown',
  });

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const [server, listener, dota] = await Promise.all([
        probeServer(),
        probeListener(),
        probeDota(),
      ]);
      if (!cancelled) setStatus({ server, listener, dota });
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
