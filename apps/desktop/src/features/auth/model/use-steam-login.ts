import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isTauri, tauriInvoke, tauriListen } from '../../../shared/lib/tauri-bridge';
import { useAuthToken } from '../../../shared/ports/auth-token';
import { getServerBaseUrl } from '../../../shared/lib/api';

export const useSteamLogin = () => {
  const { setToken } = useAuthToken();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;
    if (isTauri()) {
      void tauriListen<string>('auth-token', (token) => {
        if (!mounted) return;
        setToken(token);
        navigate('/dashboard', { replace: true });
      }).then((un) => {
        unlistenRef.current = un;
      });
    }
    return () => {
      mounted = false;
      unlistenRef.current?.();
    };
  }, [setToken, navigate]);

  const start = async () => {
    setError(null);
    setStarting(true);
    try {
      let callbackUrl = 'http://localhost:5187';
      if (isTauri()) {
        const port = await tauriInvoke<number>('start_auth_callback_listener');
        callbackUrl = `http://localhost:${port}`;
      }
      const url = `${getServerBaseUrl()}/auth/steam/start?client_callback=${encodeURIComponent(
        callbackUrl,
      )}`;
      if (isTauri()) {
        const { openUrl } = await import('@tauri-apps/plugin-opener');
        await openUrl(url);
      } else {
        window.open(url, '_blank');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed to start sign-in');
    } finally {
      setStarting(false);
    }
  };

  return { start, starting, error };
};
