import api from '../lib/api';

export async function listarRodadas(ativo?: boolean, bolaoId?: string) {
  const params: any = {};
  if (ativo !== undefined) params.ativo = ativo;
  if (bolaoId) params.bolaoId = bolaoId;

  const { data } = await api.get('/api/rodadas', { params });
  return data;
}

export async function criarRodada(payload: {
  nome: string;
  numeroOrdem?: number;
  descricao?: string;
  ativo?: boolean;
}) {
  const { data } = await api.post('/api/rodadas', payload);
  return data;
}

export async function atualizarRodada(id: string, payload: any) {
  const { data } = await api.patch(`/api/rodadas/${id}`, payload);
  return data;
}

export async function excluirRodada(id: string, senha?: string) {
  const { data } = await api.delete(`/api/rodadas/${id}`, { params: { senha } });
  return data;
}
