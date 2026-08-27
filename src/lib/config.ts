const raw = import.meta.env.VITE_API_BASE_URL;

if (!raw) {
  // eslint-disable-next-line no-console
  console.error(
    '[config] VITE_API_BASE_URL is not set. Copy .env.example to .env, set it, and restart the dev server.'
  );
}

export const config = {
  apiBaseUrl: (raw && raw.length > 0 ? raw : 'http://localhost:8080').replace(/\/?$/, '/'),
};