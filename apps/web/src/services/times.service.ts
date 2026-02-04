import api from '../lib/api';

export async function listarTimes() {
  const { data } = await api.get('/api/times');
  return data;
}

export async function criarTime(payload: any) {
  const { data } = await api.post('/api/times', payload);
  return data;
}

export async function excluirTime(id: string, senha?: string) {
  const { data } = await api.delete(`/api/times/${id}`, { params: { senha } });
  return data;
}

export async function atualizarTime(id: string, payload: any) {
  const { data } = await api.patch(`/api/times/${id}`, payload);
  return data;
}
