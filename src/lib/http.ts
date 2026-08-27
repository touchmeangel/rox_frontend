import { get } from 'svelte/store';
import { config } from './config';
import { authStore, setTokens, clearAuth } from './stores/auth';
import type { TokenPairResponse } from './types';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  isForm?: boolean;
  auth?: boolean; // default true
  query?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(path.replace(/^\//, ''), config.apiBaseUrl);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text.trim() || res.statusText;
  } catch {
    return res.statusText;
  }
}

let refreshPromise: Promise<void> | null = null;

// Backend's /auth/refresh isn't in the code you shared — this assumes it takes
// {"refresh_token": "..."} and returns the same shape as login/signup. Adjust if not.
async function refreshAccessToken(): Promise<void> {
  const state = get(authStore);
  if (!state.refreshToken) {
    clearAuth();
    throw new ApiError(401, 'No refresh token available; please log in again.');
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(buildUrl('auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: state.refreshToken }),
      });
      if (!res.ok) {
        clearAuth();
        throw new ApiError(res.status, await parseErrorBody(res));
      }
      const pair = (await res.json()) as TokenPairResponse;
      setTokens(pair);
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function doFetch<T>(path: string, opts: RequestOptions, isRetry = false): Promise<T> {
  const { method = 'GET', body, isForm = false, auth = true, query } = opts;
  const headers: Record<string, string> = {};
  const init: RequestInit = { method, headers };

  if (auth) {
    const state = get(authStore);
    if (state.accessToken) headers['Authorization'] = `Bearer ${state.accessToken}`;
  }

  if (body !== undefined) {
    if (isForm) {
      init.body = body as FormData; // let the browser set the multipart boundary
    } else {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
  }

  const res = await fetch(buildUrl(path, query), init);

  if (res.status === 401 && auth && !isRetry) {
    await refreshAccessToken();
    return doFetch<T>(path, opts, true);
  }

  if (!res.ok) {
    const message = await parseErrorBody(res); // backend uses http.Error → plain text, not JSON
    if (res.status === 401) clearAuth();
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  return undefined as T;
}

export const http = {
  get: <T>(path: string, opts: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    doFetch<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    doFetch<T>(path, { ...opts, method: 'POST', body }),
  postForm: <T>(path: string, form: FormData, opts: Omit<RequestOptions, 'method' | 'body' | 'isForm'> = {}) =>
    doFetch<T>(path, { ...opts, method: 'POST', body: form, isForm: true }),
};