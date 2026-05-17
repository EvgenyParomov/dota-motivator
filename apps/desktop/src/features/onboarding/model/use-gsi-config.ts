import { useEffect, useState } from 'react';
import { isTauri, tauriInvoke } from '../../../shared/lib/tauri-bridge';

export type GsiCheckResult =
  | { status: 'ok'; path: string }
  | { status: 'written'; path: string }
  | { status: 'manual_required'; content: string };

export const useGsiConfig = () => {
  const [result, setResult] = useState<GsiCheckResult | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      if (!isTauri()) {
        setResult({ status: 'manual_required', content: '(требуется Tauri)' });
        return;
      }
      const r = await tauriInvoke<GsiCheckResult>('ensure_gsi_config');
      setResult(r);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    void check();
  }, []);

  return { result, checking, recheck: check };
};
