import { http } from '../http';
import type {
  RunsResponse,
  CreateRunResponse,
  DeleteRunResponse,
  StartRunResponse,
  UploadRunResponse,
  ListRunFilesResponse,
} from '../types';

export function listRuns(limit = 20, cursor?: string): Promise<RunsResponse> {
  return http.get<RunsResponse>('api/agent/runs', { query: { limit, cursor } });
}

export function createRun(name: string): Promise<CreateRunResponse> {
  return http.post<CreateRunResponse>('api/agent/runs/create', { name });
}

export function deleteRun(runId: string): Promise<DeleteRunResponse> {
  return http.post<DeleteRunResponse>('api/agent/runs/delete', { run_id: runId });
}

export function startRun(runId: string): Promise<StartRunResponse> {
  return http.post<StartRunResponse>(`api/agent/runs/${encodeURIComponent(runId)}/start`);
}

export function uploadRunWorkspace(runId: string, file: File): Promise<UploadRunResponse> {
  const form = new FormData();
  form.append('workspace', file);
  return http.postForm<UploadRunResponse>(`api/agent/runs/${encodeURIComponent(runId)}/upload`, form);
}

export function listRunFiles(
  runId: string,
  path = '',
  limit = 50,
  cursor?: string
): Promise<ListRunFilesResponse> {
  return http.get<ListRunFilesResponse>(`api/agent/runs/${encodeURIComponent(runId)}/files`, {
    query: { path, limit, cursor },
  });
}