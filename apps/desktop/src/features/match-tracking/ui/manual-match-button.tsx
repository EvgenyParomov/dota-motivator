import { useState } from 'react';
import { useReportMatch } from '../model/use-report-match';

export const ManualMatchButton = () => {
  const report = useReportMatch();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    if (!window.confirm('Списать одну катку с баланса?')) return;
    setError(null);
    report.mutate(
      {
        matchId: `manual-${crypto.randomUUID()}`,
        phase: 'post_game',
        lobbyType: 'manual',
      },
      {
        onError: (e) => setError(e instanceof Error ? e.message : 'Не удалось'),
      },
    );
  };

  const last = report.data;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900/40 p-3 text-sm">
      <div className="flex-1 text-zinc-400">
        Если GSI не сработал — отметь катку вручную, чтобы она списалась с баланса.
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={report.isPending}
        className="rounded bg-orange-500 px-3 py-1.5 text-xs font-medium text-zinc-950 transition hover:bg-orange-400 disabled:opacity-60"
      >
        {report.isPending ? 'Списываю…' : 'Списать катку вручную'}
      </button>
      {last && !error && (
        <p className="w-full text-xs text-emerald-400">
          {last.duplicate
            ? 'Катка уже была учтена ранее.'
            : last.counted
              ? 'Готово, катка засчитана.'
              : 'Событие принято, но баланс не изменён.'}
        </p>
      )}
      {error && <p className="w-full text-xs text-rose-400">{error}</p>}
    </div>
  );
};
