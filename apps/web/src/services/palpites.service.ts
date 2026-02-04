import api from '@/lib/api';

export async function criarPalpite(payload: {
  jogoId: string;
  golsCasa: number;
  golsFora: number;
  vencedorPenaltis?: 'CASA' | 'FORA';
}) {
  const { data } = await api.post('/api/palpites', payload);
  return data;
}

export async function atualizarPalpite(
  id: string,
  payload: Partial<{
    jogoId: string;
    golsCasa: number;
    golsFora: number;
    vencedorPenaltis?: 'CASA' | 'FORA';
  }>,
) {
  const { data } = await api.patch(`/api/palpites/${id}`, payload);
  return data;
}

export async function listarPalpitesDoJogo(jogoId: string) {
  const { data } = await api.get(`/api/palpites/jogo/${jogoId}`);
  return data;
}

export async function listarMeusPalpites(bolaoId: string) {
  const { data } = await api.get('/api/palpites/me', { params: { bolaoId } });
  return data;
}
