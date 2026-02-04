import api from '../lib/api';

export type JogosFilters = {
  bolaoId?: string;
  rodadaId?: string;
  status?: string;
  data?: string;
  periodo?: 'HOJE' | 'FUTURO';
};

export async function listarJogos(filters: JogosFilters = {}) {
  const { data } = await api.get('/api/jogos', { params: filters });
  return data;
}

export async function criarJogo(payload: any) {
  const { data } = await api.post('/api/jogos', payload);
  return data;
}

export async function excluirJogo(id: string, confirm = true, senha?: string) {
  const { data } = await api.delete(`/api/jogos/${id}`, { params: { confirm, senha } });
  return data;
}

export async function atualizarJogo(id: string, payload: any) {
  const { data } = await api.patch(`/api/jogos/${id}`, payload);
  return data;
}
