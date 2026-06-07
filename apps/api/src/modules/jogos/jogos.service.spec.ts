import { JogosService } from "./jogos.service";
import { StatusJogo } from "@prisma/client";

const past = new Date("2020-01-01T12:00:00.000Z");
const future = new Date("2030-01-01T12:00:00.000Z");

const existingFechado = {
  id: "j1",
  bolaoId: "b1",
  rodadaId: "r1",
  timeCasaId: "tc1",
  timeForaId: "tf1",
  dataHora: past,
  status: StatusJogo.FECHADO,
  mataMata: false,
  resultadoCasa: 2,
  resultadoFora: 1,
  vencedorPenaltis: null,
  local: "Estádio Antigo",
  encerradoEm: null,
  createdAt: past,
  updatedAt: past,
  bolao: { id: "b1", nome: "Bolão Teste" },
  rodada: { id: "r1", nome: "Rodada 1" },
  timeCasa: { id: "tc1", nome: "Time Casa", escudoUrl: null },
  timeFora: { id: "tf1", nome: "Time Fora", escudoUrl: null },
};

function createMockPrisma(overrides: any = {}) {
  const jogoUpdate = jest.fn().mockImplementation(async ({ data }: any) => ({
    id: "j1",
    ...data,
    bolao: { id: "b1", nome: "Bolão Teste" },
    rodada: { id: "r1", nome: "Rodada 1" },
    timeCasa: { id: "tc1", nome: "Time Casa", escudoUrl: null },
    timeFora: { id: "tf1", nome: "Time Fora", escudoUrl: null },
  }));

  return {
    jogo: {
      findUnique: jest.fn().mockResolvedValue({ ...existingFechado }),
      update: jogoUpdate,
      findFirst: jest.fn().mockResolvedValue(null),
      ...overrides.jogo,
    },
    bolao: {
      findUnique: jest.fn().mockResolvedValue({ id: "b1" }),
      ...overrides.bolao,
    },
    rodada: {
      findUnique: jest.fn().mockResolvedValue({ id: "r1" }),
      ...overrides.rodada,
    },
    bolaoRodada: {
      findFirst: jest.fn().mockResolvedValue({ bolaoId: "b1", rodadaId: "r1" }),
      ...overrides.bolaoRodada,
    },
    time: {
      findUnique: jest.fn().mockResolvedValue({ id: "t1" }),
      ...overrides.time,
    },
    bolaoTime: {
      count: jest.fn().mockResolvedValue(2),
      ...overrides.bolaoTime,
    },
  } as any;
}

describe("JogosService - auto-reabertura FECHADO", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-07T12:00:00.000Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("reabre automaticamente para PALPITES quando dataHora muda para o futuro", async () => {
    const prisma = createMockPrisma();
    const service = new JogosService(prisma);

    const updated = await service.update("j1", {
      dataHora: future.toISOString(),
    } as any);

    expect(prisma.jogo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "j1" },
        data: expect.objectContaining({
          status: StatusJogo.PALPITES,
          resultadoCasa: null,
          resultadoFora: null,
        }),
      }),
    );
    expect(updated.status).toBe(StatusJogo.PALPITES);
  });

  it("mantem FECHADO quando edita outro campo sem alterar dataHora", async () => {
    const prisma = createMockPrisma();
    const service = new JogosService(prisma);

    const updated = await service.update("j1", {
      local: "Estádio Novo",
    } as any);

    expect(prisma.jogo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "j1" },
        data: expect.objectContaining({
          status: StatusJogo.FECHADO,
        }),
      }),
    );
    expect(updated.status).toBe(StatusJogo.FECHADO);
  });
});
