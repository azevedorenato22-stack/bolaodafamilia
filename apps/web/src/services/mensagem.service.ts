import api from '@/lib/api';

export async function mensagensAtivas() {
  const { data } = await api.get('/api/mensagem-dia/ativas');
  return data;
}

export async function salvarMensagem(payload: {
  titulo?: string;
  conteudo: string;
  tipo?: string;
  dataInicio?: string;
  dataFim?: string;
  ativo?: boolean;
}) {
  const { data } = await api.post('/api/mensagem-dia', payload);
  return data;
}

export async function listarMensagens() {
  const { data } = await api.get('/api/mensagem-dia/admin');
  return data;
}

export async function removerMensagem(id: string) {
  const { data } = await api.delete(`/api/mensagem-dia/${id}`);
  return data;
}

export async function atualizarMensagem(id: string, payload: {
  ativo?: boolean;
  titulo?: string;
  conteudo?: string;
  tipo?: string;
  dataInicio?: string;
  dataFim?: string;
}) {
  const { data } = await api.patch(`/api/mensagem-dia/${id}`, payload);
  return data;
}
