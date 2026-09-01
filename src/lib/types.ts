export interface TokenPairResponse {
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string;
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface StatusResponse {
  mode: string;
}

export interface RunSummary {
  id: string;
  name: string;
  status: string;
  workspace_folder: string;
  created_at: string;
}

export interface RunsResponse {
  runs: RunSummary[];
  next_cursor?: string;
}

export interface CreateRunResponse {
  run_id: string;
}

export interface DeleteRunResponse {
  freed_bytes: number;
}

export interface StartRunResponse {
  run_id: string;
  status: string;
}

export interface UploadRunResponse {
  uploaded_bytes: number;
}

export interface FileEntry {
  name: string;
  is_folder: boolean;
  size?: number;
  last_modified?: string;
}

export interface ListRunFilesResponse {
  path: string;
  entries: FileEntry[];
  next_cursor?: string;
}