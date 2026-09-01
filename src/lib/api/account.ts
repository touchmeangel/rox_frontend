import { http } from '../http';

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  revoke_other_sessions: boolean;
}

export function changePassword(req: ChangePasswordRequest): Promise<void> {
  return http.post<void>('api/account/password', req);
}