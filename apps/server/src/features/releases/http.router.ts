import { Router } from 'express';

const GITHUB_REPO = 'EvgenyParomov/dota-motivator';
const CACHE_TTL_MS = 10 * 60 * 1000;

type LatestRelease = {
  version: string;
  publishedAt: string;
  notes: string;
  htmlUrl: string;
  downloads: {
    nsis?: { name: string; url: string; size: number };
    msi?: { name: string; url: string; size: number };
  };
};

let cache: { value: LatestRelease; fetchedAt: number } | null = null;
let inflight: Promise<LatestRelease> | null = null;

const fetchLatest = async (): Promise<LatestRelease> => {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, { headers });
  if (!resp.ok) throw new Error(`github ${resp.status}: ${await resp.text()}`);
  const r = (await resp.json()) as {
    tag_name: string;
    body: string | null;
    published_at: string;
    html_url: string;
    assets: Array<{ name: string; browser_download_url: string; size: number }>;
  };

  const nsis = r.assets.find((a) => a.name.endsWith('-setup.exe'));
  const msi = r.assets.find((a) => a.name.endsWith('.msi'));

  return {
    version: r.tag_name.replace(/^v/, ''),
    publishedAt: r.published_at,
    notes: r.body ?? '',
    htmlUrl: r.html_url,
    downloads: {
      ...(nsis && { nsis: { name: nsis.name, url: nsis.browser_download_url, size: nsis.size } }),
      ...(msi && { msi: { name: msi.name, url: msi.browser_download_url, size: msi.size } }),
    },
  };
};

const getCached = async (): Promise<LatestRelease> => {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.value;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const value = await fetchLatest();
      cache = { value, fetchedAt: Date.now() };
      return value;
    } finally {
      inflight = null;
    }
  })();
  try {
    return await inflight;
  } catch (e) {
    if (cache) return cache.value;
    throw e;
  }
};

export const buildReleasesRouter = (): Router => {
  const r = Router();
  r.get('/latest', async (_req, res) => {
    try {
      const data = await getCached();
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json(data);
    } catch (e) {
      res.status(502).json({ error: 'release_fetch_failed', message: e instanceof Error ? e.message : String(e) });
    }
  });
  return r;
};
