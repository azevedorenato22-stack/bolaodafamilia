import { RankingService } from "./ranking.service";

function createMockPrisma() {
  return {
    bolao: {
      findUnique: jest.fn().mockResolvedValue({ id: "b1", nome: "Bolão" }),
    },
    bolaoUsuario: {
      findMany: jest
        .fn()
        .mockResolvedValue([
          { usuario: { id: "u1", nome: "Ana" } },
          { usuario: { id: "u2", nome: "Beto" } },
        ]),
    },
    palpite: {
      findMany: jest.fn().mockResolvedValue([
        {
          usuarioId: "u1",
          pontuacao: 6,
          tipoPontuacao: "placar_vencedor",
        },
        {
          usuarioId: "u1",
          pontuacao: 3,
          tipoPontuacao: "vencedor_simples",
        },
        {
          usuarioId: "u2",
          pontuacao: 10,
          tipoPontuacao: "placar_exato",
        },
      ]),
    },
    palpiteCampeao: {
      findMany: jest.fn().mockResolvedValue([
        { usuarioId: "u1", pontuacao: 0 },
        { usuarioId: "u2", pontuacao: 3 },
      ]),
    },
  } as any;
}

describe("RankingService", () => {
  it("ordena com critérios de desempate (total > jogos > PC > PV > DG > PP > V)", async () => {
    const prisma = createMockPrisma();
    const service = new RankingService(prisma);

    const ranking = await service.rankingGeral({ bolaoId: "b1" });

    expect(ranking[0].usuarioId).toBe("u2"); // maior total (10+3=13 vs 9)
    expect(ranking[1].usuarioId).toBe("u1");
    expect(ranking[0].pc).toBe(1);
    expect(ranking[1].pv).toBe(2);
  });

  it("extrato retorna palpites de jogos e campeões do usuário filtrado", async () => {
    const prisma = createMockPrisma();
    prisma.palpite.findMany.mockResolvedValue([
      {
        id: "p1",
        jogo: {
          id: "j1",
          dataHora: new Date(),
          status: "ENCERRADO",
          timeCasa: { nome: "A" },
          timeFora: { nome: "B" },
          resultadoCasa: 1,
          resultadoFora: 0,
        },
        golsCasa: 1,
        golsFora: 0,
        pontuacao: 3,
        tipoPontuacao: "vencedor_simples",
        calculadoEm: new Date(),
        createdAt: new Date(),
      },
    ]);
    prisma.palpiteCampeao.findMany.mockResolvedValue([
      {
        id: "pc1",
        campeao: {
          id: "c1",
          nome: "Campeão",
          dataLimite: new Date(),
          resultadoFinal: { nome: "Time X" },
        },
        timeEscolhido: { nome: "Time Y" },
        pontuacao: 0,
        calculadoEm: null,
        createdAt: new Date(),
      },
    ]);

    const service = new RankingService(prisma);
    const extrato = await service.extratoUsuario("b1", "u1");

    expect(extrato.palpitesJogos).toHaveLength(1);
    expect(extrato.palpitesCampeao).toHaveLength(1);
    expect(extrato.bolao.id).toBe("b1");
  });
});
