import { writable } from 'svelte/store';

export type Route =
  | { name: 'login' }
  | { name: 'signup' }
  | { name: 'runs' }
  | { name: 'run-detail'; runId: string }
  | { name: 'admin' }
  | { name: 'not-found' };

function parseLocation(): Route {
  const segments = window.location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return { name: 'runs' };
  if (segments[0] === 'login') return { name: 'login' };
  if (segments[0] === 'signup') return { name: 'signup' };
  if (segments[0] === 'admin') return { name: 'admin' };
  if (segments[0] === 'runs' && segments.length === 1) return { name: 'runs' };
  if (segments[0] === 'runs' && segments.length === 2) {
    return { name: 'run-detail', runId: decodeURIComponent(segments[1]) };
  }
  return { name: 'not-found' };
}

export const route = writable<Route>(parseLocation());

window.addEventListener('popstate', () => route.set(parseLocation()));

export function navigate(path: string): void {
  window.history.pushState({}, '', path);
  route.set(parseLocation());
}