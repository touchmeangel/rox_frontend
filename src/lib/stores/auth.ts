import { writable, derived } from 'svelte/store';
import type { TokenPairResponse } from '../types';

const STORAGE_KEY = 'rox_auth';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: string | null;
}

const empty: AuthState = { accessToken: null, refreshToken: null, accessTokenExpiresAt: null };

function loadInitial(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : empty;
  } catch {
    return empty;
  }
}

export const authStore = writable<AuthState>(loadInitial());

authStore.subscribe((state) => {
  try {
    if (state.accessToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
  }
});

export function setTokens(pair: TokenPairResponse): void {
  authStore.set({
    accessToken: pair.access_token,
    refreshToken: pair.refresh_token,
    accessTokenExpiresAt: pair.access_token_expires_at,
  });
}

export function clearAuth(): void {
  authStore.set(empty);
}

export const isAuthenticated = derived(authStore, ($s) => Boolean($s.accessToken));

function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as T;
  } catch {
    return null;
  }
}

export const currentUser = derived(authStore, ($s) => {
  if (!$s.accessToken) return null;
  return decodeJwtPayload<{ sub?: string; roles?: string[]; email?: string; username?: string; exp?: number }>($s.accessToken);
});