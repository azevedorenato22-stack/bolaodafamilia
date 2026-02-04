import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(async (url, opts?: any) => ({ data: { url, params: opts?.params } })),
  },
}));

import { rankingGeral, rankingFiltrado, extratoUsuario } from '../ranking.service';

describe('ranking.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('monta params de filtros no ranking geral', async () => {
    const res = await rankingGeral('bolao-1', {
      rodadaId: 'rodada-1',
      status: 'ENCERRADO',
      data: '2025-01-01',
    });
    expect(res.params).toMatchObject({
      rodadaId: 'rodada-1',
      status: 'ENCERRADO',
      data: '2025-01-01',
    });
    expect(res.url).toContain('/api/ranking/bolao/bolao-1');
  });

  it('monta params de filtros e usuários no ranking filtrado', async () => {
    const res = await rankingFiltrado('bolao-1', {
      usuarios: ['u1', 'u2'],
      status: 'PALPITES',
    });
    expect(res.params.usuarios).toBe('u1,u2');
    expect(res.params.status).toBe('PALPITES');
  });

  it('chama extrato sem filtros extras', async () => {
    const res = await extratoUsuario('bolao-1', 'u1');
    expect(res.url).toBe('/api/ranking/bolao/bolao-1/usuario/u1');
  });
});
