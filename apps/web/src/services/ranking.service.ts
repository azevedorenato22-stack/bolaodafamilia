import api from '@/lib/api';

type RankingFilters = {
  usuarios?: string[];
  rodadaId?: string;
  status?: string;
  data?: string;
};

export async function rankingGeral(bolaoId: string, filters: RankingFilters = {}) {
  const params: any = {};
  if (filters.rodadaId) params.rodadaId = filters.rodadaId;
  if (filters.status) params.status = filters.status;
  if (filters.data) params.data = filters.data;
  const { data } = await api.get(`/api/ranking/bolao/${bolaoId}`, { params });
  return data;
}

export async function rankingFiltrado(bolaoId: string, filters: RankingFilters = {}) {
  const params: any = {};
  if (filters.usuarios && filters.usuarios.length > 0)
    params.usuarios = filters.usuarios.join(',');
  if (filters.rodadaId) params.rodadaId = filters.rodadaId;
  if (filters.status) params.status = filters.status;
  if (filters.data) params.data = filters.data;
  const { data } = await api.get(`/api/ranking/bolao/${bolaoId}/filtrado`, { params });
  return data;
}

export async function extratoUsuario(bolaoId: string, usuarioId: string) {
  const { data } = await api.get(`/api/ranking/bolao/${bolaoId}/usuario/${usuarioId}`);
  return data;
}
