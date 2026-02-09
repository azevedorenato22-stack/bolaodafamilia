import api from '../lib/api';

type LoginPayload = { nome: string; senha: string };
type RegisterPayload = { nome: string; senha: string };

export async function login(payload: LoginPayload) {
  const { data } = await api.post('/api/auth/login', payload);
  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post('/api/auth/register', payload);
  return data;
}

export async function me() {
  const { data } = await api.get('/api/auth/me');
  return data;
}
