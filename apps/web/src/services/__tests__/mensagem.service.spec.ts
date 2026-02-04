import { vi, describe, it, expect } from 'vitest';

vi.mock('@/lib/api', () => {
  return {
    default: {
      get: vi.fn(async (url: string) => ({ data: { url, conteudo: 'Olá' } })),
    },
  };
});

import { mensagemAtual } from '../mensagem.service';

describe('mensagem.service', () => {
  it('chama a rota de mensagem do dia', async () => {
    const res = await mensagemAtual();
    expect(res.url).toBe('/api/mensagem-dia');
  });
});
