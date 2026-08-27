declare global {
  interface Window {
    __APP_CONFIG__?: { VITE_API_BASE_URL?: string };
  }
}

function isUnsubstituted(v: string | undefined): boolean {
  return !v || v.startsWith('__') || v.includes('${');
}

const runtimeValue = typeof window !== 'undefined' ? window.__APP_CONFIG__?.VITE_API_BASE_URL : undefined;
const buildTimeValue = import.meta.env.VITE_API_BASE_URL;

const resolved = !isUnsubstituted(runtimeValue) ? runtimeValue : buildTimeValue;

if (!resolved) {
  // eslint-disable-next-line no-console
  console.error(
    '[config] No API base URL configured. Set VITE_API_BASE_URL in .env for dev, or API_BASE_URL at container runtime for prod.'
  );
}

export const config = {
  apiBaseUrl: (resolved && resolved.length > 0 ? resolved : 'http://localhost:8080').replace(/\/?$/, '/'),
};