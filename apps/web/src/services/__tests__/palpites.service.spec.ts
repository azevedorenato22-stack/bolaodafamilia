import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/api', () => {
  return {
    default: {
      post: vi.fn(async (url, payload) => ({ data: { url, payload } })),
      patch: vi.fn(async (url, payload) => ({ data: { url, payload } })),
    },
  };
});

import { criarPalpite, atualizarPalpite } from '../palpites.service';

describe('palpites.service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('envia criação de palpite para a rota correta', async () => {
    const res = await criarPalpite({
      jogoId: 'j1',
      golsCasa: 2,
      golsFora: 1,
      vencedorPenaltis: 'CASA',
    });
    expect(res.url).toBe('/api/palpites');
    expect(res.payload.jogoId).toBe('j1');
  });

  it('envia atualização de palpite para a rota correta', async () => {
    const res = await atualizarPalpite('p1', { golsCasa: 3, golsFora: 0 });
    expect(res.url).toBe('/api/palpites/p1');
    expect(res.payload.golsCasa).toBe(3);
  });
});
