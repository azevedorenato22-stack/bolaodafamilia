import api from '../lib/api';

export async function listarBoloesAtivos() {
  const { data } = await api.get('/api/boloes');
  return data;
}

export async function listarMeusBoloes() {
  const { data } = await api.get('/api/boloes/me');
  return data;
}

export async function listarBoloesDisponiveis() {
  const { data } = await api.get('/api/boloes/disponiveis');
  return data;
}

export async function entrarNoBolao(bolaoId: string) {
  const { data } = await api.post(`/api/boloes/${bolaoId}/entrar`);
  return data;
}

export async function sairDoBolao(bolaoId: string) {
  const { data } = await api.delete(`/api/boloes/${bolaoId}/sair`);
  return data;
}

export async function listarBoloesAdmin() {
  const { data } = await api.get('/api/boloes/admin/all');
  return data;
}

export async function criarBolao(payload: any) {
  const { data } = await api.post('/api/boloes', payload);
  return data;
}

export async function excluirBolao(id: string, senhaConfirmacao?: string) {
  // backend não exige senha, mas confirmamos via UI
  const { data } = await api.delete(`/api/boloes/${id}`, { params: { senha: senhaConfirmacao } });
  return data;
}

export async function atualizarBolao(id: string, payload: any) {
  const { data } = await api.patch(`/api/boloes/${id}`, payload);
  return data;
}

export async function toggleBolaoAtivo(id: string) {
  const { data } = await api.patch(`/api/boloes/${id}/toggle-active`);
  return data;
}
