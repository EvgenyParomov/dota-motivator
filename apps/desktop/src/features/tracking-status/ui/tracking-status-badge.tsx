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
};

const Pill = ({ status, labelOk, labelDown, title }: PillProps) => (
  <div
    className="flex items-center gap-1.5 rounded-md border bg-background/80 px-2 py-1 backdrop-blur"
    title={title}
  >
    <span className={`size-2 rounded-full ${dotClass(status)}`} />
    <span>{status === 'unknown' ? '…' : status === 'ok' ? labelOk : labelDown}</span>
  </div>
);

export const TrackingStatusBadge = () => {
  const s = useTrackingStatus();
  return (
    <div className="text-muted-foreground pointer-events-auto fixed top-3 right-3 z-40 flex items-center gap-2 text-xs">
      <Pill
        status={s.server}
        labelOk="Сервер"
        labelDown="Сервер offline"
        title="GET /health на backend"
      />
      <Pill
        status={s.listener}
        labelOk="GSI :7383"
        labelDown="GSI offline"
        title="Локальный listener Dota GSI событий"
      />
      <Pill
        status={s.dota}
        labelOk="Dota запущена"
        labelDown="Dota не запущена"
        title="Процесс dota2.exe в системе"
      />
    </div>
  );
};
