import { useState } from 'react';
import { isTauri, tauriInvoke } from '../../../shared/lib/tauri-bridge';
import { useTrackingStatus, type Status } from '../model/use-tracking-status';

const dotClass = (s: Status) => {
  if (s === 'ok') return 'bg-emerald-500';
  if (s === 'down') return 'bg-rose-500';
  return 'bg-zinc-500';
};

type PillProps = {
  status: Status;
  labelOk: string;
  labelDown: string;
  title: string;
  onClick?: () => void;
};

const Pill = ({ status, labelOk, labelDown, title, onClick }: PillProps) => {
  const className =
    'flex items-center gap-1.5 rounded-md border bg-background/80 px-2 py-1 backdrop-blur';
  const content = (
    <>
      <span className={`size-2 rounded-full ${dotClass(status)}`} />
      <span>{status === 'unknown' ? '…' : status === 'ok' ? labelOk : labelDown}</span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} cursor-pointer hover:bg-zinc-800`} title={title}>
        {content}
      </button>
    );
  }
  return (
    <div className={className} title={title}>
      {content}
    </div>
  );
};

const runGsiDiagnostics = async (): Promise<string> => {
  if (!isTauri()) return 'Не в Tauri-окне.';
  const lines: string[] = [];
  try {
    const port = await tauriInvoke<number>('get_gsi_port');
    lines.push(`get_gsi_port → ${port}`);
  } catch (e) {
    lines.push(`get_gsi_port ERROR: ${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    const port = await tauriInvoke<number>('start_gsi_listener');
    lines.push(`start_gsi_listener → ${port}`);
  } catch (e) {
    lines.push(`start_gsi_listener ERROR: ${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    const port = await tauriInvoke<number>('get_gsi_port');
    if (port > 0) {
      try {
        const r = await fetch(`http://127.0.0.1:${port}/`);
        lines.push(`probe http://127.0.0.1:${port}/ → HTTP ${r.status}`);
      } catch (e) {
        lines.push(`probe ERROR: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch {
    /* skip */
  }
  return lines.join('\n');
};

export const TrackingStatusBadge = () => {
  const s = useTrackingStatus();
  const [diag, setDiag] = useState<string | null>(null);

  const onGsiClick = async () => {
    setDiag('Диагностика…');
    setDiag(await runGsiDiagnostics());
  };

  return (
    <>
      <div className="text-muted-foreground pointer-events-auto fixed top-3 right-3 z-40 flex items-center gap-2 text-xs">
        <Pill
          status={s.server}
          labelOk="Сервер"
          labelDown="Сервер offline"
          title="GET /health на backend"
        />
        <Pill
          status={s.listener}
          labelOk={`GSI :${s.listenerPort}`}
          labelDown="GSI offline"
          title="Клик для диагностики"
          onClick={onGsiClick}
        />
        <Pill
          status={s.dota}
          labelOk="Dota запущена"
          labelDown="Dota не запущена"
          title="Процесс dota2.exe в системе"
        />
      </div>
      {diag !== null && (
        <div className="pointer-events-auto fixed top-12 right-3 z-40 max-w-md rounded-md border border-zinc-700 bg-zinc-900/95 p-3 text-xs text-zinc-100 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">GSI диагностика</span>
            <button
              type="button"
              onClick={() => setDiag(null)}
              className="text-zinc-400 hover:text-zinc-100"
            >
              ✕
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-[11px] text-zinc-300">{diag}</pre>
        </div>
      )}
    </>
  );
};
