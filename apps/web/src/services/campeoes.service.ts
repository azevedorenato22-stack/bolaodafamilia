import api from '../lib/api';

export async function listarCampeoesPorBolao(bolaoId: string) {
  const { data } = await api.get(`/api/campeoes/bolao/${bolaoId}`);
  return data;
}

export async function criarCampeao(payload: any) {
  const { data } = await api.post('/api/campeoes', payload);
  return data;
}

export async function atualizarCampeao(id: string, payload: any) {
  const { data } = await api.patch(`/api/campeoes/${id}`, payload);
  return data;
}

export async function excluirCampeao(id: string, senha?: string) {
  const { data } = await api.delete(`/api/campeoes/${id}`, { params: { senha } });
  return data;
}

export async function listarPalpitesCampeao(campeaoId: string) {
  const { data } = await api.get(`/api/campeoes/${campeaoId}/palpites`);
  return data;
}

export async function criarPalpiteCampeao(payload: { campeaoId: string; timeId: string }) {
  const { data } = await api.post('/api/campeoes/palpites', payload);
  return data;
}

export async function atualizarPalpiteCampeao(
  id: string,
  payload: { campeaoId?: string; timeId?: string },
) {
  const { data } = await api.patch(`/api/campeoes/palpites/${id}`, payload);
  return data;
}

export async function atualizarPalpiteCampeaoAdmin(
  id: string,
  payload: { campeaoId?: string; timeId?: string },
) {
  const { data } = await api.patch(`/api/campeoes/palpites/${id}/admin`, payload);
  return data;
}
