import { useUpdater } from '../model/use-updater';

const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

export const UpdateBanner = () => {
  const { status, install } = useUpdater();

  if (status.kind === 'idle' || status.kind === 'checking' || status.kind === 'up-to-date') {
    return null;
  }

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-orange-500/40 bg-zinc-900/95 p-4 text-sm shadow-xl backdrop-blur">
      {status.kind === 'available' && (
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-orange-400">Доступно обновление {status.version}</p>
            {status.notes && (
              <p className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap text-xs text-zinc-400">
                {status.notes}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void install(status.update)}
            className="w-full rounded bg-orange-500 px-3 py-1.5 text-xs font-medium text-zinc-950 transition hover:bg-orange-400"
          >
            Установить и перезапустить
          </button>
        </div>
      )}
      {status.kind === 'downloading' && (
        <div>
          <p className="font-medium">Загрузка {status.version}…</p>
          <p className="mt-1 text-xs text-zinc-400">
            {formatBytes(status.downloaded)}
            {status.total ? ` / ${formatBytes(status.total)}` : ''}
          </p>
          {status.total ? (
            <div className="mt-2 h-1.5 overflow-hidden rounded bg-zinc-800">
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${Math.min(100, (status.downloaded / status.total) * 100)}%` }}
              />
            </div>
          ) : null}
        </div>
      )}
      {status.kind === 'installing' && (
        <p className="font-medium">Устанавливаю {status.version}, приложение перезапустится…</p>
      )}
      {status.kind === 'error' && (
        <p className="text-rose-400">Ошибка обновления: {status.message}</p>
      )}
    </div>
  );
};
