import { get } from 'svelte/store';
import { http, ApiError, buildUrl, refreshAccessToken } from '../http';
import { authStore } from '../stores/auth';
import type { UploadRunResponse } from '../types';

const MAX_RETRIES_PER_CHUNK = 3;

interface StartUploadResponse {
  offset: number;
  chunk_size: number;
}

interface AppendUploadResponse {
  offset: number;
}

interface XhrOpts {
  resyncOn409?: boolean;
  onProgress?: (loaded: number) => void;
}

function xhrRequest<T>(
  path: string,
  query: Record<string, string | number>,
  body: Blob,
  opts: XhrOpts = {},
  isRetry = false
): Promise<T> {
  return new Promise((resolve, reject) => {
    const state = get(authStore);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', buildUrl(path, query), true);
    if (state.accessToken) xhr.setRequestHeader('Authorization', `Bearer ${state.accessToken}`);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    if (opts.onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) opts.onProgress!(e.loaded);
      });
    }

    xhr.onload = () => {
      if (xhr.status === 401 && !isRetry) {
        refreshAccessToken()
          .then(() => xhrRequest<T>(path, query, body, opts, true).then(resolve, reject))
          .catch(reject);
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve((xhr.responseText ? JSON.parse(xhr.responseText) : undefined) as T);
        return;
      }

      if (xhr.status === 409 && opts.resyncOn409) {
        resolve(JSON.parse(xhr.responseText) as T);
        return;
      }

      const message = xhr.responseText.trim() || xhr.statusText;
      reject(new ApiError(xhr.status, message));
    };
    xhr.onerror = () => reject(new ApiError(0, 'Network error during upload'));
    xhr.send(body);
  });
}

async function appendChunkWithRetry(
  runId: string,
  offset: number,
  chunk: Blob,
  onChunkProgress: (loaded: number) => void
): Promise<number> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES_PER_CHUNK; attempt++) {
    try {
      const res = await xhrRequest<AppendUploadResponse>(
        `api/agent/runs/${encodeURIComponent(runId)}/upload/append`,
        { offset },
        chunk,
        { resyncOn409: true, onProgress: onChunkProgress }
      );
      return res.offset;
    } catch (err) {
      lastErr = err;
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  throw lastErr;
}

export async function uploadRunWorkspaceChunked(
  runId: string,
  file: File,
  onProgress?: (fraction: number) => void
): Promise<UploadRunResponse> {
  const start = await http.post<StartUploadResponse>(
    `api/agent/runs/${encodeURIComponent(runId)}/upload/start`,
    { expected_total_bytes: file.size }
  );

  let offset = start.offset;
  const chunkSize = start.chunk_size; // trust the server's configured size, never hardcode it client-side

  while (offset + chunkSize <= file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    const chunkStart = offset;
    offset = await appendChunkWithRetry(runId, offset, chunk, (loaded) =>
      onProgress?.((chunkStart + loaded) / file.size)
    );
    onProgress?.(offset / file.size);
  }

  const tail = file.slice(offset, file.size); // may be zero-length if file.size is an exact multiple of chunkSize
  const tailStart = offset;
  const result = await xhrRequest<UploadRunResponse>(
    `api/agent/runs/${encodeURIComponent(runId)}/upload/finish`,
    {},
    tail,
    { onProgress: (loaded) => onProgress?.((tailStart + loaded) / file.size) } // no resyncOn409 — finish's 409 is a real error, not resumable
  );
  onProgress?.(1);
  return result;
}