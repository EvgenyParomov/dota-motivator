export interface Logger {
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
}

const fmt = (level: string, msg: string, meta?: Record<string, unknown>) => {
  const ts = new Date().toISOString();
  const tail = meta ? ' ' + JSON.stringify(meta) : '';
  return `${ts} [${level}] ${msg}${tail}`;
};

export const consoleLogger: Logger = {
  info: (m, meta) => console.log(fmt('INFO', m, meta)),
  warn: (m, meta) => console.warn(fmt('WARN', m, meta)),
  error: (m, meta) => console.error(fmt('ERROR', m, meta)),
};
