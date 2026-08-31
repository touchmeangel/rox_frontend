import { writable, derived, get } from 'svelte/store';
import { getStatus } from '../api/auth';

export type SignupMode = 'bootstrap' | 'open' | 'invite_only';

interface StatusState {
  mode: SignupMode | null;
  loading: boolean;
  error: string | null;
}

export const statusStore = writable<StatusState>({ mode: null, loading: false, error: null });

let inflight: Promise<void> | null = null;

export function loadStatus(): Promise<void> {
  if (get(statusStore).mode !== null) return Promise.resolve();
  if (inflight) return inflight;

  statusStore.update((s) => ({ ...s, loading: true, error: null }));
  inflight = getStatus()
    .then((res) => statusStore.set({ mode: res.mode as SignupMode, loading: false, error: null }))
    .catch(() => statusStore.set({ mode: null, loading: false, error: 'Failed to load signup status.' }))
    .finally(() => { inflight = null; });
  return inflight;
}

export const canLogin = derived(statusStore, ($s) => $s.mode === 'open' || $s.mode === 'invite_only');
export const canSignup = derived(statusStore, ($s) => $s.mode === 'bootstrap' || $s.mode === 'open');