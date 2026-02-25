import { vi, describe, it, expect } from 'vitest';

vi.mock('@/lib/api', () => {
  return {
    default: {
      get: vi.fn(async (url: string) => ({ data: { url, conteudo: 'Olá' } })),
    },
  };
});

import { mensagensAtivas } from '../mensagem.service';

describe('mensagem.service', () => {
  it('chama a rota de mensagens ativas', async () => {
    const res = await mensagensAtivas();
    expect(res.url).toBe('/api/mensagem-dia/ativas');
  });
});
