import { CampeoesService } from "./campeoes.service";

const now = new Date("2026-02-26T12:00:00.000Z");
const past = new Date("2026-02-20T12:00:00.000Z");
const future = new Date("2026-03-05T12:00:00.000Z");

function createMockPrisma(overrides: any = {}) {
  return {
    bolao: {
      findUnique: jest.fn().mockResolvedValue({ id: "b1" }),
      ...overrides.bolao,
    },
    campeao: {
      findUnique: jest.fn().mockResolvedValue({
        id: "c1",
        bolaoId: "b1",
        nome: "Campeao Geral",
        descricao: null,
        dataLimite: past,
        pontuacao: null,
        resultadoFinalId: "t1",
        definidoEm: past,
      }),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockImplementation(async ({ data }: any) => ({
        id: "c1",
        ...data,
      })),
      ...overrides.campeao,
    },
    bolaoTime: {
      findFirst: jest.fn().mockResolvedValue({ bolaoId: "b1", timeId: "t1" }),
      ...overrides.bolaoTime,
    },
    palpiteCampeao: {
      updateMany: jest.fn().mockResolvedValue({ count: 3 }),
      ...overrides.palpiteCampeao,
    },
  } as any;
}

describe("CampeoesService - reabertura por data", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("reabre automaticamente quando data limite muda para futuro", async () => {
    const prisma = createMockPrisma();
    const service = new CampeoesService(prisma);

    const updated = await service.update("c1", {
      dataLimite: future.toISOString(),
    } as any);

    expect(prisma.campeao.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: expect.objectContaining({
          resultadoFinalId: null,
          definidoEm: null,
        }),
      }),
    );
    expect(prisma.palpiteCampeao.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { campeaoId: "c1" },
        data: { pontuacao: 0, calculadoEm: null },
      }),
    );
    expect(updated.resultadoFinalId).toBeNull();
  });
});
