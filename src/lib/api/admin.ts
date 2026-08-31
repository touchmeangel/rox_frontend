import { http } from '../http';

export function setSignupMode(open: boolean): Promise<{ open: boolean }> {
  return http.post<{ open: boolean }>('api/admin/signup_mode', { open });
}