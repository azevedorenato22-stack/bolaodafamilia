import api from '@/lib/api';

export async function mensagemAtual() {
  const { data } = await api.get('/api/mensagem-dia');
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

export async function removerMensagem() {
  const { data } = await api.delete('/api/mensagem-dia');
  return data;
}
