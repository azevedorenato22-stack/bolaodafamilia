import { UnauthorizedException } from "@nestjs/common";
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
      delete: jest.fn().mockResolvedValue({ id: "c1" }),
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
    $transaction: jest.fn().mockImplementation(async (fn: any) => fn()),
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

describe("CampeoesService - remocao", () => {
  it("rejeita remocao sem senha de confirmacao", async () => {
    const prisma = createMockPrisma();
    const service = new CampeoesService(prisma);

    await expect(
      service.remove("c1"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("permite remover campeao com resultadoFinalId definido via cascade do Prisma", async () => {
    const deleteSpy = jest.fn().mockResolvedValue({ id: "c1" });
    const prisma = createMockPrisma({
      campeao: {
        findUnique: jest.fn().mockResolvedValue({
          id: "c1",
          resultadoFinalId: "t1",
        }),
        delete: deleteSpy,
      },
    });
    const service = new CampeoesService(prisma);

    const result = await service.remove("c1", "senha123");

    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: "c1" } });
    expect(result).toEqual({ message: "Campeão removido com sucesso" });
  });
});
