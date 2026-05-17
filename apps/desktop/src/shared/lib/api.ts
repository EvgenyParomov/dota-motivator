import { authStorage } from './auth-storage.js';

const DEFAULT_BASE_URL = 'http://localhost:4000';

export const getServerBaseUrl = (): string => {
  const fromEnv = (import.meta.env as Record<string, string | undefined>).VITE_SERVER_URL;
  return fromEnv ?? DEFAULT_BASE_URL;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const api = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const token = authStorage.get();
  const headers = new Headers(init.headers);
  if (!headers.has('content-type') && init.body) {
    headers.set('content-type', 'application/json');
  }
  if (token) headers.set('authorization', `Bearer ${token}`);

  const resp = await fetch(`${getServerBaseUrl()}${path}`, { ...init, headers });
  if (resp.status === 204) return undefined as T;
  const text = await resp.text();
  const body = text ? JSON.parse(text) : null;
  if (!resp.ok) {
    throw new ApiError(resp.status, (body?.error as string) ?? 'UNKNOWN', body?.message ?? resp.statusText);
  }
  return body as T;
};

export const apiUrl = (path: string): string => `${getServerBaseUrl()}${path}`;
