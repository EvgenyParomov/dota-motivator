import { useEffect, useRef, useState } from 'react';
import { isTauri, tauriInvoke, tauriListen } from '../../../shared/lib/tauri-bridge';
import { useReportMatch } from '../../match-tracking/model/use-report-match';
import { fetchPlayDecision } from '../../match-tracking/model/use-play-decision';

type GsiEvent = { matchId: string; phase: string; lobbyType: string };

export type BlockOrchestratorState = {
  open: boolean;
  reason: string;
  close: () => void;
};

export const useBlockOrchestrator = (): BlockOrchestratorState => {
  const [overlay, setOverlay] = useState<{ open: boolean; reason: string }>({
    open: false,
    reason: '',
  });
  const handledMatchPre = useRef(new Set<string>());
  const handledMatchEnd = useRef(new Set<string>());
  const report = useReportMatch();

  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | null = null;
    void tauriInvoke<number>('start_gsi_listener').catch(() => {});

    void tauriListen<GsiEvent>('gsi-event', async (event) => {
      if (event.phase === 'pre_game' && !handledMatchPre.current.has(event.matchId)) {
        handledMatchPre.current.add(event.matchId);
        try {
          const decision = await fetchPlayDecision();
          if (!decision.allowed) {
            await tauriInvoke<number>('kill_dota');
            setOverlay({ open: true, reason: decision.reason });
          }
        } catch {
          // fail-safe: do not block on network errors
        }
      }
      if (event.phase === 'post_game' && !handledMatchEnd.current.has(event.matchId)) {
        handledMatchEnd.current.add(event.matchId);
        report.mutate({
          matchId: event.matchId,
          phase: 'post_game',
          lobbyType: event.lobbyType,
        });
      }
    }).then((un) => {
      unlisten = un;
    });

    return () => {
      unlisten?.();
    };
  }, [report]);

  return {
    open: overlay.open,
    reason: overlay.reason,
    close: () => setOverlay({ open: false, reason: '' }),
  };
};
