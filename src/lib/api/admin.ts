import { http } from '../http';

export function openSignup(): Promise<void> {
  return http.post<void>('api/admin/open_signup');
}

export function closeSignup(): Promise<void> {
  return http.post<void>('api/admin/close_signup');
}