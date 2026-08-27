import { http } from '../http';
import type { SignupRequest, LoginRequest, TokenPairResponse, StatusResponse } from '../types';
import { setTokens } from '../stores/auth';

export async function signup(req: SignupRequest): Promise<TokenPairResponse> {
  const pair = await http.post<TokenPairResponse>('auth/signup', req, { auth: false });
  setTokens(pair);
  return pair;
}

export async function login(req: LoginRequest): Promise<TokenPairResponse> {
  const pair = await http.post<TokenPairResponse>('auth/login', req, { auth: false });
  setTokens(pair);
  return pair;
}

export function getStatus(): Promise<StatusResponse> {
  return http.get<StatusResponse>('auth/status', { auth: false });
}