import api from '../lib/api';

export async function salvarPalpite(payload: { jogoId: string; golsCasa: number; golsFora: number; vencedorPenaltis?: string }) {
  const { data } = await api.post('/api/palpites', payload);
  return data;
}

export async function atualizarPalpite(id: string, payload: { golsCasa: number; golsFora: number; vencedorPenaltis?: string }) {
  const { data } = await api.patch(`/api/palpites/${id}`, payload);
  return data;
}

export async function listarMeusPalpites(bolaoId: string) {
  const { data } = await api.get('/api/palpites/me', { params: { bolaoId } });
  return data;
}

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

export async function listarPalpitesDoJogo(jogoId: string) {
  const { data } = await api.get(`/api/jogos/${jogoId}/palpites`);
  return data;
}
